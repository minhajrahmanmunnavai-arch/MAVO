const userModel = require("../models/user.model");
const orderModel = require("../models/order.model");
const productUploadModel = require("../models/productUpload.model");

const VALID_PERIODS = new Set(["daily", "weekly", "monthly", "yearly"]);
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getPeriodWindow(period, now = new Date()) {
    const today = startOfUtcDay(now);
    const year = today.getUTCFullYear();

    if (period === "daily") {
        const previousStart = new Date(today.getTime() - DAY_MS);
        return {
            labels: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
            start: today,
            end: new Date(today.getTime() + DAY_MS),
            previousStart,
        };
    }

    if (period === "weekly") {
        const mondayOffset = (today.getUTCDay() + 6) % 7;
        const start = new Date(today.getTime() - mondayOffset * DAY_MS);
        const previousStart = new Date(start.getTime() - 7 * DAY_MS);
        return {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            start,
            end: new Date(start.getTime() + 7 * DAY_MS),
            previousStart,
        };
    }

    if (period === "monthly") {
        return {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            start: new Date(Date.UTC(year, 0, 1)),
            end: new Date(Date.UTC(year + 1, 0, 1)),
            previousStart: new Date(Date.UTC(year - 1, 0, 1)),
        };
    }

    return {
        labels: Array.from({ length: 4 }, (_, index) => String(year - 3 + index)),
        start: new Date(Date.UTC(year - 3, 0, 1)),
        end: new Date(Date.UTC(year + 1, 0, 1)),
        previousStart: new Date(Date.UTC(year - 7, 0, 1)),
    };
}

function getRevenuePeriodWindow(period, now = new Date()) {
    const currentEnd = now;
    let currentStart;
    let previousStart;

    if (period === "daily") {
        currentStart = startOfUtcDay(now);
        previousStart = new Date(currentStart.getTime() - DAY_MS);
    } else if (period === "weekly") {
        const mondayOffset = (now.getUTCDay() + 6) % 7;
        currentStart = new Date(startOfUtcDay(now).getTime() - mondayOffset * DAY_MS);
        previousStart = new Date(currentStart.getTime() - 7 * DAY_MS);
    } else if (period === "monthly") {
        currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    } else {
        currentStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        previousStart = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
    }

    const elapsed = currentEnd.getTime() - currentStart.getTime();
    const previousPeriodEnd = new Date(
        previousStart.getTime() + elapsed
    );
    const currentPeriodStart = currentStart.getTime();

    return {
        currentStart,
        currentEnd,
        previousStart,
        previousEnd: new Date(Math.min(previousPeriodEnd.getTime(), currentPeriodStart)),
    };
}

function buildRevenuePipeline(window) {
    return [
        {
            $match: {
                status: "delivered",
                paymentMethod: "cash_on_delivery",
                "timeline.status": "delivered",
            },
        },
        {
            $addFields: {
                deliveredAt: {
                    $arrayElemAt: [
                        {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$timeline",
                                        as: "event",
                                        cond: { $eq: ["$$event.status", "delivered"] },
                                    },
                                },
                                as: "event",
                                in: "$$event.changedAt",
                            },
                        },
                        -1,
                    ],
                },
            },
        },
        {
            $match: {
                $or: [
                    {
                        deliveredAt: {
                            $gte: window.currentStart,
                            $lt: window.currentEnd,
                        },
                    },
                    {
                        deliveredAt: {
                            $gte: window.previousStart,
                            $lt: window.previousEnd,
                        },
                    },
                ],
            },
        },
        { $unwind: "$products" },
        {
            $group: {
                _id: {
                    $cond: [
                        {
                            $and: [
                                { $gte: ["$deliveredAt", window.currentStart] },
                                { $lt: ["$deliveredAt", window.currentEnd] },
                            ],
                        },
                        "current",
                        "previous",
                    ],
                },
                revenue: {
                    $sum: {
                        $multiply: [
                            { $ifNull: ["$products.price", 0] },
                            { $ifNull: ["$products.quantity", 0] },
                        ],
                    },
                },
            },
        },
    ];
}

async function getRevenueStats(req, res) {
    const period = req.query.period || "monthly";
    if (typeof period !== "string" || !VALID_PERIODS.has(period)) {
        return res.status(400).json({
            message: "Period must be daily, weekly, monthly, or yearly.",
        });
    }

    try {
        const window = getRevenuePeriodWindow(period);
        const rows = await orderModel.aggregate(buildRevenuePipeline(window));
        const revenueByPeriod = new Map(rows.map((row) => [row._id, Number(row.revenue) || 0]));
        const currentRevenue = revenueByPeriod.get("current") || 0;
        const previousRevenue = revenueByPeriod.get("previous") || 0;
        const percentageChange = previousRevenue
            ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1))
            : null;

        return res.status(200).json({
            period,
            currentRevenue,
            previousRevenue,
            percentageChange,
        });
    } catch (error) {
        console.error("Error fetching dashboard revenue stats:", error);
        return res.status(500).json({ message: "Unable to load dashboard revenue stats." });
    }
}

