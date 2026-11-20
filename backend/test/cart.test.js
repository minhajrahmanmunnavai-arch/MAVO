const test = require("node:test");
const assert = require("node:assert/strict");
const cartController = require("../src/controller/cartController");
const orderModel = require("../src/models/order.model");
const productReviewModel = require("../src/models/productReview.model");

test("cart metrics count delivered quantities and average submitted ratings", async (t) => {
    const productId = "507f1f77bcf86cd799439011";
    t.mock.method(orderModel, "aggregate", async () => [
        { _id: productId, unitsSold: 12 },
    ]);
    t.mock.method(productReviewModel, "aggregate", async () => [
        { _id: productId, ratingScore: 4.6667 },
    ]);

    const metrics = await cartController.getCartCardMetrics([productId]);

    assert.deepEqual(metrics.get(productId), {
        ratingScore: 4.7,
        unitsSold: 12,
    });
});

test("cart items include accurate metrics and recompute sale discount percentage", async (t) => {
    const productId = "507f1f77bcf86cd799439011";
    t.mock.method(orderModel, "aggregate", async () => []);
    t.mock.method(productReviewModel, "aggregate", async () => []);

    const items = await cartController.enrichCartItems([
        {
            product: {
                _id: productId,
                price: 12499,
                discountPrice: 11499,
            },
            quantity: 1,
        },
    ]);

    assert.equal(items[0].product.discountPercentage, 8);
    assert.equal(items[0].product.ratingScore, 0);
    assert.equal(items[0].product.unitsSold, 0);
});
