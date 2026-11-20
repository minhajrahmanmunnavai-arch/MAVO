const express = require("express");
const adminNotificationController = require("../controller/adminNotificationController");
const { authUser } = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");

const adminNotificationRouter = express.Router();

adminNotificationRouter.use(authUser, admin);
adminNotificationRouter.get("/", adminNotificationController.getAdminNotificationsController);
adminNotificationRouter.patch(
    "/read-all",
    adminNotificationController.markAllAdminNotificationsReadController
);
adminNotificationRouter.patch(
    "/:id/read",
    adminNotificationController.markAdminNotificationReadController
);
adminNotificationRouter.delete(
    "/:id",
    adminNotificationController.deleteAdminNotificationController
);

module.exports = adminNotificationRouter;
