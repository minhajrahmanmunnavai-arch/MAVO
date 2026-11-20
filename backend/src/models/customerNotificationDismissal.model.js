const mongoose = require("mongoose");

const customerNotificationDismissalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sourceKey: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

customerNotificationDismissalSchema.index(
    { user: 1, sourceKey: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "CustomerNotificationDismissal",
    customerNotificationDismissalSchema
);
