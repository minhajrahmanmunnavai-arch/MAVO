const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const customerNotificationController = require("../controller/customerNotificationController");
const pushDeviceTokenController = require("../controller/pushDeviceTokenController");

const customerNotificationRouter = express.Router();

customerNotificationRouter.post(
    "/device-tokens",
    authMiddleware.authUser,
    pushDeviceTokenController.registerPushDevice
);
customerNotificationRouter.delete(
    "/device-tokens",
    authMiddleware.authUser,
    pushDeviceTokenController.unregisterPushDevice
);
customerNotificationRouter.get(
    "/",
    authMiddleware.authUser,
    customerNotificationController.getCustomerNotifications
);
customerNotificationRouter.get(
    "/unread-count",
    authMiddleware.authUser,
    customerNotificationController.getCustomerUnreadNotificationCount
);
customerNotificationRouter.get(
    "/offers",
    customerNotificationController.getPublicOfferNotifications
);
customerNotificationRouter.patch(
    "/read-all",
    authMiddleware.authUser,
    customerNotificationController.markAllCustomerNotificationsRead
);
customerNotificationRouter.patch(
    "/:id/read",
    authMiddleware.authUser,
    customerNotificationController.markCustomerNotificationRead
);
customerNotificationRouter.delete(
    "/",
    authMiddleware.authUser,
    customerNotificationController.deleteAllCustomerNotifications
);
customerNotificationRouter.delete(
    "/:id",
    authMiddleware.authUser,
    customerNotificationController.deleteCustomerNotification
);

module.exports = customerNotificationRouter;
