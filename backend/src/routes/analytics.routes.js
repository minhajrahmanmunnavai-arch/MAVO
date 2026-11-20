const express = require('express');
const analyticsRouter = express.Router();
const analyticsController = require('../controller/analyticsController');
const authMiddleware = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

/**
 * @route GET /api/analytics
 * @description Get dashboard analytics; pass period=daily|weekly|monthly|yearly for the sales trend.
 * @access Private (Admin only)
 * @returns Dashboard counts, supported operational metrics, sales trend, category breakdown,
 *          recent orders, and top delivered products. Unsupported data metrics are null.
 */
analyticsRouter.get('/', authMiddleware.authUser, admin, analyticsController.getAdminState);

/**
 * @route GET /api/analytics/orders
 * @description Get total order count and month-to-date comparison with the prior month.
 * @access Private (Admin only)
 */
analyticsRouter.get('/orders', authMiddleware.authUser, admin, analyticsController.getOrderStats);

/**
 * @route GET /api/analytics/revenue
 * @description Get delivered cash-on-delivery revenue and comparison with the prior period.
 * @access Private (Admin only)
 */
analyticsRouter.get('/revenue', authMiddleware.authUser, admin, analyticsController.getRevenueStats);

/**
 * @route GET /api/analytics/customers
 * @description Get the count of registered customer accounts.
 * @access Private (Admin only)
 */
analyticsRouter.get('/customers', authMiddleware.authUser, admin, analyticsController.getCustomerStats);

module.exports = analyticsRouter;