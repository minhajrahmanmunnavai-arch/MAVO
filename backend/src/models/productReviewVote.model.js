const mongoose = require("mongoose");

const productReviewVoteSchema = new mongoose.Schema(
    {
        review: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductReview",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        value: {
            type: String,
            enum: ["like", "dislike"],
            required: true,
        },
    },
    { timestamps: true }
);

productReviewVoteSchema.index({ review: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("ProductReviewVote", productReviewVoteSchema);
