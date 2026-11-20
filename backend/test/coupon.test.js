const test = require("node:test");
const assert = require("node:assert/strict");
const couponController = require("../src/controller/couponController");
const couponModel = require("../src/models/coupon.model");

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

const validCoupon = {
    code: "  SAVE20 ",
    discountType: "percentage",
    discountValue: 20,
    minPurchase: 100,
    maxDiscount: 50,
    startDate: "2026-11-01",
    expiryDate: "2026-12-31",
    usageLimit: 500,
    status: "Active",
};

test("coupon creation normalizes the code and persists valid data", async (t) => {
    let savedFields;
    t.mock.method(couponModel, "create", async (fields) => {
        savedFields = fields;
        return {
            ...fields,
            _id: "507f1f77bcf86cd799439011",
            usageCount: 0,
            toObject() {
                return this;
            },
        };
    });

    const res = createResponse();
    await couponController.createCouponController({ body: validCoupon }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(savedFields.code, "SAVE20");
    assert.equal(res.body.data.id, "507f1f77bcf86cd799439011");
    assert.equal(res.body.data.usageCount, 0);
});

test("coupon creation rejects invalid discounts before database writes", async (t) => {
    let createCalled = false;
    t.mock.method(couponModel, "create", async () => {
        createCalled = true;
    });

    const res = createResponse();
    await couponController.createCouponController(
        { body: { ...validCoupon, discountValue: 101 } },
        res
    );

    assert.equal(res.statusCode, 400);
    assert.equal(createCalled, false);
});

test("coupon creation reports duplicate codes as a conflict", async (t) => {
    t.mock.method(couponModel, "create", async () => {
        const error = new Error("duplicate");
        error.code = 11000;
        throw error;
    });

    const res = createResponse();
    await couponController.createCouponController({ body: validCoupon }, res);

    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /already exists/i);
});

test("coupon deletion rejects malformed IDs without a database call", async (t) => {
    let deleteCalled = false;
    t.mock.method(couponModel, "findByIdAndDelete", async () => {
        deleteCalled = true;
    });

    const res = createResponse();
    await couponController.deleteCouponController({ params: { id: "invalid" } }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(deleteCalled, false);
});
