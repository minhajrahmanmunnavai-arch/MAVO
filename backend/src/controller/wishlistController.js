const mongoose = require("mongoose");
const productModel = require("../models/productUpload.model");
const userModel = require("../models/user.model");
const adminNotificationModel = require("../models/adminNotification.model");
const { publishUpdate } = require("../utils/liveUpdates");

async function getWishlistController(req, res) {
    try {
        const user = await userModel
            .findById(req.user.id)
            .populate("wishlist");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: user.wishlist.filter(Boolean),
        });
    } catch (error) {
        console.error("Get Wishlist Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load wishlist.",
        });
    }
}

async function addToWishlistController(req, res) {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "A valid product ID is required.",
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

        const alreadyInWishlist = user.wishlist.some(
            (savedProductId) => String(savedProductId) === String(product._id)
        );
        await userModel.updateOne(
            { _id: user._id },
            { $addToSet: { wishlist: product._id } }
        );

        if (!alreadyInWishlist) {
            try {
                await adminNotificationModel.create({
                    type: "wishlist",
                    title: "Product Added to Wishlist",
                    message: `${user.username} (${user.email}) added "${product.title || product.productName}" to their wishlist.`,
                    user: user._id,
                    userName: user.username,
                    userEmail: user.email,
                    product: product._id,
                    productName: product.title || product.productName,
                });
                publishUpdate({ type: "notifications:changed" });
                publishUpdate({ type: "wishlist:changed", userId: req.user.id });
            } catch (error) {
                await userModel.updateOne(
                    { _id: user._id },
                    { $pull: { wishlist: product._id } }
                );
                throw error;
            }
        }

        const updatedUser = await userModel
            .findById(user._id)
            .populate("wishlist");

        return res.status(200).json({
            success: true,
            data: updatedUser.wishlist.filter(Boolean),
        });
    } catch (error) {
        console.error("Add Wishlist Item Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to add product to wishlist.",
        });
    }
}

async function removeFromWishlistController(req, res) {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "A valid product ID is required.",
        });
    }

    try {
        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            { $pull: { wishlist: productId } },
            { new: true }
        ).populate("wishlist");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        publishUpdate({ type: "wishlist:changed", userId: req.user.id });
        return res.status(200).json({
            success: true,
            data: user.wishlist.filter(Boolean),
        });
    } catch (error) {
        console.error("Remove Wishlist Item Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to remove product from wishlist.",
        });
    }
}

module.exports = {
    getWishlistController,
    addToWishlistController,
    removeFromWishlistController,
};
