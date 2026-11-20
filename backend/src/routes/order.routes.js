
const express = require("express");
const orderRouter = express.Router();
const orderController = require("../controller/orderController");
const authMiddleware = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");


/**
 * @route POST /api/orders
 * @description Create a new order
 * @access Private (Logged in users)
 */
orderRouter.post("/", authMiddleware.authUser, orderController.createOrder);


/**
 * @route GET /api/orders
 * @description Get all orders
 * @access Private (Admin only)
 */
orderRouter.get("/", authMiddleware.authUser, admin, orderController.getAllOrders);


/**
 * @route GET /api/orders/myorders
 * @description Get logged-in user's orders
 * @access Private
 */
orderRouter.get("/myorders", authMiddleware.authUser, orderController.getOrderById);

/**
 * @route PUT /api/orders/:id/cancel
 * @description Cancel a pending order owned by the logged-in user
 * @access Private
 */
orderRouter.put("/:id/cancel", authMiddleware.authUser, orderController.cancelMyOrder);

/**
 * @route DELETE /api/orders/admin/:id
 * @description Delete an order (Admin only)
 * @access Private (Admin only)
 */
orderRouter.delete("/admin/:id", authMiddleware.authUser, admin, orderController.deleteOrder);

/**
 * @route DELETE /api/orders/:id
 * @description Delete a delivered or cancelled order owned by the logged-in user
 * @access Private
 */
orderRouter.delete("/:id", authMiddleware.authUser, orderController.deleteMyOrder);


/**
 * @route PUT /api/orders/:id/status
 * @description Update order status
 * @access Private (Admin only)
 */
orderRouter.put("/:id/status", authMiddleware.authUser, admin, orderController.updateOrderStatus);


module.exports = orderRouter;
