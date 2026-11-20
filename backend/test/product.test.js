const test = require("node:test");
const assert = require("node:assert/strict");
const productController = require("../src/controller/productController");
const orderModel = require("../src/models/order.model");
const productReviewModel = require("../src/models/productReview.model");
const productUploadModel = require("../src/models/productUpload.model");
const cloudinary = require("../src/config/cloudnary");

function createResponse() {
    return {
        statusCode: null,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

test("product card metrics count delivered quantities and average submitted ratings", async (t) => {
    const productId = "507f1f77bcf86cd799439011";
    const salesAggregate = t.mock.method(orderModel, "aggregate", async () => [
        { _id: productId, unitsSold: 7 },
    ]);
    const ratingAggregate = t.mock.method(
        productReviewModel,
        "aggregate",
        async () => [{ _id: productId, ratingScore: 4.6667 }]
    );

    const metrics = await productController.getProductCardMetrics([productId]);

    assert.deepEqual(metrics.get(productId), {
        ratingScore: 4.7,
        unitsSold: 7,
    });
    assert.equal(salesAggregate.mock.calls[0].arguments[0][0].$match.status, "delivered");
    assert.equal(salesAggregate.mock.calls[0].arguments[0][3].$group.unitsSold.$sum, "$products.quantity");
    assert.equal(ratingAggregate.mock.calls[0].arguments[0][1].$group.ratingScore.$avg, "$rating");
});

test("product card metrics show zero values when there are no sales or reviews", async (t) => {
    t.mock.method(orderModel, "aggregate", async () => []);
    t.mock.method(productReviewModel, "aggregate", async () => []);

    const metrics = await productController.getProductCardMetrics([
        "507f1f77bcf86cd799439011",
    ]);

    assert.deepEqual(
        metrics.get("507f1f77bcf86cd799439011"),
        { ratingScore: 0, unitsSold: 0 }
    );
});

test("product upload parses SEO keywords and keeps Cloudinary image uploads", async (t) => {
    const cloudinaryUpload = t.mock.method(
        cloudinary.uploader,
        "upload",
        async (path) => {
            assert.equal(path, "uploads/product-image");
            return { secure_url: "https://images.example/product.jpg" };
        }
    );
    t.mock.method(productUploadModel.prototype, "save", async function saveProduct() {
        return this;
    });

    const res = createResponse();
    await productController.uploadProductController(
        {
            body: {
                title: "Mavo Product",
                sku: "MAVO-1",
                category: "Office",
                section: "best-deals",
                price: "100",
                stock: "5",
                slug: "  Mavo / Product  ",
                seoTitle: "  Mavo Product \n Desk ",
                seoDescription: "  A useful product.  ",
                seoKeywords: JSON.stringify([" Desk ", "Office", "office", ""]),
            },
            file: { path: "uploads/product-image" },
        },
        res
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.slug, "mavo-product");
    assert.equal(res.body.data.seoTitle, "Mavo Product Desk");
    assert.equal(res.body.data.seoDescription, "A useful product.");
    assert.deepEqual(res.body.data.seoKeywords, ["Desk", "Office"]);
    assert.equal(res.body.data.mainImage, "https://images.example/product.jpg");
    assert.equal(cloudinaryUpload.mock.callCount(), 1);
});

test("product upload generates a slug when the request omits it", async (t) => {
    t.mock.method(productUploadModel.prototype, "save", async function saveProduct() {
        return this;
    });

    const res = createResponse();
    await productController.uploadProductController(
        {
            body: {
                title: "Mavo Desk Lamp",
                sku: "MAVO-AUTO-SLUG",
                category: "Lighting",
                section: "best-deals",
                price: "100",
                stock: "5",
            },
        },
        res
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.slug, "mavo-desk-lamp");
});

test("product update sanitizes SEO fields and preserves image uploads", async (t) => {
    const product = new productUploadModel({
        title: "Old Product",
        sku: "MAVO-2",
        category: "Office",
        section: "best-deals",
        price: 100,
        stock: 5,
        mainImage: "https://images.example/old.jpg",
        slug: "old-product",
    });
    t.mock.method(productUploadModel, "findById", async () => product);
    t.mock.method(productUploadModel.prototype, "save", async function saveProduct() {
        return this;
    });
    const cloudinaryUpload = t.mock.method(
        cloudinary.uploader,
        "upload",
        async () => ({ secure_url: "https://images.example/new.jpg" })
    );

    const res = createResponse();
    await productController.updateProductController(
        {
            params: { id: String(product._id) },
            body: {
                slug: " New / Product ",
                seoTitle: " New title ",
                seoDescription: "Updated description",
                seoKeywords: JSON.stringify(["New", "Keyword"]),
            },
            file: { path: "uploads/new-product-image" },
        },
        res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.slug, "new-product");
    assert.equal(res.body.data.seoTitle, "New title");
    assert.equal(res.body.data.seoDescription, "Updated description");
    assert.deepEqual(res.body.data.seoKeywords, ["New", "Keyword"]);
    assert.equal(res.body.data.mainImage, "https://images.example/new.jpg");
    assert.equal(cloudinaryUpload.mock.callCount(), 1);
});

test("product update restores a missing slug from the product title", async (t) => {
    const product = new productUploadModel({
        title: "Legacy Desk Lamp",
        sku: "MAVO-LEGACY-SLUG",
        category: "Lighting",
        section: "best-deals",
        price: 100,
        stock: 5,
        mainImage: "https://images.example/legacy.jpg",
    });
    t.mock.method(productUploadModel, "findById", async () => product);
    t.mock.method(productUploadModel.prototype, "save", async function saveProduct() {
        return this;
    });

    const res = createResponse();
    await productController.updateProductController(
        {
            params: { id: String(product._id) },
            body: { slug: " " },
        },
        res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.slug, "legacy-desk-lamp");
});

test("product schema declares a unique partial index for nonempty slugs", () => {
    const slugIndex = productUploadModel.schema
        .indexes()
        .find(([keys, options]) => keys.slug === 1 && options.name === "unique_product_slug");

    assert.ok(slugIndex);
    assert.equal(slugIndex[1].unique, true);
    assert.deepEqual(slugIndex[1].partialFilterExpression, {
        slug: { $type: "string", $gt: "" },
    });
});

test("product deletion removes the selected product", async (t) => {
    const deleteOne = t.mock.fn(async () => {});
    t.mock.method(productUploadModel, "findById", async () => ({ deleteOne }));

    const res = createResponse();
    await productController.deleteProductController(
        { params: { id: "507f1f77bcf86cd799439011" } },
        res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(deleteOne.mock.callCount(), 1);
});

test("product GET endpoints return SEO fields", async (t) => {
    const product = new productUploadModel({
        title: "Mavo Product",
        sku: "MAVO-3",
        category: "Office",
        section: "best-deals",
        price: 100,
        stock: 5,
        mainImage: "https://images.example/product.jpg",
        slug: "mavo-product",
        seoTitle: "Mavo SEO title",
        seoDescription: "Mavo SEO description",
        seoKeywords: ["desk", "office"],
    });
    t.mock.method(productUploadModel, "find", async () => [product]);
    t.mock.method(productUploadModel, "findById", async () => product);
    t.mock.method(orderModel, "aggregate", async () => []);
    t.mock.method(productReviewModel, "aggregate", async () => []);

    const allProductsResponse = createResponse();
    await productController.getAllProductsController({}, allProductsResponse);
    assert.deepEqual(allProductsResponse.body.data[0].seoKeywords, ["desk", "office"]);
    assert.equal(allProductsResponse.body.data[0].slug, "mavo-product");

    const productResponse = createResponse();
    await productController.getProductByIdController(
        { params: { id: String(product._id) } },
        productResponse
    );
    assert.equal(productResponse.body.data.seoTitle, "Mavo SEO title");
    assert.equal(productResponse.body.data.seoDescription, "Mavo SEO description");
    assert.deepEqual(productResponse.body.data.seoKeywords, ["desk", "office"]);
});

test("product GET endpoint resolves canonical product slugs", async (t) => {
    const product = new productUploadModel({
        title: "Mavo Product",
        sku: "MAVO-SLUG",
        category: "Office",
        section: "best-deals",
        price: 100,
        stock: 5,
        mainImage: "https://images.example/product.jpg",
        slug: "mavo-product",
        seoTitle: "Mavo SEO title",
        seoDescription: "Mavo SEO description",
        seoKeywords: ["desk", "office"],
    });
    t.mock.method(productUploadModel, "findOne", async (query) => {
        assert.deepEqual(query, { slug: "mavo-product" });
        return product;
    });
    t.mock.method(orderModel, "aggregate", async () => []);
    t.mock.method(productReviewModel, "aggregate", async () => []);

    const res = createResponse();
    await productController.getProductByIdController(
        { params: { id: "mavo-product" } },
        res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.slug, "mavo-product");
    assert.equal(res.body.data.seoTitle, "Mavo SEO title");
});

test("product upload returns conflict for duplicate slugs", async (t) => {
    t.mock.method(productUploadModel.prototype, "save", async () => {
        const error = new Error("Duplicate slug");
        error.code = 11000;
        error.keyPattern = { slug: 1 };
        throw error;
    });

    const res = createResponse();
    await productController.uploadProductController(
        {
            body: {
                title: "Mavo Product",
                sku: "MAVO-4",
                category: "Office",
                section: "best-deals",
                price: "100",
                stock: "5",
                slug: "mavo-product",
            },
        },
        res
    );

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: "A product with this URL slug already exists.",
    });
});
