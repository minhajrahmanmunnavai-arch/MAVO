const mongoose = require("mongoose");

const orderIdempotencySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        key: {
            type: String,
            required: true,
            maxlength: 128,
        },
        fingerprint: {
            type: String,
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
    },
    { timestamps: true }
);

orderIdempotencySchema.index({ user: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("OrderIdempotency", orderIdempotencySchema);
