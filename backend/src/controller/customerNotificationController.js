const orderModel = require("../models/order.model");
const productModel = require("../models/productUpload.model");
const customerNotificationModel = require("../models/customerNotification.model");
const customerNotificationDismissalModel = require("../models/customerNotificationDismissal.model");
const productReviewModel = require("../models/productReview.model");
const mongoose = require("mongoose");
const { publishUpdate } = require("../utils/liveUpdates");

function formatStatus(status) {
    return String(status || "pending")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatOrderNotifications(userId, orders) {
    return orders.flatMap((order) => {
        const timeline = Array.isArray(order.timeline) ? order.timeline : [];
        const updates = timeline.length > 0
            ? timeline
            : [{ status: order.status, changedAt: order.updatedAt || order.createdAt }];

        return updates.flatMap((update, index) => {
            const status = formatStatus(update.status || order.status);
            const orderNotification = {
                user: userId,
                sourceKey: `order:${order._id}:${update._id || index}`,
                kind: "order",
                relatedId: String(order._id),
                title: `Order #${String(order._id).slice(-8)} is ${status.toLowerCase()}`,
                description: index === 0 && status === "Pending"
                    ? "Your order has been placed."
                    : "Your order status has been updated.",
                date: update.changedAt || order.createdAt || order.updatedAt,
                to: "/my-orders",
                isRead: false,
                isDeleted: false,
            };
            const notifications = [orderNotification];
            if (status.toLowerCase() === "delivered") {
                const seenProducts = new Set();
                for (const item of order.products || []) {
                    const product = item.product;
                    const productId = String(product?._id || product || "");
                    if (!productId || seenProducts.has(productId)) continue;
                    seenProducts.add(productId);
                    notifications.push({
                        user: userId,
                        sourceKey: `review:${order._id}:${productId}`,
                        kind: "review",
                        relatedId: productId,
                        title: `Review ${product?.title || "your delivered product"}`,
                        description: "Your order was delivered. Share a star rating, comment, and photos or video.",
                        date: update.changedAt || order.createdAt || order.updatedAt,
                        to: `/my-orders/${order._id}/review/${productId}`,
                        isRead: false,
                        isDeleted: false,
                    });
                }
            }
            return notifications;
        });
    });
}

function formatOfferNotifications(userId, products) {
    return products.map((product) => ({
        user: userId,
        sourceKey: `product:${product._id}`,
        kind: "offer",
        relatedId: String(product._id),
        title: product.section === "free-delivery"
            ? `Special offer: ${product.title}`
            : `Best deal: ${product.title}`,
        description: product.discountPercentage > 0
            ? `Save ${Number(product.discountPercentage)}% while this offer lasts.`
            : product.section === "free-delivery"
                ? "Enjoy free delivery on this featured item."
                : "Discover this featured deal.",
        date: product.updatedAt || product.createdAt,
        to: `/product/${product._id}`,
        isRead: false,
        isDeleted: false,
    }));
}

async function getOffers(userId) {
    const products = await productModel.find({
        stock: { $gt: 0 },
        $or: [
            { section: { $in: ["best-deals", "free-delivery"] } },
            { discountPercentage: { $gt: 0 } },
        ],
    })
        .select("_id title section discountPercentage updatedAt createdAt")
        .sort({ updatedAt: -1 });

    return formatOfferNotifications(userId, products);
}

async function syncCustomerNotifications(userId, notifications, hiddenSourceKeys = []) {
    const dismissals = await customerNotificationDismissalModel.find({ user: userId })
        .select("sourceKey")
        .lean();
    const dismissedSourceKeys = new Set(dismissals.map(({ sourceKey }) => sourceKey));
    hiddenSourceKeys.forEach((sourceKey) => dismissedSourceKeys.add(sourceKey));
    const activeNotifications = notifications.filter(
        ({ sourceKey }) => !dismissedSourceKeys.has(sourceKey)
    );

    if (activeNotifications.length > 0) {
        await customerNotificationModel.bulkWrite(
            activeNotifications.map((notification) => ({
                updateOne: {
                    filter: {
                        user: userId,
                        sourceKey: notification.sourceKey,
                    },
                    update: {
                        $set: {
                            kind: notification.kind,
                            title: notification.title,
                            description: notification.description,
                            date: notification.date,
                            to: notification.to,
                        },
                        $setOnInsert: {
                            user: userId,
                            sourceKey: notification.sourceKey,
                            isRead: false,
                            isDeleted: false,
                        },
                    },
                    upsert: true,
                },
            })),
            { ordered: false }
        );
    }

    if (dismissedSourceKeys.size > 0) {
        await customerNotificationModel.deleteMany({
            user: userId,
            sourceKey: { $in: [...dismissedSourceKeys] },
        });
    }

    return customerNotificationModel.find({
        user: userId,
        isDeleted: false,
    })
        .sort({ date: -1 })
        .lean();
}

async function getCustomerNotifications(req, res) {
    const usesPagination = req.query.page !== undefined || req.query.limit !== undefined;
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 50
    ) {
        return res.status(400).json({
            message: "Page must be a positive integer and limit must be between 1 and 50.",
        });
    }

    try {
        const orders = await orderModel.find({ user: req.user.id })
                .select("_id status timeline products createdAt updatedAt")
                .populate("products.product", "title")
                .sort({ createdAt: -1 });
        const reviews = await productReviewModel.find({
            user: req.user.id,
            order: { $in: orders.map((order) => order._id) },
        })
            .select("order product")
            .lean();
        const reviewedSourceKeys = reviews.map(
            (review) => `review:${review.order}:${review.product}`
        );
        const reviewSourceKeys = new Set(reviewedSourceKeys);
        const orderNotifications = formatOrderNotifications(req.user.id, orders)
            .filter((notification) =>
                notification.kind !== "review" ||
                !reviewSourceKeys.has(notification.sourceKey)
            );
        const offerNotifications = await getOffers(req.user.id);
        await syncCustomerNotifications(
            req.user.id,
            [...orderNotifications, ...offerNotifications],
            reviewedSourceKeys
        );
        const filter = { user: req.user.id, isDeleted: false };
        const [totalCount, unreadCount] = await Promise.all([
            customerNotificationModel.countDocuments(filter),
            customerNotificationModel.countDocuments({ ...filter, isRead: false }),
        ]);
        let query = customerNotificationModel.find(filter).sort({ date: -1 });
        if (usesPagination) {
            query = query.skip((page - 1) * limit).limit(limit);
        }
        const notifications = await query.lean();

        return res.status(200).json({
            notifications: notifications.map((notification) => ({
                id: String(notification._id),
                kind: notification.kind,
                type: notification.kind,
                title: notification.title,
                message: notification.description,
                description: notification.description,
                date: notification.date,
                createdAt: notification.createdAt,
                recipient: String(notification.user),
                relatedId: notification.relatedId || null,
                to: notification.to,
                isRead: notification.isRead,
            })),
            count: totalCount,
            unreadCount,
            ...(usesPagination && {
                page,
                limit,
                hasMore: page * limit < totalCount,
            }),
        });
    } catch (error) {
        console.error("Get Customer Notifications Error:", error);
        return res.status(500).json({
            message: "Unable to load notifications.",
        });
    }
}

