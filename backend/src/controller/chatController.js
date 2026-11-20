const mongoose = require("mongoose");
const orderModel = require("../models/order.model");
const chatConversationModel = require("../models/chatConversation.model");
const chatMessageModel = require("../models/chatMessage.model");
const sellerChatConversationModel = require("../models/sellerChatConversation.model");
const sellerChatMessageModel = require("../models/sellerChatMessage.model");
const { publishUpdate } = require("../utils/liveUpdates");
const {
    createNotification,
    notifyAdministrators,
} = require("../utils/customerNotificationService");

const MAX_MESSAGE_LENGTH = 2000;
const SELLER_CHAT_ID_PREFIX = "seller_";

function isValidMessage(body) {
    return typeof body === "string" && body.trim().length > 0 && body.trim().length <= MAX_MESSAGE_LENGTH;
}

function formatMessage(message) {
    return {
        id: String(message._id),
        senderId: String(message.sender),
        senderRole: message.senderRole,
        senderName: message.senderName,
        body: message.isDeleted ? "" : message.body,
        isDeleted: Boolean(message.isDeleted),
        editedAt: message.editedAt || null,
        createdAt: message.createdAt,
    };
}

async function updateConversationPreview(conversation, messageModel = chatMessageModel) {
    const latestMessage = await messageModel.findOne({
        conversation: conversation._id,
        isDeleted: { $ne: true },
    }).sort({ createdAt: -1, _id: -1 });

    conversation.lastMessageText = latestMessage?.body || "";
    conversation.lastMessageRole = latestMessage?.senderRole;
    conversation.lastMessageAt = latestMessage?.createdAt;
    await conversation.save();
}

function parseAdminConversationId(value) {
    if (typeof value !== "string") return null;

    const isSellerChat = value.startsWith(SELLER_CHAT_ID_PREFIX);
    const id = isSellerChat
        ? value.slice(SELLER_CHAT_ID_PREFIX.length)
        : value;
    if (!mongoose.isValidObjectId(id)) return null;

    return {
        id,
        isSellerChat,
        conversationModel: isSellerChat
            ? sellerChatConversationModel
            : chatConversationModel,
        messageModel: isSellerChat ? sellerChatMessageModel : chatMessageModel,
    };
}

async function getAdminConversationTarget(value, res) {
    const parsedId = parseAdminConversationId(value);
    if (!parsedId) {
        res.status(400).json({ message: "A valid conversation ID is required." });
        return null;
    }

    const conversation = await parsedId.conversationModel.findById(parsedId.id);
    if (!conversation) {
        res.status(404).json({ message: "Chat conversation not found." });
        return null;
    }

    return { ...parsedId, conversation };
}

async function getOrCreateSellerConversation(customerId) {
    let conversation = await sellerChatConversationModel.findOne({
        customer: customerId,
    });
    if (conversation) return conversation;

    try {
        conversation = await sellerChatConversationModel.create({
            customer: customerId,
        });
    } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await sellerChatConversationModel.findOne({
            customer: customerId,
        });
    }

    if (!conversation) {
        throw new Error("Unable to create the seller chat conversation.");
    }
    return conversation;
}

async function editChatMessage(req, res, senderRole) {
    const conversationIdParam = senderRole === "admin"
        ? req.params.conversationId
        : req.params.orderId;
    const messageId = req.params.messageId;

    const invalidConversationId = senderRole === "admin"
        ? !parseAdminConversationId(conversationIdParam)
        : !mongoose.isValidObjectId(conversationIdParam);
    if (invalidConversationId || !mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ message: "A valid conversation and message ID are required." });
    }
    if (!isValidMessage(req.body?.message)) {
        return res.status(400).json({
            message: `Message must contain 1 to ${MAX_MESSAGE_LENGTH} characters.`,
        });
    }

    try {
        let conversation;
        let resourceId;
        let messageModel = chatMessageModel;
        if (senderRole === "admin") {
            const target = await getAdminConversationTarget(conversationIdParam, res);
            if (!target) return;
            conversation = target.conversation;
            messageModel = target.messageModel;
            resourceId = target.isSellerChat ? "seller" : String(conversation.order);
        } else {
            conversation = await chatConversationModel.findOne({
                order: conversationIdParam,
                customer: req.user.id,
            });
            if (!conversation) {
                return res.status(404).json({ message: "Chat conversation not found." });
            }
            resourceId = String(conversationIdParam);
        }

        const updatedMessage = await messageModel.findOneAndUpdate(
            {
                _id: messageId,
                conversation: conversation._id,
                sender: req.user.id,
                senderRole,
                isDeleted: { $ne: true },
            },
            { $set: { body: req.body.message.trim(), editedAt: new Date() } },
            { new: true, runValidators: true }
        );
        if (!updatedMessage) {
            return res.status(404).json({ message: "Message not found or you cannot edit it." });
        }

        await updateConversationPreview(conversation, messageModel);
        publishUpdate({
            type: "chat:changed",
            userId: conversation.customer,
            resourceId,
            chatType: target?.isSellerChat ? "seller" : "order",
            chatResourceId: target?.isSellerChat
                ? String(conversation.customer)
                : resourceId,
            chatConversationId: String(conversation._id),
            message: formatMessage(updatedMessage),
        });
        return res.status(200).json({ message: formatMessage(updatedMessage) });
    } catch (error) {
        console.error("Edit Chat Message Error:", error);
        return res.status(500).json({ message: "Unable to edit this message." });
    }
}

