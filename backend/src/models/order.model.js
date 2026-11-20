
const mongoose = require("mongoose");

const orderAddressSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true
        },
        region: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        products: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }],

        totalAmount: {
            type: Number,
            required: true
        },

        paymentMethod: {
            type: String,
            enum: ["cash_on_delivery"],
            default: "cash_on_delivery",
            required: true
        },

        address: {
            type: orderAddressSchema,
            required: true,
            validate: {
                validator(value) {
                    const hasCurrentAddress = Boolean(
                        value?.region?.trim() && value?.address?.trim()
                    );
                    const hasLegacyAddress = Boolean(
                        value?.street?.trim()
                        && value?.city?.trim()
                        && value?.state?.trim()
                    );
                    return hasCurrentAddress || hasLegacyAddress;
                },
                message: "Shipping address must include region and address."
            }
        },

        status: {
            type: String,
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            default: "pending"
        },

        timeline: [{
            status: {
                type: String,
                enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
                required: true
            },
            changedAt: {
                type: Date,
                required: true
            }
        }]
    },
    {
        timestamps: true
    }
);

const orderModel = mongoose.model("Order", orderSchema);

module.exports = orderModel;
