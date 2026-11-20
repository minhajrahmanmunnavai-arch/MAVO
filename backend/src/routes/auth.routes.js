
const express = require("express");
const authRouter = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const authController = require("../controller/authController");
const { rateLimit } = require("express-rate-limit");
const MongoRateLimitStore = require("../utils/mongoRateLimitStore");

const logoutRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    store: new MongoRateLimitStore("auth-logout:"),
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerNewUserController);

/**
 * @route POST /api/auth/login
 * @description Login user with email and password
 * @access Public
 */
authRouter.post("/login", authController.loginUserController);

/**
 * @route POST /api/auth/refresh
 * @description Generate a new access token using refresh token
 * @access Public
 */
authRouter.post("/refresh", authController.refreshTokenController);

/**
 * @route POST /api/auth/logout
 * @description Logout user and clear cookies
 * @access Public
 */
authRouter.post("/logout", logoutRateLimit, authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @description Get the current logged-in user details
 * @access Private
 */
authRouter.get(
    "/get-me", authMiddleware.authUser, authController.getmeController);

authRouter.get(
    "/socket-token",
    authMiddleware.authUser,
    authController.createSocketTokenController
);

module.exports = authRouter;
