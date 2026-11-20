const mongoose = require("mongoose");

const pushDeviceTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4096,
        },
        platform: {
            type: String,
            enum: ["android", "ios"],
            required: true,
        },
        lastSeenAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

pushDeviceTokenSchema.index({ token: 1 }, { unique: true });
pushDeviceTokenSchema.index({ user: 1 });

module.exports = mongoose.model("PushDeviceToken", pushDeviceTokenSchema);
