const test = require("node:test");
const assert = require("node:assert/strict");
const orderController = require("../src/controller/orderController");
const orderModel = require("../src/models/order.model");
const productUploadModel = require("../src/models/productUpload.model");
const adminNotificationModel = require("../src/models/adminNotification.model");
const mongoose = require("mongoose");

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

test("order schema accepts the current shipping address fields", async () => {
    const order = new orderModel({
        user: new mongoose.Types.ObjectId(),
        products: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 20,
        }],
        totalAmount: 20,
        address: {
            fullName: "Customer",
            email: "customer@example.com",
            phoneNumber: "55512345",
            region: "Dhaka",
            address: "1 Main Street",
        },
    });

    await assert.doesNotReject(order.validate());
});

test("order schema continues to accept legacy shipping addresses", async () => {
    const order = new orderModel({
        user: new mongoose.Types.ObjectId(),
        products: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 20,
        }],
        totalAmount: 20,
        address: {
            fullName: "Customer",
            email: "customer@example.com",
            phoneNumber: "55512345",
            street: "1 Main Street",
            city: "Dhaka",
            state: "Dhaka",
        },
    });

    await assert.doesNotReject(order.validate());
});

test("order schema rejects shipping addresses missing region or address", async () => {
    const order = new orderModel({
        user: new mongoose.Types.ObjectId(),
        products: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 20,
        }],
        totalAmount: 20,
        address: {
            fullName: "Customer",
            email: "customer@example.com",
            phoneNumber: "55512345",
            region: "Dhaka",
        },
    });

    await assert.rejects(order.validate(), error => {
        assert.ok(error.errors.address);
        return true;
    });
});

test("customer cancellation updates only an owned pending order and restores stock", async (t) => {
    const orderId = "507f1f77bcf86cd799439011";
    const userId = "507f1f77bcf86cd799439012";
    const productId = "507f1f77bcf86cd799439013";
    const pendingOrder = {
        _id: orderId,
        status: "cancelled",
        products: [{ product: productId, quantity: 2 }],
    };
    const updateOrder = t.mock.method(
        orderModel,
        "findOneAndUpdate",
        async () => pendingOrder
    );
    const restoreStock = t.mock.method(
        productUploadModel,
        "updateOne",
        async () => ({ matchedCount: 1 })
    );
    const response = createResponse();

    await orderController.cancelMyOrder(
        { params: { id: orderId }, user: { id: userId } },
        response
    );

    assert.deepEqual(updateOrder.mock.calls[0].arguments[0], {
        _id: orderId,
        user: userId,
        status: "pending",
    });
    const update = updateOrder.mock.calls[0].arguments[1];
    assert.equal(update.$set.status, "cancelled");
    assert.equal(update.$push.timeline.status, "cancelled");
    assert.ok(update.$push.timeline.changedAt instanceof Date);
    assert.deepEqual(restoreStock.mock.calls[0].arguments, [
        { _id: productId },
        { $inc: { stock: 2 } },
    ]);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.orderId, orderId);
    assert.equal(response.body.status, "cancelled");
    assert.equal(typeof response.body.changedAt, "string");
});

test("customer cancellation rejects non-pending orders", async (t) => {
    const orderId = "507f1f77bcf86cd799439011";
    const findOneAndUpdate = t.mock.method(
        orderModel,
        "findOneAndUpdate",
        async () => null
    );
    t.mock.method(orderModel, "findOne", async () => ({
        _id: orderId,
        status: "processing",
    }));
    const restoreStock = t.mock.method(productUploadModel, "updateOne");
    const response = createResponse();

    await orderController.cancelMyOrder(
        { params: { id: orderId }, user: { id: "507f1f77bcf86cd799439012" } },
        response
    );

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.message, "Only pending orders can be cancelled.");
    assert.equal(findOneAndUpdate.mock.calls[0].arguments[0].status, "pending");
    assert.equal(restoreStock.mock.callCount(), 0);
});

test("customer deletion removes only delivered or cancelled orders", async (t) => {
    const orderId = "507f1f77bcf86cd799439011";
    const userId = "507f1f77bcf86cd799439012";
    const pendingOrder = {
        _id: orderId,
        status: "delivered",
        totalAmount: 20,
    };
    const deleteOrder = t.mock.method(
        orderModel,
        "findOneAndDelete",
        async () => pendingOrder
    );
    t.mock.method(adminNotificationModel, "deleteMany", async () => ({ deletedCount: 0 }));
    const response = createResponse();

    await orderController.deleteMyOrder(
        {
            params: { id: orderId },
            user: {
                id: userId,
                username: "Customer",
                email: "customer@example.com",
            },
        },
        response
    );

    const filter = deleteOrder.mock.calls[0].arguments[0];
    assert.deepEqual(filter, {
        _id: orderId,
        user: userId,
        status: { $in: ["cancelled", "delivered"] },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.orderId, orderId);
    assert.match(response.body.message, /deleted successfully/i);
});

test("customer deletion rejects a pending order without deleting it", async (t) => {
    const orderId = "507f1f77bcf86cd799439011";
    const userId = "507f1f77bcf86cd799439012";
    const deleteOrder = t.mock.method(
        orderModel,
        "findOneAndDelete",
        async () => null
    );
    t.mock.method(orderModel, "findOne", async () => ({
        _id: orderId,
        status: "pending",
    }));
    const response = createResponse();

    await orderController.deleteMyOrder(
        { params: { id: orderId }, user: { id: userId } },
        response
    );

    assert.equal(response.statusCode, 409);
    assert.equal(
        response.body.message,
        "Only cancelled or delivered orders can be deleted."
    );
    assert.deepEqual(deleteOrder.mock.calls[0].arguments[0].status, {
        $in: ["cancelled", "delivered"],
    });
});

test("admin order deletion rejects malformed IDs without querying the database", async (t) => {
    const findByIdAndDelete = t.mock.method(orderModel, "findByIdAndDelete");
    const response = createResponse();

    await orderController.deleteOrder({ params: { id: "invalid" } }, response);

    assert.equal(response.statusCode, 400);
    assert.equal(findByIdAndDelete.mock.callCount(), 0);
});

test("admin order deletion returns not found when the order does not exist", async (t) => {
    t.mock.method(orderModel, "findByIdAndDelete", async () => null);
    const response = createResponse();

    await orderController.deleteOrder(
        { params: { id: "507f1f77bcf86cd799439011" } },
        response
    );

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.message, "Order not found.");
});

