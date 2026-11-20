const express = require("express");
const couponController = require("../controller/couponController");
const authMiddleware = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");

const couponRouter = express.Router();

couponRouter.use(authMiddleware.authUser, admin);
couponRouter.get("/", couponController.getCouponsController);
couponRouter.post("/", couponController.createCouponController);
couponRouter.delete("/:id", couponController.deleteCouponController);

module.exports = couponRouter;
