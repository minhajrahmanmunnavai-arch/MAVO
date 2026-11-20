const mongoose = require("mongoose");
const productModel = require("../models/productUpload.model");
const userModel = require("../models/user.model");
const orderModel = require("../models/order.model");
const productReviewModel = require("../models/productReview.model");
const { publishUpdate } = require("../utils/liveUpdates");

async function getCartCardMetrics(productIds) {
    if (productIds.length === 0) return new Map();

    const [sales, ratings] = await Promise.all([
        orderModel.aggregate([
            {
                $match: {
                    status: "delivered",
                    "products.product": { $in: productIds },
                },
            },
            { $unwind: "$products" },
            {
                $match: {
                    status: "delivered",
                    "products.product": { $in: productIds },
                },
            },
            {
                $group: {
                    _id: "$products.product",
                    unitsSold: { $sum: "$products.quantity" },
                },
            },
        ]),
        productReviewModel.aggregate([
            { $match: { product: { $in: productIds } } },
            {
                $group: {
                    _id: "$product",
                    ratingScore: { $avg: "$rating" },
                },
            },
        ]),
    ]);

    const metrics = new Map(
        productIds.map((productId) => [
            String(productId),
            { ratingScore: 0, unitsSold: 0 },
        ])
    );

    for (const item of sales) {
        const metric = metrics.get(String(item._id));
        if (metric) metric.unitsSold = Number(item.unitsSold) || 0;
    }
    for (const item of ratings) {
        const metric = metrics.get(String(item._id));
        if (metric) {
            const score = Number(item.ratingScore);
            metric.ratingScore = Number.isFinite(score)
                ? Number(score.toFixed(1))
                : 0;
        }
    }

    return metrics;
}

async function enrichCartItems(cartItems) {
    const productIds = cartItems
        .map((item) => item?.product?._id || item?.product?.id)
        .filter(Boolean);
    const metrics = await getCartCardMetrics(productIds);

    return cartItems
        .filter((item) => item?.product)
        .map((item) => {
            const product = typeof item.product.toObject === "function"
                ? item.product.toObject()
                : { ...item.product };
            const regularPrice = Number(product.price);
            const salePrice = Number(product.discountPrice);
            const hasSalePrice =
                product.discountPrice !== null &&
                product.discountPrice !== undefined &&
                product.discountPrice !== "";
            const discountPercentage =
                hasSalePrice &&
                Number.isFinite(regularPrice) &&
                regularPrice > 0 &&
                Number.isFinite(salePrice) &&
                salePrice >= 0 &&
                salePrice < regularPrice
                    ? Number(
                        (((regularPrice - salePrice) / regularPrice) * 100).toFixed(2)
                    )
                    : 0;

            return {
                product: {
                    ...product,
                    discountPercentage,
                    ...metrics.get(String(product._id)),
                },
                quantity: item.quantity,
            };
        });
}

async function getCartController(req, res) {
    try {
        const user = await userModel.findById(req.user.id).populate("cart.product");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: await enrichCartItems(user.cart),
        });
    } catch (error) {
        console.error("Get Cart Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load shopping cart.",
        });
    }
}

async function addToCartController(req, res) {
    const { productId } = req.params;
    const quantity = req.body.quantity === undefined ? 1 : req.body.quantity;

    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "A valid product ID is required.",
        });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be a positive integer.",
        });
    }

    try {
        const [user, product] = await Promise.all([
            userModel.findById(req.user.id),
            productModel.findById(productId),
        ]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        const existingItem = user.cart.find(
            (item) => String(item.product) === productId
        );
        const nextQuantity = (existingItem?.quantity || 0) + quantity;

        if (nextQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} item(s) are currently available.`,
            });
        }

        if (existingItem) {
            existingItem.quantity = nextQuantity;
        } else {
            user.cart.push({ product: product._id, quantity });
        }

        await user.save();
        publishUpdate({ type: "cart:changed", userId: req.user.id });
        const updatedUser = await userModel.findById(user._id).populate("cart.product");

        return res.status(200).json({
            success: true,
            data: await enrichCartItems(updatedUser.cart),
        });
    } catch (error) {
        console.error("Add Cart Item Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to add product to shopping cart.",
        });
    }
}

async function updateCartItemController(req, res) {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "A valid product ID is required.",
        });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be a positive integer.",
        });
    }

    try {
        const [user, product] = await Promise.all([
            userModel.findById(req.user.id),
            productModel.findById(productId),
        ]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} item(s) are currently available.`,
            });
        }

        const cartItem = user.cart.find(
            (item) => String(item.product) === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product is not in the shopping cart.",
            });
        }

        cartItem.quantity = quantity;
        await user.save();
        publishUpdate({ type: "cart:changed", userId: req.user.id });
        const updatedUser = await userModel.findById(user._id).populate("cart.product");

        return res.status(200).json({
            success: true,
            data: await enrichCartItems(updatedUser.cart),
        });
    } catch (error) {
        console.error("Update Cart Item Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update shopping cart.",
        });
    }
}

async function removeFromCartController(req, res) {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "A valid product ID is required.",
        });
    }

    try {
        const user = await userModel
            .findByIdAndUpdate(
                req.user.id,
                { $pull: { cart: { product: productId } } },
                { new: true }
            )
            .populate("cart.product");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        publishUpdate({ type: "cart:changed", userId: req.user.id });
        return res.status(200).json({
            success: true,
            data: await enrichCartItems(user.cart),
        });
    } catch (error) {
        console.error("Remove Cart Item Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to remove product from shopping cart.",
        });
    }
}

module.exports = {
    getCartCardMetrics,
    enrichCartItems,
    getCartController,
    addToCartController,
    updateCartItemController,
    removeFromCartController,
};
