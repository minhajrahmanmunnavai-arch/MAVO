const mongoose = require("mongoose");
const productUploadModel = require("../models/productUpload.model");
const { publishUpdate } = require("../utils/liveUpdates");

const inventoryFields = "title productName sku category stock lowStock mainImage";

async function getInventoryController(req, res) {
    try {
        const products = await productUploadModel
            .find({})
            .select(inventoryFields)
            .sort({ title: 1 });

        return res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error("Get Inventory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load inventory.",
        });
    }
}

async function updateInventoryStockController(req, res) {
    const { id } = req.params;
    const { stock } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "A valid product ID is required.",
        });
    }

    if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
            success: false,
            message: "Stock must be a non-negative integer.",
        });
    }

    try {
        const product = await productUploadModel
            .findByIdAndUpdate(
                id,
                { $set: { stock } },
                { new: true, runValidators: true }
            )
            .select(inventoryFields);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        publishUpdate({ type: "products:changed" });
        return res.status(200).json({
            success: true,
            message: "Inventory stock updated.",
            data: product,
        });
    } catch (error) {
        console.error("Update Inventory Stock Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update inventory stock.",
        });
    }
}

module.exports = {
    getInventoryController,
    updateInventoryStockController,
};
