const allowedOrigins = require("../utils/allowedOrigins");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function csrfProtection(req, res, next) {
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    const origin = req.get("origin");
    const fetchSite = req.get("sec-fetch-site");

    if (
        (origin && !allowedOrigins.has(origin)) ||
        origin === "null" ||
        fetchSite === "cross-site"
    ) {
        return res.status(403).json({ message: "Request origin is not allowed." });
    }

    return next();
}

module.exports = csrfProtection;
