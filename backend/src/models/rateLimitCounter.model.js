const mongoose = require("mongoose");

const rateLimitCounterSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        count: {
            type: Number,
            required: true,
        },
        resetAt: {
            type: Date,
            required: true,
        },
    },
    { versionKey: false }
);

rateLimitCounterSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RateLimitCounter", rateLimitCounterSchema);
