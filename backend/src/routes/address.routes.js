const express = require("express");
const addressController = require("../controller/addressController");
const authMiddleware = require("../middlewares/auth.middleware");

const addressRouter = express.Router();

addressRouter.get("/", authMiddleware.authUser, addressController.getMyAddresses);
addressRouter.post("/", authMiddleware.authUser, addressController.createMyAddress);
addressRouter.patch(
    "/:addressId",
    authMiddleware.authUser,
    addressController.updateMyAddress
);

module.exports = addressRouter;
