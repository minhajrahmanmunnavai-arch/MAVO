const test = require("node:test");
const assert = require("node:assert/strict");
const {
    formatOrderNotifications,
    getCustomerNotifications,
    getCustomerUnreadNotificationCount,
    markCustomerNotificationRead,
    deleteCustomerNotification,
    deleteAllCustomerNotifications,
} = require("../src/controller/customerNotificationController");
const customerNotificationModel = require("../src/models/customerNotification.model");
const customerNotificationDismissalModel = require("../src/models/customerNotificationDismissal.model");
const productModel = require("../src/models/productUpload.model");
const productReviewModel = require("../src/models/productReview.model");
const mongoose = require("mongoose");
const {
    createNotification,
    notifyCustomerToReviewDeliveredOrder,
} = require("../src/utils/customerNotificationService");
const pushNotificationService = require("../src/utils/pushNotificationService");
const authMiddleware = require("../src/middlewares/auth.middleware");
const customerNotificationRouter = require("../src/routes/customerNotification.routes");

test("delivered orders create a review notification for each distinct product", () => {
    const orderId = "507f1f77bcf86cd799439011";
    const firstProductId = "507f1f77bcf86cd799439012";
    const secondProductId = "507f1f77bcf86cd799439013";
    const notifications = formatOrderNotifications("customer-1", [{
        _id: orderId,
        status: "delivered",
        products: [
            { product: { _id: firstProductId, title: "Desk Lamp" } },
            { product: { _id: firstProductId, title: "Desk Lamp" } },
            { product: { _id: secondProductId, title: "Chair" } },
        ],
        timeline: [{ _id: "delivery-event", status: "delivered" }],
    }]);

    const reviewNotifications = notifications.filter(({ kind }) => kind === "review");
    assert.equal(reviewNotifications.length, 2);
    assert.equal(reviewNotifications[0].title, "Review Desk Lamp");
    assert.equal(
        reviewNotifications[0].to,
        `/my-orders/${orderId}/review/${firstProductId}`
    );
    assert.equal(reviewNotifications[1].title, "Review Chair");
});

test("non-delivered orders do not create review notifications", () => {
    const notifications = formatOrderNotifications("customer-1", [{
        _id: "507f1f77bcf86cd799439011",
        status: "shipped",
        products: [{ product: "507f1f77bcf86cd799439012" }],
        timeline: [{ status: "shipped" }],
    }]);

    assert.equal(notifications.some(({ kind }) => kind === "review"), false);
});

test("delivered orders create one review notification per unreviewed product", async (t) => {
    const userId = "507f1f77bcf86cd799439011";
    const orderId = "507f1f77bcf86cd799439012";
    const reviewedProductId = "507f1f77bcf86cd799439013";
    const newProductId = "507f1f77bcf86cd799439014";
    const previousConnectionState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    t.after(() => {
        mongoose.connection.readyState = previousConnectionState;
    });

    t.mock.method(productModel, "find", (filter) => {
        assert.deepEqual(filter, {
            _id: { $in: [reviewedProductId, newProductId] },
        });
        return {
            select() {
                return this;
            },
            lean: async () => [
                { _id: reviewedProductId, title: "Desk Lamp" },
                { _id: newProductId, title: "Chair" },
            ],
        };
    });
    t.mock.method(productReviewModel, "find", (filter) => {
        assert.deepEqual(filter, {
            user: userId,
            order: orderId,
            product: { $in: [reviewedProductId, newProductId] },
        });
        return {
            select() {
                return this;
            },
            lean: async () => [{ product: reviewedProductId }],
        };
    });
    t.mock.method(customerNotificationDismissalModel, "findOne", () => ({
        select() {
            return this;
        },
        lean: async () => null,
    }));
    const saveNotification = t.mock.method(
        customerNotificationModel,
        "findOneAndUpdate",
        async (filter, update) => ({
            value: {
                ...filter,
                ...update.$setOnInsert,
            },
            lastErrorObject: { updatedExisting: true },
        })
    );
    const sendPush = t.mock.method(
        pushNotificationService,
        "sendPushNotification",
        async () => ({ sent: 1 })
    );

    const notifications = await notifyCustomerToReviewDeliveredOrder({
        _id: orderId,
        user: userId,
        products: [
            { product: reviewedProductId },
            { product: newProductId },
            { product: newProductId },
        ],
    });

    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].title, "Review Chair");
    assert.equal(saveNotification.mock.callCount(), 1);
    assert.deepEqual(saveNotification.mock.calls[0].arguments[0], {
        user: userId,
        sourceKey: `review:${orderId}:${newProductId}`,
    });
    assert.equal(sendPush.mock.callCount(), 0);
});

