const categoryModel = require("../models/category.model");
const productModel = require("../models/productUpload.model");
const { publishUpdate } = require("../utils/liveUpdates");

function getCategoryFields(body) {
    return {
        name: body.name?.trim(),
        slug: body.slug?.trim().toLowerCase(),
        description: body.description?.trim() ?? "",
        parent: body.parent?.trim() || "None",
        status: body.status || "Active",
    };
}

function isValidCategory({ name, slug, status }) {
    return Boolean(
        name &&
        slug &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
        ["Active", "Inactive"].includes(status)
    );
}

async function getAllCategoriesController(req, res) {
    try {
        const [categories, productCounts] = await Promise.all([
            categoryModel.find().sort({ name: 1 }).lean(),
            productModel.aggregate([
                { $group: { _id: "$category", productCount: { $sum: 1 } } },
            ]),
        ]);
        const countsByCategory = new Map(
            productCounts.map(({ _id, productCount }) => [_id, productCount])
        );

        return res.status(200).json({
            success: true,
            data: categories.map((category) => ({
                ...category,
                id: String(category._id),
                productCount: countsByCategory.get(category.name) || 0,
            })),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to load categories.",
        });
    }
}

async function createCategoryController(req, res) {
    const categoryFields = getCategoryFields(req.body);

    if (!isValidCategory(categoryFields)) {
        return res.status(400).json({
            success: false,
            message: "Name, a valid slug, and a valid status are required.",
        });
    }

    try {
        const duplicateName = await categoryModel.findOne({
            name: { $regex: `^${categoryFields.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        });

        if (duplicateName) {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists.",
            });
        }

        const category = await categoryModel.create(categoryFields);
        publishUpdate({ type: "categories:changed" });
        return res.status(201).json({
            success: true,
            message: "Category created successfully.",
            data: { ...category.toObject(), id: String(category._id), productCount: 0 },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A category with this slug already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create category.",
        });
    }
}

async function updateCategoryController(req, res) {
    const categoryFields = getCategoryFields(req.body);

    if (!isValidCategory(categoryFields)) {
        return res.status(400).json({
            success: false,
            message: "Name, a valid slug, and a valid status are required.",
        });
    }

    try {
        const duplicateName = await categoryModel.findOne({
            _id: { $ne: req.params.id },
            name: { $regex: `^${categoryFields.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        });

        if (duplicateName) {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists.",
            });
        }

        const category = await categoryModel.findByIdAndUpdate(
            req.params.id,
            categoryFields,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found.",
            });
        }

        publishUpdate({ type: "categories:changed" });
        return res.status(200).json({
            success: true,
            message: "Category updated successfully.",
            data: { ...category.toObject(), id: String(category._id) },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A category with this slug already exists.",
            });
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update category.",
        });
    }
}

async function deleteCategoryController(req, res) {
    try {
        const category = await categoryModel.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found.",
            });
        }

        const productsUsingCategory = await productModel.countDocuments({
            category: category.name,
        });
        if (productsUsingCategory > 0) {
            return res.status(409).json({
                success: false,
                message: "This category is assigned to products and cannot be deleted.",
            });
        }

        await category.deleteOne();
        publishUpdate({ type: "categories:changed" });
        return res.status(200).json({
            success: true,
            message: "Category deleted successfully.",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to delete category.",
        });
    }
}

module.exports = {
    getAllCategoriesController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController,
};