async function deleteChatMessage(req, res, senderRole) {
    const conversationIdParam = senderRole === "admin"
        ? req.params.conversationId
        : req.params.orderId;
    const messageId = req.params.messageId;

    const invalidConversationId = senderRole === "admin"
        ? !parseAdminConversationId(conversationIdParam)
        : !mongoose.isValidObjectId(conversationIdParam);
    if (invalidConversationId || !mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ message: "A valid conversation and message ID are required." });
    }

    try {
        let conversation;
        let resourceId;
        let messageModel = chatMessageModel;
        if (senderRole === "admin") {
            const target = await getAdminConversationTarget(conversationIdParam, res);
            if (!target) return;
            conversation = target.conversation;
            messageModel = target.messageModel;
            resourceId = target.isSellerChat ? "seller" : String(conversation.order);
        } else {
            conversation = await chatConversationModel.findOne({
                order: conversationIdParam,
                customer: req.user.id,
            });
            if (!conversation) {
                return res.status(404).json({ message: "Chat conversation not found." });
            }
            resourceId = String(conversationIdParam);
        }

        const deletedMessage = await messageModel.findOneAndUpdate(
            {
                _id: messageId,
                conversation: conversation._id,
                sender: req.user.id,
                senderRole,
                isDeleted: { $ne: true },
            },
            { $set: { body: "", isDeleted: true } },
            { new: true }
        );
        if (!deletedMessage) {
            return res.status(404).json({ message: "Message not found or you cannot delete it." });
        }

        await updateConversationPreview(conversation, messageModel);
        publishUpdate({
            type: "chat:changed",
            userId: conversation.customer,
            resourceId,
            chatType: target?.isSellerChat ? "seller" : "order",
            chatResourceId: target?.isSellerChat
                ? String(conversation.customer)
                : resourceId,
            chatConversationId: String(conversation._id),
            message: formatMessage(deletedMessage),
        });
        return res.status(200).json({ message: formatMessage(deletedMessage) });
    } catch (error) {
        console.error("Delete Chat Message Error:", error);
        return res.status(500).json({ message: "Unable to delete this message." });
    }
}

async function getOrderChat(req, res) {
    if (!mongoose.isValidObjectId(req.params.orderId)) {
        return res.status(400).json({ message: "A valid order ID is required." });
    }

    try {
        const order = await orderModel.findOne({
            _id: req.params.orderId,
            user: req.user.id,
        }).select("_id");

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        const conversation = await chatConversationModel.findOne({
            order: order._id,
            customer: req.user.id,
        }).select("_id");
        const messages = conversation
            ? await chatMessageModel.find({ conversation: conversation._id }).sort({ createdAt: 1 })
            : [];

        return res.status(200).json({
            conversationId: conversation ? String(conversation._id) : null,
            messages: messages.map(formatMessage),
        });
    } catch (error) {
        console.error("Get Order Chat Error:", error);
        return res.status(500).json({ message: "Unable to load this order chat." });
    }
}

