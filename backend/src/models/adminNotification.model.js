const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["wishlist", "order"],
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
        productName: {
            type: String,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

adminNotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminNotification", adminNotificationSchema);
