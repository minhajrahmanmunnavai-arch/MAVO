const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");
const productReviewController = require("../controller/productReviewController");

const adminReviewRouter = express.Router();

adminReviewRouter.get(
    "/",
    authMiddleware.authUser,
    admin,
    productReviewController.getAdminProductReviews
);
adminReviewRouter.delete(
    "/:reviewId",
    authMiddleware.authUser,
    admin,
    productReviewController.deleteAdminProductReview
);

module.exports = adminReviewRouter;
