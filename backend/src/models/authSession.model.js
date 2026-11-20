const mongoose = require("mongoose");

const authSessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        previousTokenHash: {
            type: String,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authSessionSchema.index({ previousTokenHash: 1 });

module.exports = mongoose.model("AuthSession", authSessionSchema);
