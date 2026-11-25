const express = require("express");
const authRouter = require('./routes/auth.routes');
const productRouter = require('./routes/product.routes');
const orderRouter = require('./routes/order.routes');
const analyticsRouter = require('./routes/analytics.routes');
const categoryRouter = require('./routes/category.routes');
const inventoryRouter = require('./routes/inventory.routes');
const wishlistRouter = require('./routes/wishlist.routes');
const cartRouter = require('./routes/cart.routes');
const adminNotificationRouter = require('./routes/adminNotification.routes');
const customerNotificationRouter = require('./routes/customerNotification.routes');
const chatRouter = require('./routes/chat.routes');
const customerRouter = require('./routes/customer.routes');
const liveUpdatesRouter = require('./routes/liveUpdates.routes');
const couponRouter = require('./routes/coupon.routes');
const productReviewRouter = require("./routes/productReview.routes");
const adminReviewRouter = require("./routes/adminReview.routes");
const sitemapRouter = require("./routes/sitemap.routes");
const addressRouter = require("./routes/address.routes");
const appUpdateRouter = require("./routes/appUpdate.routes");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const csrfProtection = require("./middlewares/csrf.middleware");
const allowedOrigins = require("./utils/allowedOrigins");
const MongoRateLimitStore = require("./utils/mongoRateLimitStore");

const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY_HOPS) {
    app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
}

app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        return callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: true,
    optionsSuccessStatus: 204,
}));

app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use(csrfProtection);
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    store: new MongoRateLimitStore("auth-attempt:"),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Try again later." },
});
const refreshRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    store: new MongoRateLimitStore("auth-refresh:"),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many session refresh requests. Try again later." },
});

app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/register", authRateLimit);
app.use("/api/auth/refresh", refreshRateLimit);

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/addresses', addressRouter);
app.use("/api/app-updates", appUpdateRouter);
app.use("/api/reviews", productReviewRouter);
app.use("/api/admin/reviews", adminReviewRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/cart', cartRouter);
app.use('/api/admin/notifications', adminNotificationRouter);
app.use('/api/notifications', customerNotificationRouter);
app.use('/api/chats', chatRouter);
app.use('/api/admin/customers', customerRouter);
app.use('/api/admin/coupons', couponRouter);
app.use('/api/live-updates', liveUpdatesRouter);
app.use("/", sitemapRouter);

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error.code === 11000) {
        return res.status(409).json({ message: "A record with these details already exists." });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({ message: "Request body is too large." });
    }

    if (error.message === "Origin is not allowed by CORS.") {
        return res.status(403).json({ message: "Request origin is not allowed." });
    }

    console.error("Unhandled request error:", error);
    return res.status(500).json({ message: "An unexpected server error occurred." });
});


module.exports = app;