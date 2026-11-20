const mongoose = require("mongoose");

const userAddressSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true, maxlength: 100 },
        email: { type: String, required: true, trim: true, maxlength: 254 },
        phoneNumber: { type: String, required: true, trim: true, maxlength: 50 },
        region: { type: String, required: true, trim: true, maxlength: 150 },
        address: { type: String, required: true, trim: true, maxlength: 300 },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"], 
        default: "user",
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    }],
    addresses: {
        type: [userAddressSchema],
        default: [],
    },
}, { timestamps: true });

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;