const express = require("express");
const cartController = require("../controller/cartController");
const { authUser } = require("../middlewares/auth.middleware");

const cartRouter = express.Router();

cartRouter.use(authUser);
cartRouter.get("/", cartController.getCartController);
cartRouter.post("/:productId", cartController.addToCartController);
cartRouter.patch("/:productId", cartController.updateCartItemController);
cartRouter.delete("/:productId", cartController.removeFromCartController);

module.exports = cartRouter;