test("notification retries only send push once after the first database insert", async (t) => {
    const userId = "507f1f77bcf86cd799439011";
    const previousConnectionState = mongoose.connection.readyState;
    let updateCount = 0;
    mongoose.connection.readyState = 1;
    t.after(() => {
        mongoose.connection.readyState = previousConnectionState;
    });

    t.mock.method(customerNotificationDismissalModel, "findOne", () => ({
        select() {
            return this;
        },
        lean: async () => null,
    }));
    t.mock.method(customerNotificationModel, "findOneAndUpdate", async (filter, update) => {
        updateCount += 1;
        return {
            value: { ...filter, ...update.$setOnInsert },
            lastErrorObject: { updatedExisting: updateCount > 1 },
        };
    });
    const sendPush = t.mock.method(
        pushNotificationService,
        "sendPushNotification",
        async () => ({ sent: 1 })
    );

    const notification = {
        recipient: userId,
        title: "Order update",
        message: "Your order has shipped.",
        type: "order",
        sourceKey: "order:123:shipped",
    };
    await createNotification(notification);
    await createNotification(notification);

    assert.equal(sendPush.mock.callCount(), 1);
});

test("notification API routes require the existing authentication middleware", () => {
    const requiredRoutes = [
        ["POST", "/device-tokens"],
        ["DELETE", "/device-tokens"],
        ["GET", "/"],
        ["GET", "/unread-count"],
        ["PATCH", "/:id/read"],
        ["PATCH", "/read-all"],
        ["DELETE", "/:id"],
        ["DELETE", "/"],
    ];

    for (const [method, path] of requiredRoutes) {
        const route = customerNotificationRouter.stack.find(
            (layer) => layer.route?.path === path && layer.route.methods[method.toLowerCase()]
        );
        assert.ok(route, `${method} ${path} is registered`);
        assert.equal(route.route.stack[0].handle, authMiddleware.authUser);
    }
});

test("notification model accepts recipient, type, and message fields", () => {
    const recipient = "507f1f77bcf86cd799439012";
    const notification = new customerNotificationModel({
        recipient,
        sourceKey: "test:notification",
        type: "payment",
        title: "Payment received",
        message: "Your payment was received.",
        relatedId: "order-1",
        date: new Date("2026-11-18T10:00:00.000Z"),
        to: "/my-orders",
    });

    assert.equal(String(notification.user), recipient);
    assert.equal(notification.kind, "payment");
    assert.equal(notification.description, "Your payment was received.");
    assert.ok(customerNotificationModel.schema.path("createdAt"));
});

test("notification pagination rejects invalid values before reading the database", async (t) => {
    const countNotifications = t.mock.method(customerNotificationModel, "countDocuments");
    const response = createResponse();

    await getCustomerNotifications(
        { query: { page: "0", limit: "20" }, user: { id: "customer-1" } },
        response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(countNotifications.mock.callCount(), 0);
});

test("marking a notification read scopes the lookup to the authenticated user", async (t) => {
    const notificationId = "507f1f77bcf86cd799439011";
    const userId = "507f1f77bcf86cd799439012";
    const findAndUpdate = t.mock.method(
        customerNotificationModel,
        "findOneAndUpdate",
        async () => null
    );
    const response = createResponse();

    await markCustomerNotificationRead(
        { params: { id: notificationId }, user: { id: userId } },
        response
    );

    assert.deepEqual(findAndUpdate.mock.calls[0].arguments[0], {
        _id: notificationId,
        user: userId,
        isDeleted: false,
    });
    assert.equal(response.statusCode, 404);
});

test("unread count is scoped to the authenticated user", async (t) => {
    const countDocuments = t.mock.method(
        customerNotificationModel,
        "countDocuments",
        async () => 3
    );
    const response = createResponse();
    const userId = "507f1f77bcf86cd799439012";

    await getCustomerUnreadNotificationCount({ user: { id: userId } }, response);

    assert.deepEqual(countDocuments.mock.calls[0].arguments[0], {
        user: userId,
        isRead: false,
        isDeleted: false,
    });
    assert.deepEqual(response.body, { unreadCount: 3 });
});

test("deleting a notification scopes its lookup to the authenticated user", async (t) => {
    const notificationId = "507f1f77bcf86cd799439011";
    const userId = "507f1f77bcf86cd799439012";
    const findNotification = t.mock.method(
        customerNotificationModel,
        "findOne",
        async () => null
    );
    const response = createResponse();

    await deleteCustomerNotification(
        { params: { id: notificationId }, user: { id: userId } },
        response
    );

    assert.deepEqual(findNotification.mock.calls[0].arguments[0], {
        _id: notificationId,
        user: userId,
        isDeleted: false,
    });
    assert.equal(response.statusCode, 404);
});

test("delete-all only removes notifications owned by the authenticated user", async (t) => {
    const userId = "507f1f77bcf86cd799439012";
    t.mock.method(customerNotificationModel, "find", (filter) => {
        assert.deepEqual(filter, { user: userId, isDeleted: false });
        return {
            select() {
                return this;
            },
            lean: async () => [],
        };
    });
    const deleteMany = t.mock.method(
        customerNotificationModel,
        "deleteMany",
        async () => ({ deletedCount: 0 })
    );
    const response = createResponse();

    await deleteAllCustomerNotifications({ user: { id: userId } }, response);

    assert.deepEqual(deleteMany.mock.calls[0].arguments[0], { user: userId });
    assert.equal(response.statusCode, 200);
});

function createResponse() {
    return {
        statusCode: undefined,
        body: undefined,
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
