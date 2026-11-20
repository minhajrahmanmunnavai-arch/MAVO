const express = require("express");
const wishlistController = require("../controller/wishlistController");
const { authUser } = require("../middlewares/auth.middleware");

const wishlistRouter = express.Router();

wishlistRouter.use(authUser);
wishlistRouter.get("/", wishlistController.getWishlistController);
wishlistRouter.post("/:productId", wishlistController.addToWishlistController);
wishlistRouter.delete("/:productId", wishlistController.removeFromWishlistController);

module.exports = wishlistRouter;