function getTrendGroupKey(period) {
    if (period === "daily" || period === "weekly") {
        return { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } };
    }
    if (period === "monthly") {
        return { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
    }
    return { year: { $year: "$createdAt" } };
}

function formatTrend(period, window, rows) {
    const current = Array(window.labels.length).fill(0);
    const previous = Array(window.labels.length).fill(0);
    const startOfDayKey = (date) => date.toISOString().slice(0, 10);

    for (const row of rows) {
        const key = row._id;
        const value = Number(row.volume) || 0;
        const dateKey = typeof key === "string" ? key : key.date;
        let index = -1;
        let isPrevious = false;

        if (period === "daily") {
            const hour = Number(key.hour);
            index = Number.isInteger(hour) ? Math.floor(hour / 3) : -1;
            isPrevious = dateKey === startOfDayKey(window.previousStart);
        } else if (period === "weekly") {
            const date = new Date(`${dateKey}T00:00:00.000Z`);
            const currentOffset = Math.floor((date.getTime() - window.start.getTime()) / DAY_MS);
            const previousOffset = Math.floor((date.getTime() - window.previousStart.getTime()) / DAY_MS);
            if (currentOffset >= 0 && currentOffset < 7) index = currentOffset;
            else if (previousOffset >= 0 && previousOffset < 7) {
                index = previousOffset;
                isPrevious = true;
            }
        } else if (period === "monthly") {
            const rowYear = Number(key.year);
            index = Number(key.month) - 1;
            isPrevious = rowYear === window.previousStart.getUTCFullYear();
        } else {
            const rowYear = Number(key.year);
            const currentYear = window.start.getUTCFullYear();
            const previousYear = window.previousStart.getUTCFullYear();
            if (rowYear >= currentYear && rowYear < window.end.getUTCFullYear()) {
                index = rowYear - currentYear;
            } else if (rowYear >= previousYear && rowYear < currentYear) {
                index = rowYear - previousYear;
                isPrevious = true;
            }
        }

        if (index >= 0 && index < current.length) {
            const target = isPrevious ? previous : current;
            target[index] += value;
        }
    }

    return { labels: window.labels, current, previous };
}

function buildSalesTrendPipeline(period, window) {
    const groupId = getTrendGroupKey(period);
    if (period === "daily") {
        groupId.hour = { $multiply: [{ $floor: { $divide: [{ $hour: "$createdAt" }, 3] } }, 3] };
    }

    return [
        {
            $match: {
                status: { $ne: "cancelled" },
                createdAt: { $gte: window.previousStart, $lt: window.end },
            },
        },
        {
            $group: {
                _id: groupId,
                volume: { $sum: { $ifNull: ["$totalAmount", 0] } },
                orderCount: { $sum: 1 },
            },
        },
    ];
}

