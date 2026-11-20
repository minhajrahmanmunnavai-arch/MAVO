const configuredOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:5173");

const allowedOrigins = new Set(
    configuredOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
        .map((origin) => new URL(origin).origin)
);

module.exports = allowedOrigins;
