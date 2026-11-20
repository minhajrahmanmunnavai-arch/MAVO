const mongoose = require("mongoose");

const reviewMediaSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["image", "video"],
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const productReviewSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: Number.isInteger,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        media: {
            type: [reviewMediaSchema],
            default: [],
            validate: (items) => items.length <= 3,
        },
    },
    { timestamps: true }
);

productReviewSchema.index({ order: 1, product: 1 }, { unique: true });
productReviewSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model("ProductReview", productReviewSchema);
