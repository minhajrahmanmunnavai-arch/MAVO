const express = require("express");
const inventoryController = require("../controller/inventoryController");
const authMiddleware = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");

const inventoryRouter = express.Router();

inventoryRouter.use(authMiddleware.authUser, admin);
inventoryRouter.get("/", inventoryController.getInventoryController);
inventoryRouter.patch(
    "/:id/stock",
    inventoryController.updateInventoryStockController
);

module.exports = inventoryRouter;
