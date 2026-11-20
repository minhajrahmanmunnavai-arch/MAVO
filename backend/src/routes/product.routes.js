const express = require("express");
const productRouter = express.Router();
const productController = require("../controller/productController");
const authMiddleware = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files


/**
 * @route POST /api/products/upload
 * @description Upload a new product
 * @access Private (Admin only)
 */
productRouter.post("/upload", authMiddleware.authUser, admin, upload.single("mainImage"), productController.uploadProductController);


/**
 * @route GET /api/products
 * @description Get all products
 * @access Public
 */
productRouter.get("/", productController.getAllProductsController);


/**
 * @route GET /api/products/:id
 * @description Get product by ID
 * @access Public
 */
productRouter.get("/:id", productController.getProductByIdController);


/**
 * @route PUT /api/products/:id
 * @description Update product by ID
 * @access Private (Admin only)
 */
productRouter.put("/:id", authMiddleware.authUser, admin, upload.single("mainImage"), productController.updateProductController);


/**
 * @route DELETE /api/products/:id
 * @description Delete product by ID
 * @access Private (Admin only)
 */
productRouter.delete("/:id", authMiddleware.authUser, admin, productController.deleteProductController);

module.exports = productRouter;