test("admin order deletion removes related notifications", async (t) => {
    const order = {
        _id: "507f1f77bcf86cd799439011",
        user: "507f1f77bcf86cd799439012",
    };
    t.mock.method(orderModel, "findByIdAndDelete", async () => order);
    const deleteNotifications = t.mock.method(
        adminNotificationModel,
        "deleteMany",
        async () => ({ deletedCount: 1 })
    );
    const response = createResponse();

    await orderController.deleteOrder(
        { params: { id: order._id } },
        response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.orderId, order._id);
    assert.deepEqual(deleteNotifications.mock.calls[0].arguments[0], {
        order: order._id,
        type: "order",
    });
});

test("order stock requirements combine duplicate product lines", () => {
    const productId = "507f1f77bcf86cd799439011";
    const requirements = orderController.getOrderStockRequirements([
        { product: productId, quantity: 2 },
        { product: { _id: productId }, quantity: 3 },
    ]);

    assert.deepEqual([...requirements], [[productId, 5]]);
});

test("order stock reservation deducts the exact requested quantity atomically", async (t) => {
    const productId = "507f1f77bcf86cd799439011";
    const findOneAndUpdate = t.mock.method(
        productUploadModel,
        "findOneAndUpdate",
        async () => ({ _id: productId })
    );
    const requirements = orderController.getOrderStockRequirements([
        { product: productId, quantity: 4 },
    ]);

    const reserved = await orderController.reserveOrderStock(requirements);

    assert.deepEqual(reserved, [[productId, 4]]);
    assert.deepEqual(findOneAndUpdate.mock.calls[0].arguments, [
        { _id: productId, stock: { $gte: 4 } },
        { $inc: { stock: -4 } },
        { new: true },
    ]);
});

test("order stock reservation restores earlier deductions if an item is unavailable", async (t) => {
    const firstProductId = "507f1f77bcf86cd799439011";
    const secondProductId = "507f1f77bcf86cd799439012";
    let updateCount = 0;
    t.mock.method(productUploadModel, "findOneAndUpdate", async () => {
        updateCount += 1;
        return updateCount === 1 ? { _id: firstProductId } : null;
    });
    const restoreStock = t.mock.method(
        productUploadModel,
        "updateOne",
        async () => ({ matchedCount: 1 })
    );
    const requirements = orderController.getOrderStockRequirements([
        { product: firstProductId, quantity: 2 },
        { product: secondProductId, quantity: 1 },
    ]);

    await assert.rejects(
        orderController.reserveOrderStock(requirements),
        { statusCode: 400 }
    );

    assert.deepEqual(restoreStock.mock.calls[0].arguments, [
        { _id: firstProductId },
        { $inc: { stock: 2 } },
    ]);
});

test("order creation reports insufficient inventory without creating an order", async (t) => {
    const productId = "507f1f77bcf86cd799439011";
    const findOneAndUpdate = t.mock.method(
        productUploadModel,
        "findOneAndUpdate",
        async () => null
    );
    const response = createResponse();

    await orderController.createOrder(
        {
            user: { id: "507f1f77bcf86cd799439012" },
            body: {
                products: [{ product: productId, quantity: 3, price: 10 }],
                totalAmount: 30,
                address: {
                    fullName: "Customer",
                    email: "customer@example.com",
                    phoneNumber: "55512345",
                    region: "Dhaka",
                    address: "1 Main Street",
                },
            },
        },
        response
    );

    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /insufficient stock/i);
    assert.equal(findOneAndUpdate.mock.callCount(), 1);
});

test("order creation rejects incomplete shipping details before reserving inventory", async (t) => {
    const productId = "507f1f77bcf86cd799439011";
    const findOneAndUpdate = t.mock.method(
        productUploadModel,
        "findOneAndUpdate",
        async () => ({ _id: productId })
    );
    const response = createResponse();

    await orderController.createOrder(
        {
            user: { id: "507f1f77bcf86cd799439012" },
            body: {
                products: [{ product: productId, quantity: 1, price: 10 }],
                totalAmount: 10,
                address: {
                    fullName: "Customer",
                    email: "customer@example.com",
                    phoneNumber: "55512345",
                    region: "Dhaka",
                },
            },
        },
        response
    );

    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /complete shipping details/i);
    assert.equal(findOneAndUpdate.mock.callCount(), 0);
});
