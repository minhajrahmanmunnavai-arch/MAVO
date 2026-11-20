const mongoose = require("mongoose");
const customerNotificationModel = require("../models/customerNotification.model");
const customerNotificationDismissalModel = require("../models/customerNotificationDismissal.model");
const productModel = require("../models/productUpload.model");
const productReviewModel = require("../models/productReview.model");
const userModel = require("../models/user.model");
const pushNotificationService = require("./pushNotificationService");
const { publishUpdate } = require("./liveUpdates");

const notificationTypes = new Set([
    "order",
    "message",
    "payment",
    "system",
    "offer",
    "review",
    "review-activity",
]);

function ensureDatabaseConnected() {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Cannot create notifications while MongoDB is disconnected.");
    }
}

async function createNotification({
    recipient,
    title,
    message,
    type,
    relatedId = null,
    to = "/notifications",
    sourceKey,
}) {
    ensureDatabaseConnected();

    if (!mongoose.isValidObjectId(recipient)) {
        throw new TypeError("A valid notification recipient is required.");
    }
    if (!notificationTypes.has(type)) {
        throw new TypeError("A valid notification type is required.");
    }
    if (typeof title !== "string" || !title.trim() || title.trim().length > 160) {
        throw new TypeError("A notification title of 1 to 160 characters is required.");
    }
    if (
        typeof message !== "string" ||
        !message.trim() ||
        message.trim().length > 2000
    ) {
        throw new TypeError("A notification message of 1 to 2000 characters is required.");
    }
    if (
        relatedId !== null &&
        relatedId !== undefined &&
        String(relatedId).length > 128
    ) {
        throw new TypeError("A notification related ID cannot exceed 128 characters.");
    }
    if (typeof to !== "string" || !to.trim() || to.trim().length > 300) {
        throw new TypeError("A notification destination of 1 to 300 characters is required.");
    }

    const notificationSourceKey =
        sourceKey || `notification:${new mongoose.Types.ObjectId()}`;
    const dismissal = await customerNotificationDismissalModel.findOne({
        user: recipient,
        sourceKey: notificationSourceKey,
    }).select("_id").lean();
    if (dismissal) return null;

    const result = await customerNotificationModel.findOneAndUpdate(
        { user: recipient, sourceKey: notificationSourceKey },
        {
            $setOnInsert: {
                user: recipient,
                sourceKey: notificationSourceKey,
                kind: type,
                title: title.trim(),
                description: message.trim(),
                relatedId: relatedId ? String(relatedId) : null,
                date: new Date(),
                to,
                isRead: false,
                isDeleted: false,
            },
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
            includeResultMetadata: true,
        }
    );
    const notification = result.value || result;

    publishUpdate({
        type: "customer-notifications:changed",
        userId: String(recipient),
    });
    if (result.lastErrorObject && !result.lastErrorObject.updatedExisting) {
        try {
            await pushNotificationService.sendPushNotification(notification);
        } catch (error) {
            console.error("Push Notification Delivery Error:", error);
        }
    }
    return notification;
}

async function createNotificationsForUsers(recipients, notification) {
    const uniqueRecipients = [...new Set(recipients.map(String))];
    return Promise.all(uniqueRecipients.map((recipient) =>
        createNotification({
            ...notification,
            recipient,
            sourceKey: notification.sourceKey
                ? `${notification.sourceKey}:${recipient}`
                : undefined,
        })
    ));
}

async function notifyAdministrators(notification) {
    ensureDatabaseConnected();

    const administrators = await userModel.find({ role: "admin" })
        .select("_id")
        .lean();
    return createNotificationsForUsers(
        administrators.map(({ _id }) => _id),
        notification
    );
}

async function notifyCustomerToReviewDeliveredOrder(order) {
    ensureDatabaseConnected();

    const productIds = [...new Set(
        (order.products || [])
            .map(({ product }) => String(product?._id || product || ""))
            .filter(Boolean)
    )];
    if (productIds.length === 0) return [];

    const [products, reviews] = await Promise.all([
        productModel.find({ _id: { $in: productIds } })
            .select("_id title")
            .lean(),
        productReviewModel.find({
            user: order.user,
            order: order._id,
            product: { $in: productIds },
        })
            .select("product")
            .lean(),
    ]);
    const reviewedProductIds = new Set(reviews.map(({ product }) => String(product)));

    return Promise.all(products
        .filter((product) => !reviewedProductIds.has(String(product._id)))
        .map((product) => createNotification({
            recipient: order.user,
            type: "review",
            title: `Review ${product.title || "your delivered product"}`,
            message: "Your order was delivered. Share a star rating and comment.",
            relatedId: product._id,
            to: `/my-orders/${order._id}/review/${product._id}`,
            sourceKey: `review:${order._id}:${product._id}`,
        })));
}

module.exports = {
    createNotification,
    createNotificationsForUsers,
    notifyAdministrators,
    notifyCustomerToReviewDeliveredOrder,
};
