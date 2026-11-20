const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const chatController = require("../controller/chatController");

const chatRouter = express.Router();

chatRouter.get(
    "/admin/conversations",
    authMiddleware.authUser,
    adminMiddleware,
    chatController.getAdminConversations
);
chatRouter.get(
    "/admin/conversations/:conversationId/messages",
    authMiddleware.authUser,
    adminMiddleware,
    chatController.getAdminConversationMessages
);
chatRouter.post(
    "/admin/conversations/:conversationId/read",
    authMiddleware.authUser,
    adminMiddleware,
    chatController.markAdminConversationRead
);
chatRouter.post(
    "/admin/conversations/:conversationId/messages",
    authMiddleware.authUser,
    adminMiddleware,
    chatController.sendAdminChatMessage
);
chatRouter.patch(
    "/admin/conversations/:conversationId/messages/:messageId",
    authMiddleware.authUser,
    adminMiddleware,
    chatController.editAdminChatMessage
);
chatRouter.delete(
    "/admin/conversations/:conversationId/messages/:messageId",
    authMiddleware.authUser,
    adminMiddleware,
    chatController.deleteAdminChatMessage
);
chatRouter.get(
    "/seller",
    authMiddleware.authUser,
    chatController.getSellerChat
);
chatRouter.post(
    "/seller/messages",
    authMiddleware.authUser,
    chatController.sendSellerChatMessage
);
chatRouter.get(
    "/orders/:orderId",
    authMiddleware.authUser,
    chatController.getOrderChat
);
chatRouter.post(
    "/orders/:orderId/messages",
    authMiddleware.authUser,
    chatController.sendOrderChatMessage
);
chatRouter.patch(
    "/orders/:orderId/messages/:messageId",
    authMiddleware.authUser,
    chatController.editOrderChatMessage
);
chatRouter.delete(
    "/orders/:orderId/messages/:messageId",
    authMiddleware.authUser,
    chatController.deleteOrderChatMessage
);

module.exports = chatRouter;
