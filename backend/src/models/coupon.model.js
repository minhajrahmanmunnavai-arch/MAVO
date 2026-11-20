const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            unique: true,
            minlength: 3,
            maxlength: 32,
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0.01,
        },
        minPurchase: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        maxDiscount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        startDate: {
            type: Date,
            required: true,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        usageLimit: {
            type: Number,
            required: true,
            min: 1,
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