async function sendOrderChatMessage(req, res) {
    if (!mongoose.isValidObjectId(req.params.orderId)) {
        return res.status(400).json({ message: "A valid order ID is required." });
    }
    if (!isValidMessage(req.body?.message)) {
        return res.status(400).json({
            message: `Message must contain 1 to ${MAX_MESSAGE_LENGTH} characters.`,
        });
    }

    try {
        const order = await orderModel.findOne({
            _id: req.params.orderId,
            user: req.user.id,
        }).select("_id");
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        let conversation = await chatConversationModel.findOne({
            order: order._id,
            customer: req.user.id,
        });
        if (!conversation) {
            try {
                conversation = await chatConversationModel.create({
                    order: order._id,
                    customer: req.user.id,
                });
            } catch (error) {
                if (error.code !== 11000) throw error;
                conversation = await chatConversationModel.findOne({
                    order: order._id,
                    customer: req.user.id,
                });
            }
        }

        const message = await chatMessageModel.create({
            conversation: conversation._id,
            sender: req.user.id,
            senderRole: "user",
            senderName: req.user.username || "Customer",
            body: req.body.message.trim(),
        });
        conversation.lastMessageText = message.body;
        conversation.lastMessageRole = "user";
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();
        publishUpdate({
            type: "chat:changed",
            userId: req.user.id,
            resourceId: String(order._id),
            chatType: "order",
            chatResourceId: String(order._id),
            chatConversationId: String(conversation._id),
            message: formatMessage(message),
        });
        try {
            await notifyAdministrators({
                type: "message",
                title: "New order message",
                message: `${req.user.username || "A customer"} sent a message about order #${order._id}.`,
                relatedId: order._id,
                to: "/customers",
                sourceKey: `order-chat:${message._id}`,
            });
        } catch (notificationError) {
            console.error("Create Admin Order Chat Notification Error:", notificationError);
        }

        return res.status(201).json({
            conversationId: String(conversation._id),
            message: formatMessage(message),
        });
    } catch (error) {
        console.error("Send Order Chat Message Error:", error);
        return res.status(500).json({ message: "Unable to send your message." });
    }
}

async function getSellerChat(req, res) {
    try {
        const conversation = await getOrCreateSellerConversation(req.user.id);
        const messages = await sellerChatMessageModel.find({
            conversation: conversation._id,
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            conversationId: String(conversation._id),
            messages: messages.map(formatMessage),
        });
    } catch (error) {
        console.error("Get Seller Chat Error:", error);
        return res.status(500).json({ message: "Unable to load your seller chat." });
    }
}

async function sendSellerChatMessage(req, res) {
    if (!isValidMessage(req.body?.message)) {
        return res.status(400).json({
            message: `Message must contain 1 to ${MAX_MESSAGE_LENGTH} characters.`,
        });
    }

    try {
        const conversation = await getOrCreateSellerConversation(req.user.id);
        const message = await sellerChatMessageModel.create({
            conversation: conversation._id,
            sender: req.user.id,
            senderRole: "user",
            senderName: req.user.username || "Customer",
            body: req.body.message.trim(),
        });
        conversation.lastMessageText = message.body;
        conversation.lastMessageRole = "user";
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();
        publishUpdate({
            type: "chat:changed",
            userId: req.user.id,
            resourceId: "seller",
            chatType: "seller",
            chatResourceId: String(req.user.id),
            chatConversationId: String(conversation._id),
            message: formatMessage(message),
        });
        try {
            await notifyAdministrators({
                type: "message",
                title: "New customer message",
                message: `${req.user.username || "A customer"} sent a message to MAVO support.`,
                relatedId: conversation._id,
                to: "/customers",
                sourceKey: `seller-chat:${message._id}`,
            });
        } catch (notificationError) {
            console.error("Create Admin Seller Chat Notification Error:", notificationError);
        }

        return res.status(201).json({
            conversationId: String(conversation._id),
            message: formatMessage(message),
        });
    } catch (error) {
        console.error("Send Seller Chat Message Error:", error);
        return res.status(500).json({ message: "Unable to send your message." });
    }
}

async function getAdminConversations(req, res) {
    try {
        const [orderConversations, sellerConversations] = await Promise.all([
            chatConversationModel.find({})
                .populate("customer", "username email")
                .populate("order", "status totalAmount createdAt"),
            sellerChatConversationModel.find({})
                .populate("customer", "username email"),
        ]);
        const conversations = [
            ...orderConversations.map((conversation) => ({
                id: String(conversation._id),
                chatType: "order",
                orderId: String(conversation.order?._id || conversation.order),
                orderStatus: conversation.order?.status || "unknown",
                customerName: conversation.customer?.username || "Customer",
                customerEmail: conversation.customer?.email || "",
                lastMessage: conversation.lastMessageText,
                lastMessageRole: conversation.lastMessageRole,
                lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
                isUnread: conversation.lastMessageRole === "user" &&
                    (!conversation.adminLastReadAt ||
                        (conversation.lastMessageAt || conversation.updatedAt) > conversation.adminLastReadAt),
            })),
            ...sellerConversations.map((conversation) => ({
                id: `${SELLER_CHAT_ID_PREFIX}${conversation._id}`,
                chatType: "seller",
                orderId: null,
                orderStatus: null,
                customerName: conversation.customer?.username || "Customer",
                customerEmail: conversation.customer?.email || "",
                lastMessage: conversation.lastMessageText,
                lastMessageRole: conversation.lastMessageRole,
                lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
                isUnread: conversation.lastMessageRole === "user" &&
                    (!conversation.adminLastReadAt ||
                        (conversation.lastMessageAt || conversation.updatedAt) > conversation.adminLastReadAt),
            })),
        ].sort((first, second) =>
            new Date(second.lastMessageAt) - new Date(first.lastMessageAt)
        );

        return res.status(200).json({
            conversations,
        });
    } catch (error) {
        console.error("Get Admin Chat Conversations Error:", error);
        return res.status(500).json({ message: "Unable to load customer chats." });
    }
}

