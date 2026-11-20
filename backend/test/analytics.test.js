const test = require("node:test");
const assert = require("node:assert/strict");
const analyticsController = require("../src/controller/analyticsController");
const orderModel = require("../src/models/order.model");
const userModel = require("../src/models/user.model");

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

test("daily dashboard trend separates current and previous day into three-hour buckets", () => {
    const now = new Date("2026-11-11T11:00:00.000Z");
    const window = analyticsController.getPeriodWindow("daily", now);
    const trend = analyticsController.formatTrend("daily", window, [
        { _id: { date: "2026-11-11", hour: 9 }, volume: 125, orderCount: 1 },
        { _id: { date: "2026-11-10", hour: 9 }, volume: 80, orderCount: 1 },
    ]);

    assert.deepEqual(trend.labels, ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]);
    assert.equal(trend.current[3], 125);
    assert.equal(trend.previous[3], 80);
    assert.equal(trend.current.reduce((sum, value) => sum + value, 0), 125);
});

test("weekly dashboard trend aligns each week by weekday", () => {
    const window = analyticsController.getPeriodWindow("weekly", new Date("2026-11-11T11:00:00.000Z"));
    const trend = analyticsController.formatTrend("weekly", window, [
        { _id: { date: "2026-11-11" }, volume: 125, orderCount: 1 },
        { _id: { date: "2026-11-04" }, volume: 80, orderCount: 1 },
    ]);

    assert.deepEqual(trend.labels, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    assert.equal(trend.current[2], 125);
    assert.equal(trend.previous[2], 80);
});

test("monthly and yearly dashboard periods provide stable calendar windows", () => {
    const now = new Date("2026-11-11T11:00:00.000Z");
    const monthly = analyticsController.getPeriodWindow("monthly", now);
    const yearly = analyticsController.getPeriodWindow("yearly", now);

    assert.equal(monthly.start.toISOString(), "2026-01-01T00:00:00.000Z");
    assert.equal(monthly.previousStart.toISOString(), "2025-01-01T00:00:00.000Z");
    assert.deepEqual(yearly.labels, ["2023", "2024", "2025", "2026"]);
    assert.equal(yearly.previousStart.toISOString(), "2019-01-01T00:00:00.000Z");
});

test("revenue period windows compare against matching prior-period progress", () => {
    const now = new Date("2026-11-11T11:00:00.000Z");
    const daily = analyticsController.getRevenuePeriodWindow("daily", now);
    const weekly = analyticsController.getRevenuePeriodWindow("weekly", now);
    const monthly = analyticsController.getRevenuePeriodWindow("monthly", now);
    const yearly = analyticsController.getRevenuePeriodWindow("yearly", now);

    assert.equal(daily.currentStart.toISOString(), "2026-11-11T00:00:00.000Z");
    assert.equal(daily.previousStart.toISOString(), "2026-11-10T00:00:00.000Z");
    assert.equal(daily.previousEnd.toISOString(), "2026-11-10T11:00:00.000Z");
    assert.equal(weekly.currentStart.toISOString(), "2026-11-09T00:00:00.000Z");
    assert.equal(weekly.previousStart.toISOString(), "2026-11-02T00:00:00.000Z");
    assert.equal(weekly.previousEnd.toISOString(), "2026-11-04T11:00:00.000Z");
    assert.equal(monthly.previousStart.toISOString(), "2026-10-01T00:00:00.000Z");
    assert.equal(monthly.previousEnd.toISOString(), "2026-10-11T11:00:00.000Z");
    assert.equal(yearly.previousStart.toISOString(), "2025-01-01T00:00:00.000Z");
    assert.equal(yearly.previousEnd.toISOString(), "2025-11-11T11:00:00.000Z");
});

test("revenue pipeline counts delivered COD product price multiplied by quantity", () => {
    const window = analyticsController.getRevenuePeriodWindow(
        "daily",
        new Date("2026-11-11T11:00:00.000Z")
    );
    const pipeline = analyticsController.buildRevenuePipeline(window);

    assert.deepEqual(pipeline[0].$match, {
        status: "delivered",
        paymentMethod: "cash_on_delivery",
        "timeline.status": "delivered",
    });
    assert.deepEqual(pipeline[2].$match.$or, [
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
    ]);
    assert.deepEqual(pipeline[4].$group.revenue.$sum.$multiply, [
        { $ifNull: ["$products.price", 0] },
        { $ifNull: ["$products.quantity", 0] },
    ]);
});

test("revenue stats return current and prior revenue with a dynamic percentage", async (t) => {
    let pipeline;
    t.mock.method(orderModel, "aggregate", async (value) => {
        pipeline = value;
        return [
            { _id: "current", revenue: 125 },
            { _id: "previous", revenue: 100 },
        ];
    });

    const res = createResponse();
    await analyticsController.getRevenueStats({ query: { period: "weekly" } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        period: "weekly",
        currentRevenue: 125,
        previousRevenue: 100,
        percentageChange: 25,
    });
    assert.equal(pipeline[0].$match.paymentMethod, "cash_on_delivery");
    assert.equal(pipeline[0].$match.status, "delivered");
});

test("revenue stats leave percentage unavailable without a prior-period baseline", async (t) => {
    t.mock.method(orderModel, "aggregate", async () => [
        { _id: "current", revenue: 125 },
    ]);

    const res = createResponse();
    await analyticsController.getRevenueStats({ query: { period: "daily" } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.currentRevenue, 125);
    assert.equal(res.body.previousRevenue, 0);
    assert.equal(res.body.percentageChange, null);
});

test("analytics endpoint rejects unsupported periods without querying data", async () => {
    const res = createResponse();
    await analyticsController.getAdminState({ query: { period: "quarterly" } }, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /daily, weekly, monthly, or yearly/i);
});

test("order stats return all-time count and month-to-date change against the prior month", async (t) => {
    const calls = [];
    t.mock.method(orderModel, "countDocuments", async (filter) => {
        calls.push(filter);
        if (!Object.hasOwn(filter, "createdAt")) return 248;
        return filter.createdAt.$gte.getUTCMonth() === new Date().getUTCMonth() ? 12 : 10;
    });

    const res = createResponse();
    await analyticsController.getOrderStats({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totalOrders, 248);
    assert.equal(res.body.currentMonthOrders, 12);
    assert.equal(res.body.previousMonthOrders, 10);
    assert.equal(res.body.monthOverMonthChange, 20);
    assert.equal(calls.length, 3);
    assert.ok(calls[1].createdAt.$gte instanceof Date);
    assert.ok(calls[1].createdAt.$lte instanceof Date);
    assert.ok(calls[2].createdAt.$gte instanceof Date);
    assert.ok(calls[2].createdAt.$lte instanceof Date);
});

test("order stats leave monthly change unavailable without a previous-month baseline", async (t) => {
    t.mock.method(orderModel, "countDocuments", async (filter) =>
        Object.hasOwn(filter, "createdAt") ? 0 : 1
    );

    const res = createResponse();
    await analyticsController.getOrderStats({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totalOrders, 1);
    assert.equal(res.body.monthOverMonthChange, null);
});

test("customer stats count only registered customer accounts", async (t) => {
    let query;
    t.mock.method(userModel, "countDocuments", async (filter) => {
        query = filter;
        return 37;
    });

    const res = createResponse();
    await analyticsController.getCustomerStats({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totalCustomers, 37);
    assert.deepEqual(query, { role: "user" });
});
