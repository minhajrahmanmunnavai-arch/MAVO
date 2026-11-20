
const jwt = require("jsonwebtoken");
const authSessionModel = require("../models/authSession.model");
const ACCESS_COOKIE = process.env.NODE_ENV === "production" ? "__Host-mavo_access" : "token";

/**
 * @name authUser
 * @description Middleware to verify JWT token from cookie and attach user to request
 * @access Private
 */
async function authUser(req, res, next) {
    const token = req.cookies?.[ACCESS_COOKIE];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized: No token provided"
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "mavo-api",
            audience: "mavo-web",
        });
    } catch {
        return res.status(401).json({
            message: "Unauthorized: Invalid or expired token"
        });
    }

    if (!decoded.id || !decoded.sid) {
        return res.status(401).json({
            message: "Unauthorized: Invalid token payload"
        });
    }

    const activeSession = await authSessionModel.findOne({
        _id: decoded.sid,
        user: decoded.id,
        expiresAt: { $gt: new Date() },
    }).populate("user", "username email role").lean();
    if (!activeSession?.user) {
        return res.status(401).json({
            message: "Unauthorized: Session is no longer active"
        });
    }

    req.user = {
        ...decoded,
        id: String(activeSession.user._id),
        username: activeSession.user.username,
        email: activeSession.user.email,
        role: activeSession.user.role,
    };
    return next();
}

function optionalAuthUser(req, res, next) {
    if (!req.cookies?.[ACCESS_COOKIE]) {
        return next();
    }

    return authUser(req, res, next);
}

module.exports = { authUser, optionalAuthUser };