async function markAdminConversationRead(req, res) {
    try {
        const target = await getAdminConversationTarget(req.params.conversationId, res);
        if (!target) return;
        const { conversation, messageModel } = target;

        const latestCustomerMessage = await messageModel.findOne({
            conversation: conversation._id,
            senderRole: "user",
        }).sort({ createdAt: -1, _id: -1 }).select("createdAt");

        if (latestCustomerMessage) {
            conversation.adminLastReadAt = latestCustomerMessage.createdAt;
            await conversation.save();
            publishUpdate({
                type: "chat:changed",
                userId: conversation.customer,
                resourceId: target.isSellerChat ? "seller" : String(conversation.order),
                chatType: target.isSellerChat ? "seller" : "order",
                chatResourceId: target.isSellerChat
                    ? String(conversation.customer)
                    : String(conversation.order),
                chatConversationId: String(conversation._id),
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Mark Admin Chat Conversation Read Error:", error);
        return res.status(500).json({ message: "Unable to mark conversation as read." });
    }
}

async function getAdminConversationMessages(req, res) {
    try {
        const target = await getAdminConversationTarget(req.params.conversationId, res);
        if (!target) return;
        const { conversation, messageModel } = target;
        const messages = await messageModel.find({
            conversation: conversation._id,
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            conversationId: String(conversation._id),
            messages: messages.map(formatMessage),
        });
    } catch (error) {
        console.error("Get Admin Chat Messages Error:", error);
        return res.status(500).json({ message: "Unable to load chat messages." });
    }
}

async function sendAdminChatMessage(req, res) {
    if (!isValidMessage(req.body?.message)) {
        return res.status(400).json({
            message: `Message must contain 1 to ${MAX_MESSAGE_LENGTH} characters.`,
        });
    }

    try {
        const target = await getAdminConversationTarget(req.params.conversationId, res);
        if (!target) return;
        const { conversation, messageModel } = target;

        const message = await messageModel.create({
            conversation: conversation._id,
            sender: req.user.id,
            senderRole: "admin",
            senderName: req.user.username || "MAVO Support",
            body: req.body.message.trim(),
        });
        conversation.lastMessageText = message.body;
        conversation.lastMessageRole = "admin";
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();
        publishUpdate({
            type: "chat:changed",
            userId: conversation.customer,
            resourceId: target.isSellerChat ? "seller" : String(conversation.order),
            chatType: target.isSellerChat ? "seller" : "order",
            chatResourceId: target.isSellerChat
                ? String(conversation.customer)
                : String(conversation.order),
            chatConversationId: String(conversation._id),
            message: formatMessage(message),
        });
        try {
            await createNotification({
                recipient: conversation.customer,
                type: "message",
                title: "New message from MAVO support",
                message: `${req.user.username || "MAVO Support"} replied to your message.`,
                relatedId: conversation._id,
                to: "/support",
                sourceKey: `admin-chat:${message._id}`,
            });
        } catch (notificationError) {
            console.error("Create Customer Chat Notification Error:", notificationError);
        }

        return res.status(201).json({ message: formatMessage(message) });
    } catch (error) {
        console.error("Send Admin Chat Message Error:", error);
        return res.status(500).json({ message: "Unable to send the reply." });
    }
}

function editOrderChatMessage(req, res) {
    return editChatMessage(req, res, "user");
}

function deleteOrderChatMessage(req, res) {
    return deleteChatMessage(req, res, "user");
}

function editAdminChatMessage(req, res) {
    return editChatMessage(req, res, "admin");
}

function deleteAdminChatMessage(req, res) {
    return deleteChatMessage(req, res, "admin");
}

module.exports = {
    getOrderChat,
    sendOrderChatMessage,
    getSellerChat,
    sendSellerChatMessage,
    getAdminConversations,
    markAdminConversationRead,
    getAdminConversationMessages,
    sendAdminChatMessage,
    editOrderChatMessage,
    deleteOrderChatMessage,
    editAdminChatMessage,
    deleteAdminChatMessage,
};
