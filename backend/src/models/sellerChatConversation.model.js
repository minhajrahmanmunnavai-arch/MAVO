const mongoose = require("mongoose");

const sellerChatConversationSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
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

sellerChatConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("SellerChatConversation", sellerChatConversationSchema);
