
const userModel = require("../models/user.model");
const customerModel = require("../models/customer.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authSessionModel = require("../models/authSession.model");
const {
    disconnectSessionSockets,
    publishUpdate,
} = require("../utils/liveUpdates");
const { randomBytes } = require("crypto");
const hashToken = require("../utils/hashToken");

const ACCESS_TOKEN_TTL_MS = 10 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_BCRYPT_PASSWORD_BYTES = 72;
const SOCKET_TOKEN_TTL = "5m";
const ACCESS_COOKIE = process.env.NODE_ENV === "production" ? "__Host-mavo_access" : "token";
const REFRESH_COOKIE = process.env.NODE_ENV === "production" ? "__Host-mavo_refresh" : "refreshToken";
const DUMMY_PASSWORD_HASH = bcrypt.hash(randomBytes(32).toString("hex"), 12);

function emailPattern(email) {
    const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escapedEmail}$`, "i");
}

function getCookieOptions(maxAge) {
    const defaultSameSite = process.env.NODE_ENV === "production" ? "none" : "strict";
    const sameSite = (process.env.COOKIE_SAME_SITE || defaultSameSite).toLowerCase();
    if (!["strict", "lax", "none"].includes(sameSite)) {
        throw new Error("COOKIE_SAME_SITE must be strict, lax, or none.");
    }

    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || sameSite === "none",
        sameSite,
        path: "/",
        ...(maxAge ? { maxAge } : {}),
    };
}

function clearAuthCookies(res) {
    const options = getCookieOptions();
    res.clearCookie(ACCESS_COOKIE, options);
    res.clearCookie(REFRESH_COOKIE, options);
}

function createAccessToken(user, sessionId) {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            sid: String(sessionId),
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "10m",
            algorithm: "HS256",
            issuer: "mavo-api",
            audience: "mavo-web",
        }
    );
}

async function createAuthSession(user, res) {
    const refreshToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const session = await authSessionModel.create({
        user: user._id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
    });

    res.cookie(
        ACCESS_COOKIE,
        createAccessToken(user, session._id),
        getCookieOptions(ACCESS_TOKEN_TTL_MS)
    );
    res.cookie(REFRESH_COOKIE, refreshToken, getCookieOptions(REFRESH_TOKEN_TTL_MS));
}

/**
 * @name registerNewUserController
 * @description Register a new user
 * @access Public
 */

async function registerNewUserController(req, res) {
    const { username, email, password } = req.body;

    if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        username.trim().length > 100 ||
        !email.trim() ||
        email.trim().length > 254 ||
        !password
    ) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    if (
        password.length < MIN_PASSWORD_LENGTH ||
        Buffer.byteLength(password, "utf8") > MAX_BCRYPT_PASSWORD_BYTES
    ) {
        return res.status(400).json({
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters and no more than ${MAX_BCRYPT_PASSWORD_BYTES} UTF-8 bytes.`,
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({ email: emailPattern(email) });

    if (existingUser) {
        return res.status(400).json({
            message: "User already exists"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let user;
    try {
        user = await userModel.create({
            username: username.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        throw error;
    }

    try {
        await customerModel.create({
            user: user._id,
            name: user.username,
            email: user.email,
            registeredAt: user.createdAt,
        });
    } catch (error) {
        console.error("Error creating customer profile:", error);
    }
    publishUpdate({ type: "customers:changed" });

    await createAuthSession(user, res);

    return res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
}

/**
 * @name loginUserController
 * @description Login a user
 * @access Public
 */

async function loginUserController(req, res) {
    const { email, password } = req.body;

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        email.trim().length > 254 ||
        Buffer.byteLength(password, "utf8") > MAX_BCRYPT_PASSWORD_BYTES
    ) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await userModel.findOne({ email: emailPattern(email) });

    if (!user) {
        await bcrypt.compare(password, await DUMMY_PASSWORD_HASH);
        return res.status(400).json({
            message: "Invalid credentials"
        });
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid credentials"
        });
    }

    await createAuthSession(user, res);

    return res.status(200).json({
        message: "Login successful",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
}

/**
 * @name refreshTokenController
 * @description Generate a new access token using refresh token
 * @access Public
 */

async function refreshTokenController(req, res) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
        clearAuthCookies(res);
        return res.status(401).json({ message: "Refresh token not found." });
    }

    const now = new Date();
    const tokenHash = hashToken(refreshToken);
    const session = await authSessionModel.findOne({
        expiresAt: { $gt: now },
        tokenHash,
    });

    if (!session) {
        const replayedSession = await authSessionModel.findOne({
            previousTokenHash: tokenHash,
            expiresAt: { $gt: now },
        });
        if (replayedSession) {
            await authSessionModel.deleteOne({ _id: replayedSession._id });
        }
        clearAuthCookies(res);
        return res.status(401).json({
            message: replayedSession
                ? "Refresh token reuse detected. Please sign in again."
                : "Session is invalid or expired.",
        });
    }

    const user = await userModel.findById(session.user);
    if (!user) {
        await authSessionModel.deleteOne({ _id: session._id });
        clearAuthCookies(res);
        return res.status(401).json({ message: "Session user no longer exists." });
    }

    const nextRefreshToken = randomBytes(32).toString("base64url");
    const refreshedExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const rotatedSession = await authSessionModel.findOneAndUpdate(
        { _id: session._id, tokenHash, expiresAt: { $gt: now } },
        {
            $set: {
                tokenHash: hashToken(nextRefreshToken),
                previousTokenHash: tokenHash,
                expiresAt: refreshedExpiresAt,
            },
        },
        { new: true }
    );

    if (!rotatedSession) {
        clearAuthCookies(res);
        return res.status(401).json({ message: "Session is invalid or expired." });
    }

    res.cookie(
        ACCESS_COOKIE,
        createAccessToken(user, session._id),
        getCookieOptions(ACCESS_TOKEN_TTL_MS)
    );
    res.cookie(
        REFRESH_COOKIE,
        nextRefreshToken,
        getCookieOptions(REFRESH_TOKEN_TTL_MS)
    );

    return res.status(200).json({ message: "Access token refreshed." });
}

/**
 * @name logoutUserController
 * @description Logout a user
 * @access Public
 */

async function logoutUserController(req, res) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (refreshToken) {
        const tokenHash = hashToken(refreshToken);
        const session = await authSessionModel.findOne({
            $or: [
                { tokenHash },
                { previousTokenHash: tokenHash },
            ],
        }).select("_id").lean();
        await authSessionModel.deleteOne({
            $or: [
                { tokenHash },
                { previousTokenHash: tokenHash },
            ],
        });
        if (session) disconnectSessionSockets(session._id);
    }

    clearAuthCookies(res);

    return res.status(200).json({
        message: "Logout successful"
    });
}

function createSocketTokenController(req, res) {
    const token = jwt.sign(
        {
            id: req.user.id,
            sid: req.user.sid,
            purpose: "realtime",
        },
        process.env.JWT_SECRET,
        {
            expiresIn: SOCKET_TOKEN_TTL,
            algorithm: "HS256",
            issuer: "mavo-api",
            audience: "mavo-socket",
        }
    );

    res.set("Cache-Control", "no-store");
    return res.status(200).json({ token });
}

/**
 * @name getmeController
 * @description Get current logged-in user details
 * @access Private
 */

async function getmeController(req, res) {

    // Prevent browser from caching user data
    res.set("Cache-Control", "no-store");

    const user = await userModel.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    return res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
}

module.exports = {
    registerNewUserController,
    loginUserController,
    refreshTokenController,
    logoutUserController,
    createSocketTokenController,
    getmeController
};
