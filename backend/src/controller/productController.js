const productUploadModel = require("../models/productUpload.model");
const mongoose = require("mongoose");
const orderModel = require("../models/order.model");
const productReviewModel = require("../models/productReview.model");
const cloudinary = require("../config/cloudnary");
const { publishUpdate } = require("../utils/liveUpdates");

function createProductInputError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function sanitizeSlug(value) {
    if (value === undefined) return undefined;
    if (value === null) return "";
    if (typeof value !== "string") {
        throw createProductInputError("Product slug must be a string.");
    }

    const slug = value
        .normalize("NFKC")
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "");

    if (slug.length > 160) {
        throw createProductInputError("Product slug must be 160 characters or fewer.");
    }

    return slug;
}

function ensureProductSlug(seoFields, title) {
    if (seoFields.slug) return seoFields;

    const slug = sanitizeSlug(title);
    if (!slug) {
        throw createProductInputError(
            "A valid product title or URL slug is required."
        );
    }

    return { ...seoFields, slug };
}

function sanitizeSeoText(value, field, maxLength) {
    if (value === undefined) return undefined;
    if (value === null) return "";
    if (typeof value !== "string") {
        throw createProductInputError(`${field} must be a string.`);
    }

    const sanitized = value
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (sanitized.length > maxLength) {
        throw createProductInputError(`${field} must be ${maxLength} characters or fewer.`);
    }

    return sanitized;
}

function parseSeoKeywords(value) {
    if (value === undefined || value === null || value === "") return [];

    let keywords;
    if (Array.isArray(value)) {
        keywords = value;
    } else if (typeof value === "string") {
        const trimmedValue = value.trim();
        if (!trimmedValue) return [];

        if (trimmedValue.startsWith("[")) {
            try {
                keywords = JSON.parse(trimmedValue);
            } catch {
                throw createProductInputError(
                    "SEO keywords must be a valid JSON array or comma-separated string."
                );
            }
            if (!Array.isArray(keywords)) {
                throw createProductInputError("SEO keywords must be an array of strings.");
            }
        } else {
            keywords = trimmedValue.split(",");
        }
    } else {
        throw createProductInputError("SEO keywords must be an array or string.");
    }

    const seen = new Set();
    const sanitizedKeywords = keywords.map((keyword) => {
        if (typeof keyword !== "string") {
            throw createProductInputError("Each SEO keyword must be a string.");
        }
        return keyword
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }).filter((keyword) => {
        if (!keyword) return false;
        const normalizedKeyword = keyword.toLowerCase();
        if (seen.has(normalizedKeyword)) return false;
        seen.add(normalizedKeyword);
        return true;
    });

    if (sanitizedKeywords.join(", ").length > 500) {
        throw createProductInputError("SEO keywords must total 500 characters or fewer.");
    }

    return sanitizedKeywords;
}

function sanitizeProductSeoFields(body, { partial = false } = {}) {
    const fields = [
        ["slug", () => sanitizeSlug(body.slug)],
        ["seoTitle", () => sanitizeSeoText(body.seoTitle, "SEO title", 60)],
        ["seoDescription", () => sanitizeSeoText(body.seoDescription, "SEO description", 160)],
        ["seoKeywords", () => parseSeoKeywords(body.seoKeywords)],
    ];
    const sanitized = {};

    for (const [field, sanitize] of fields) {
        if (partial && body[field] === undefined) continue;
        sanitized[field] = sanitize();
    }

    return sanitized;
}

function respondToDuplicateProductKey(error, res) {
    if (error?.code !== 11000) return false;

    const duplicateField = [
        ...Object.keys(error.keyPattern || {}),
        ...Object.keys(error.keyValue || {}),
    ][0];
    const message = duplicateField === "slug"
        ? "A product with this URL slug already exists."
        : duplicateField === "sku"
            ? "A product with this SKU already exists."
            : "A product with these details already exists.";

    res.status(409).json({ success: false, message });
    return true;
}

async function getProductCardMetrics(productIds) {
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
        if (metric) metric.unitsSold = item.unitsSold;
    }
    for (const item of ratings) {
        const metric = metrics.get(String(item._id));
        if (metric) {
            const score = Number(item.ratingScore);
            metric.ratingScore = Number.isFinite(score) ? Number(score.toFixed(1)) : 0;
        }
    }

    return metrics;
}


/**
 * @name getAllProductsController
 * @description Get all products
 * @access public
 */
