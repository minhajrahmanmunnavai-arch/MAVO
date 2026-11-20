const mongoose = require("mongoose");

const customerNotificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            alias: "recipient",
        },
        sourceKey: {
            type: String,
            required: true,
            maxlength: 200,
        },
        kind: {
            type: String,
            enum: [
                "order",
                "message",
                "payment",
                "system",
                "offer",
                "review",
                "review-activity",
            ],
            required: true,
            alias: "type",
        },
        relatedId: {
            type: String,
            default: null,
            maxlength: 128,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
            alias: "message",
        },
        date: {
            type: Date,
            required: true,
        },
        to: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

customerNotificationSchema.index({ user: 1, sourceKey: 1 }, { unique: true });
customerNotificationSchema.index({ user: 1, isDeleted: 1, date: -1 });
customerNotificationSchema.index({ user: 1, isDeleted: 1, isRead: 1 });

module.exports = mongoose.model("CustomerNotification", customerNotificationSchema);
