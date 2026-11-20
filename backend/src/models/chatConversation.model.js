const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        lastMessageText: {
            type: String,
            default: "",
        },
        lastMessageRole: {
            type: String,
            enum: ["user", "admin"],
        },
        lastMessageAt: {
            type: Date,
        },
        adminLastReadAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

chatConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