async function getAllProductsController(req, res) {
    try {
        const products = await productUploadModel.find({});
        const metrics = await getProductCardMetrics(
            products.map((product) => product._id)
        );

        return res.status(200).json({
            success: true,
            data: products.map((product) => ({
                ...product.toObject(),
                ...metrics.get(String(product._id)),
            })),
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
}


/**
 * @name getProductByIdController
 * @description Get product by ID
 * @access public
 */
async function getProductByIdController(req, res) {
    try {
        const identifier = req.params.id;
        let product = null;

        if (mongoose.isValidObjectId(identifier)) {
            product = await productUploadModel.findById(identifier);
        }
        if (!product) {
            product = await productUploadModel.findOne({ slug: identifier });
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const metrics = await getProductCardMetrics([product._id]);
        return res.status(200).json({
            success: true,
            data: {
                ...product.toObject(),
                ...metrics.get(String(product._id)),
            },
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
}


/**
 * @name uploadProductController
 * @description Upload a new product
 * @access private (Admin only)
 */
async function uploadProductController(req, res) {
    try {
        const {
            title,
            sku,
            brandName,
            category,
            section,
            shopName,
            productName,
            description,
            keywords,
            price,
            discountPrice,
            tax,
            stock,
            lowStock,
        } = req.body;
        const seoFields = ensureProductSlug(
            sanitizeProductSeoFields(req.body),
            title
        );


        // Upload main image to Cloudinary
        let mainImage = "";

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);

            mainImage = result.secure_url;
        }


        // Create product
        const newProduct = new productUploadModel({
            title,
            sku,
            brandName,
            category,
            section,
            shopName,
            productName,
            description,
            keywords,
            ...seoFields,
            price,
            discountPrice,
            tax,
            stock,
            lowStock,
            mainImage,
        });


        // Save to MongoDB
        const createdProduct = await newProduct.save();
        publishUpdate({ type: "products:changed" });

        return res.status(201).json({
            success: true,
            message: "Product uploaded successfully",
            data: createdProduct,
        });

    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (respondToDuplicateProductKey(error, res)) return;

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
}


/**
 * @name updateProductController
 * @description Update product by ID
 * @access private (Admin only)
 */
async function updateProductController(req, res) {
    try {
        const product = await productUploadModel.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }


        const {
            title,
            sku,
            brandName,
            category,
            section,
            shopName,
            productName,
            description,
            keywords,
            price,
            discountPrice,
            tax,
            stock,
            lowStock,
        } = req.body;
        let seoFields = sanitizeProductSeoFields(req.body, { partial: true });
        if (
            !product.slug ||
            (Object.prototype.hasOwnProperty.call(seoFields, "slug") &&
                !seoFields.slug)
        ) {
            seoFields = ensureProductSlug(
                seoFields,
                title === undefined ? product.title : title
            );
        }


        // Update product fields
        if (title !== undefined) product.title = title;
        if (sku !== undefined) product.sku = sku;
        if (brandName !== undefined) product.brandName = brandName;
        if (category !== undefined) product.category = category;
        if (section !== undefined) product.section = section;
        if (shopName !== undefined) product.shopName = shopName;
        if (productName !== undefined) product.productName = productName;
        if (description !== undefined) product.description = description;
        if (keywords !== undefined) product.keywords = keywords;
        Object.assign(product, seoFields);
        if (price !== undefined) product.price = price;
        if (discountPrice !== undefined) {
            product.discountPrice = discountPrice === "" ? null : discountPrice;
        }
        if (tax !== undefined) product.tax = tax === "" ? 0 : tax;
        if (stock !== undefined) product.stock = stock;
        if (lowStock !== undefined) product.lowStock = lowStock === "" ? 10 : lowStock;


        // Update main image if a new image is selected
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);

            product.mainImage = result.secure_url;
        }


        const updatedProduct = await product.save();
        publishUpdate({ type: "products:changed" });

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });

    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (respondToDuplicateProductKey(error, res)) return;

        console.log("Update Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
}


/**
 * @name deleteProductController
 * @description Delete product by ID
 * @access private (Admin only)
 */
async function deleteProductController(req, res) {
    try {

        const product = await productUploadModel.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        await product.deleteOne();
        publishUpdate({ type: "products:changed" });

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
}


module.exports = {
    uploadProductController,
    getProductByIdController,
    getProductCardMetrics,
    getAllProductsController,
    updateProductController,
    deleteProductController,
};