async function getCustomerUnreadNotificationCount(req, res) {
    try {
        const unreadCount = await customerNotificationModel.countDocuments({
            user: req.user.id,
            isRead: false,
            isDeleted: false,
        });
        return res.status(200).json({ unreadCount });
    } catch (error) {
        console.error("Get Customer Notification Count Error:", error);
        return res.status(500).json({
            message: "Unable to load notification count.",
        });
    }
}

async function getPublicOfferNotifications(req, res) {
    try {
        const products = await productModel.find({
            stock: { $gt: 0 },
            $or: [
                { section: { $in: ["best-deals", "free-delivery"] } },
                { discountPercentage: { $gt: 0 } },
            ],
        })
            .select("_id title section discountPercentage updatedAt createdAt")
            .sort({ updatedAt: -1 });
        const notifications = products.map((product) => {
            const {
                kind,
                title,
                description,
                date,
                to,
            } = formatOfferNotifications(null, [product])[0];
            return {
                id: `product-${product._id}`,
                kind,
                title,
                description,
                date,
                to,
                isRead: false,
            };
        });
        return res.status(200).json({
            notifications,
            count: notifications.length,
            unreadCount: notifications.length,
        });
    } catch (error) {
        console.error("Get Public Offer Notifications Error:", error);
        return res.status(500).json({
            message: "Unable to load special offers.",
        });
    }
}

