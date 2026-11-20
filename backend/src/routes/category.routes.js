const express = require("express");
const categoryController = require("../controller/categoryController");
const authMiddleware = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");

const categoryRouter = express.Router();

categoryRouter.get("/", categoryController.getAllCategoriesController);
categoryRouter.post(
    "/",
    authMiddleware.authUser,
    admin,
    categoryController.createCategoryController
);
categoryRouter.put(
    "/:id",
    authMiddleware.authUser,
    admin,
    categoryController.updateCategoryController
);
categoryRouter.delete("/:id",authMiddleware.authUser,admin,categoryController.deleteCategoryController
);

module.exports = categoryRouter;
