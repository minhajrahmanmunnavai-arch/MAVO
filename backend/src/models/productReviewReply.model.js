const mongoose = require("mongoose");

const productReviewReplySchema = new mongoose.Schema(
    {
        review: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductReview",
            required: true,
        },
        parentReply: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductReviewReply",
            default: null,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);

productReviewReplySchema.index({ review: 1, createdAt: 1 });

module.exports = mongoose.model("ProductReviewReply", productReviewReplySchema);
