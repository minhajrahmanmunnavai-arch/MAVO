const mongoose = require("mongoose");
const adminNotificationModel = require("../models/adminNotification.model");
const { publishUpdate } = require("../utils/liveUpdates");

function formatNotification(notification) {
    return {
        id: String(notification._id),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: notification.createdAt.toISOString(),
        read: notification.read,
        route: notification.type === "order" ? "orders" : "customers",
        userId: String(notification.user),
        userName: notification.userName,
        userEmail: notification.userEmail,
        ...(notification.product && {
            productId: String(notification.product),
            productName: notification.productName,
        }),
        ...(notification.order && { orderId: String(notification.order) }),
    };
}

async function getAdminNotificationsController(req, res) {
    try {
        const notifications = await adminNotificationModel
            .find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return res.status(200).json({
            success: true,
            data: notifications.map(formatNotification),
        });
    } catch (error) {
        console.error("Get Admin Notifications Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load notifications.",
        });
    }
}

async function markAdminNotificationReadController(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "A valid notification ID is required.",
        });
    }

    try {
        const notification = await adminNotificationModel.findByIdAndUpdate(
            req.params.id,
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        publishUpdate({ type: "notifications:changed" });
        return res.status(200).json({
            success: true,
            data: formatNotification(notification),
        });
    } catch (error) {
        console.error("Mark Admin Notification Read Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update notification.",
        });
    }
}

async function deleteAdminNotificationController(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "A valid notification ID is required.",
        });
    }

    try {
        const notification = await adminNotificationModel.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        publishUpdate({ type: "notifications:changed" });
        return res.status(200).json({
            success: true,
            id: String(notification._id),
        });
    } catch (error) {
        console.error("Delete Admin Notification Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete notification.",
        });
    }
}

async function markAllAdminNotificationsReadController(req, res) {
    try {
        await adminNotificationModel.updateMany(
            { read: false },
            { $set: { read: true } }
        );

        publishUpdate({ type: "notifications:changed" });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Mark All Admin Notifications Read Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update notifications.",
        });
    }
}

module.exports = {
    getAdminNotificationsController,
    markAdminNotificationReadController,
    deleteAdminNotificationController,
    markAllAdminNotificationsReadController,
};