async function markCustomerNotificationRead(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "A valid notification ID is required." });
    }

    try {
        const notification = await customerNotificationModel.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id, isDeleted: false },
            { $set: { isRead: true } },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification not found." });
        }
        publishUpdate({ type: "customer-notifications:changed", userId: req.user.id });
        return res.status(200).json({ message: "Notification marked as read." });
    } catch (error) {
        console.error("Mark Customer Notification Read Error:", error);
        return res.status(500).json({ message: "Unable to update notification." });
    }
}

async function markAllCustomerNotificationsRead(req, res) {
    try {
        await customerNotificationModel.updateMany(
            { user: req.user.id, isRead: false, isDeleted: false },
            { $set: { isRead: true } }
        );
        publishUpdate({ type: "customer-notifications:changed", userId: req.user.id });
        return res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("Mark All Customer Notifications Read Error:", error);
        return res.status(500).json({ message: "Unable to update notifications." });
    }
}

async function deleteCustomerNotification(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "A valid notification ID is required." });
    }

    try {
        const notification = await customerNotificationModel.findOne({
            _id: req.params.id,
            user: req.user.id,
            isDeleted: false,
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found." });
        }

        await customerNotificationDismissalModel.updateOne(
            { user: req.user.id, sourceKey: notification.sourceKey },
            { $setOnInsert: { user: req.user.id, sourceKey: notification.sourceKey } },
            { upsert: true }
        );
        await customerNotificationModel.deleteOne({
            _id: notification._id,
            user: req.user.id,
        });
        publishUpdate({ type: "customer-notifications:changed", userId: req.user.id });
        return res.status(200).json({ message: "Notification deleted." });
    } catch (error) {
        console.error("Delete Customer Notification Error:", error);
        return res.status(500).json({ message: "Unable to delete notification." });
    }
}

async function deleteAllCustomerNotifications(req, res) {
    try {
        const notifications = await customerNotificationModel.find({
            user: req.user.id,
            isDeleted: false,
        })
            .select("sourceKey")
            .lean();
        if (notifications.length > 0) {
            await customerNotificationDismissalModel.bulkWrite(
                notifications.map(({ sourceKey }) => ({
                    updateOne: {
                        filter: { user: req.user.id, sourceKey },
                        update: {
                            $setOnInsert: {
                                user: req.user.id,
                                sourceKey,
                            },
                        },
                        upsert: true,
                    },
                })),
                { ordered: false }
            );
        }
        await customerNotificationModel.deleteMany({ user: req.user.id });
        publishUpdate({ type: "customer-notifications:changed", userId: req.user.id });
        return res.status(200).json({
            message: "All notifications deleted.",
            deletedCount: notifications.length,
        });
    } catch (error) {
        console.error("Delete All Customer Notifications Error:", error);
        return res.status(500).json({ message: "Unable to delete notifications." });
    }
}

module.exports = {
    formatOrderNotifications,
    getCustomerNotifications,
    getCustomerUnreadNotificationCount,
    getPublicOfferNotifications,
    markCustomerNotificationRead,
    markAllCustomerNotificationsRead,
    deleteCustomerNotification,
    deleteAllCustomerNotifications,
};
