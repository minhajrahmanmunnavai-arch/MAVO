function validateEnvironment() {
    const missing = [];

    if (!process.env.MONGO_URI) missing.push("MONGO_URI");
    if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}.`);
    }

    if (Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
        throw new Error("JWT_SECRET must be at least 32 bytes long.");
    }

    const rawOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL ||
        (process.env.NODE_ENV === "production" ? "" : "http://localhost:5173");
    const origins = rawOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);
    try {
        origins.forEach((origin) => new URL(origin));
    } catch {
        throw new Error("CORS_ORIGINS and FRONTEND_URL must contain valid absolute origins.");
    }

    if (process.env.NODE_ENV === "production") {
        if (origins.length === 0) {
            throw new Error("Set CORS_ORIGINS or FRONTEND_URL in production.");
        }

        if (process.env.HTTPS_ENABLED !== "true") {
            throw new Error("Production deployment requires HTTPS_ENABLED=true behind HTTPS.");
        }

        const sameSite = (process.env.COOKIE_SAME_SITE || "strict").toLowerCase();
        if (!["strict", "lax", "none"].includes(sameSite)) {
            throw new Error("COOKIE_SAME_SITE must be strict, lax, or none.");
        }

        if (origins.some((origin) => new URL(origin).protocol !== "https:")) {
            throw new Error("All production frontend origins must use HTTPS.");
        }
    }

    const rawProxyHops = process.env.TRUST_PROXY_HOPS;
    if (rawProxyHops !== undefined) {
        const proxyHops = Number(rawProxyHops);
        if (!Number.isInteger(proxyHops) || proxyHops < 1) {
            throw new Error("TRUST_PROXY_HOPS must be a positive integer.");
        }
    }
}

module.exports = validateEnvironment;
