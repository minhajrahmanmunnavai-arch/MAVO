const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        registeredAt: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    { timestamps: true }
);

customerSchema.index({ email: 1 });

module.exports = mongoose.model("Customer", customerSchema);
