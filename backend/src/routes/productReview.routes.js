const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middlewares/auth.middleware");
const productReviewController = require("../controller/productReviewController");

const productReviewRouter = express.Router();
const reviewUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 3,
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter(req, file, callback) {
        const mimeType = String(file.mimetype || "").toLowerCase();
        if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
            return callback(new Error("Review attachments must be image or video files."));
        }
        return callback(null, true);
    },
});

function handleReviewUpload(req, res, next) {
    reviewUpload.array("media", 3)(req, res, (error) => {
        if (!error) return next();
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Each photo or video must be 10 MB or smaller."
            : error.code === "LIMIT_FILE_COUNT"
                ? "You can attach up to 3 photos or videos."
                : error.code === "LIMIT_UNEXPECTED_FILE"
                    ? "You can attach up to 3 photos or videos."
                : error.message;
        return res.status(400).json({ message });
    });
}

productReviewRouter.get(
    "/products/:productId",
    authMiddleware.optionalAuthUser,
    productReviewController.getProductReviews
);
productReviewRouter.post(
    "/:reviewId/vote",
    authMiddleware.authUser,
    productReviewController.voteOnProductReview
);
productReviewRouter.patch(
    "/:reviewId",
    authMiddleware.authUser,
    productReviewController.updateProductReview
);
productReviewRouter.delete(
    "/:reviewId",
    authMiddleware.authUser,
    productReviewController.deleteProductReview
);
productReviewRouter.post(
    "/:reviewId/replies",
    authMiddleware.authUser,
    productReviewController.replyToProductReview
);
productReviewRouter.patch(
    "/:reviewId/replies/:replyId",
    authMiddleware.authUser,
    productReviewController.updateProductReviewReply
);
productReviewRouter.delete(
    "/:reviewId/replies/:replyId",
    authMiddleware.authUser,
    productReviewController.deleteProductReviewReply
);
productReviewRouter.get(
    "/orders/:orderId/products/:productId",
    authMiddleware.authUser,
    productReviewController.getReviewEligibility
);
productReviewRouter.post(
    "/orders/:orderId/products/:productId",
    authMiddleware.authUser,
    handleReviewUpload,
    productReviewController.createProductReview
);

module.exports = productReviewRouter;