function buildProductSalesPipeline(match) {
    return [
        { $match: match },
        { $unwind: "$products" },
        {
            $lookup: {
                from: productUploadModel.collection.name,
                localField: "products.product",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: "$product" },
    ];
}

async function getAdminState(req, res) {
    const period = req.query.period || "monthly";
    if (typeof period !== "string" || !VALID_PERIODS.has(period)) {
        return res.status(400).json({
            message: "Period must be daily, weekly, monthly, or yearly.",
        });
    }

    try {
        const window = getPeriodWindow(period);
        const [
            totalUsers,
            totalOrders,
            totalProducts,
            customers,
            pendingOrders,
            averageOrderRows,
            trendRows,
            recentOrderRows,
            topProductRows,
            categoryRows,
        ] = await Promise.all([
            userModel.countDocuments({}),
            orderModel.countDocuments({}),
            productUploadModel.countDocuments({}),
            userModel.countDocuments({ role: "user" }),
            orderModel.countDocuments({ status: "pending" }),
            orderModel.aggregate([
                { $match: { status: { $ne: "cancelled" } } },
                {
                    $group: {
                        _id: null,
                        orderCount: { $sum: 1 },
                        orderVolume: { $sum: { $ifNull: ["$totalAmount", 0] } },
                    },
                },
            ]),
            orderModel.aggregate(buildSalesTrendPipeline(period, window)),
            orderModel
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("user", "username email")
                .select("_id user products totalAmount status createdAt address")
                .lean(),
            orderModel.aggregate([
                ...buildProductSalesPipeline({ status: "delivered" }),
                {
                    $group: {
                        _id: "$products.product",
                        name: { $first: { $ifNull: ["$product.title", "$product.productName"] } },
                        category: { $first: "$product.category" },
                        image: { $first: "$product.mainImage" },
                        price: { $first: "$product.price" },
                        salesCount: { $sum: "$products.quantity" },
                    },
                },
                { $sort: { salesCount: -1, name: 1 } },
                { $limit: 3 },
            ]),
            orderModel.aggregate([
                ...buildProductSalesPipeline({ status: "delivered" }),
                {
                    $group: {
                        _id: { $ifNull: ["$product.category", "Uncategorized"] },
                        volume: {
                            $sum: {
                                $multiply: [
                                    { $ifNull: ["$products.price", 0] },
                                    { $ifNull: ["$products.quantity", 0] },
                                ],
                            },
                        },
                    },
                },
                { $sort: { volume: -1, _id: 1 } },
            ]),
        ]);

        const averageOrder = averageOrderRows[0];
        const trend = formatTrend(period, window, trendRows);
        const categoryVolume = categoryRows.reduce(
            (total, category) => total + (Number(category.volume) || 0),
            0
        );

        return res.status(200).json({
            totalUsers,
            totalOrders,
            totalProducts,
            stats: {
                orders: totalOrders,
                customers,
                catalogItems: totalProducts,
                pendingOrders,
                verifiedSellers: null,
                sellerDataAvailable: false,
            },
            metrics: {
                averageOrderValue: averageOrder?.orderCount
                    ? averageOrder.orderVolume / averageOrder.orderCount
                    : 0,
                checkoutConversionRate: null,
                returnRefundRatio: null,
                customerRating: null,
            },
            salesTrend: {
                period,
                labels: trend.labels,
                current: trend.current,
                previous: trend.previous,
            },
            categoryBreakdown: categoryRows.map((category) => ({
                name: category._id,
                volume: Number(category.volume) || 0,
                percentage: categoryVolume
                    ? Number(((category.volume / categoryVolume) * 100).toFixed(2))
                    : 0,
            })),
            recentOrders: recentOrderRows.map((order) => ({
                id: String(order._id),
                customer: {
                    name: order.user?.username || order.address?.fullName || "Unknown customer",
                    email: order.user?.email || order.address?.email || "",
                },
                date: order.createdAt?.toISOString() || "",
                items: order.products || [],
                total: Number(order.totalAmount) || 0,
                orderStatus: order.status
                    ? `${order.status[0].toUpperCase()}${order.status.slice(1)}`
                    : "Pending",
            })),
            topProducts: topProductRows.map((product) => ({
                id: String(product._id),
                name: product.name || "Unnamed product",
                category: product.category || "Uncategorized",
                image: product.image || "",
                price: Number(product.price) || 0,
                salesCount: Number(product.salesCount) || 0,
            })),
        });
    } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
        return res.status(500).json({ message: "Unable to load dashboard analytics." });
    }
}

async function getOrderStats(req, res) {
    try {
        const now = new Date();
        const currentMonthStart = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            1
        ));
        const previousMonthStart = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - 1,
            1
        ));
        const previousMonthDay = Math.min(
            now.getUTCDate(),
            new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate()
        );
        const previousMonthEnd = new Date(Date.UTC(
            previousMonthStart.getUTCFullYear(),
            previousMonthStart.getUTCMonth(),
            previousMonthDay,
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds(),
            now.getUTCMilliseconds()
        ));

        const [totalOrders, currentMonthOrders, previousMonthOrders] = await Promise.all([
            orderModel.countDocuments({}),
            orderModel.countDocuments({
                createdAt: { $gte: currentMonthStart, $lte: now },
            }),
            orderModel.countDocuments({
                createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
            }),
        ]);
        const monthOverMonthChange = previousMonthOrders > 0
            ? Number((((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100).toFixed(1))
            : null;

        return res.status(200).json({
            totalOrders,
            currentMonthOrders,
            previousMonthOrders,
            monthOverMonthChange,
        });
    } catch (error) {
        console.error("Error fetching dashboard order stats:", error);
        return res.status(500).json({ message: "Unable to load dashboard order stats." });
    }
}

async function getCustomerStats(req, res) {
    try {
        const totalCustomers = await userModel.countDocuments({ role: "user" });
        return res.status(200).json({ totalCustomers });
    } catch (error) {
        console.error("Error fetching dashboard customer stats:", error);
        return res.status(500).json({ message: "Unable to load dashboard customer stats." });
    }
}

module.exports = {
    getAdminState,
    getOrderStats,
    getCustomerStats,
    getRevenueStats,
    getPeriodWindow,
    getRevenuePeriodWindow,
    formatTrend,
    buildSalesTrendPipeline,
    buildRevenuePipeline,
};
