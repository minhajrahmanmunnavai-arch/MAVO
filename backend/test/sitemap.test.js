const test = require("node:test");
const assert = require("node:assert/strict");
const productUploadModel = require("../src/models/productUpload.model");
const sitemapController = require("../src/controller/sitemapController");

function createResponse() {
    return {
        statusCode: null,
        headers: {},
        body: "",
        headersSent: false,
        destroyed: false,
        writableEnded: false,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        set(name, value) {
            this.headers[name.toLowerCase()] = value;
            return this;
        },
        send(body) {
            this.body += body;
            this.headersSent = true;
            this.writableEnded = true;
            return this;
        },
        write(chunk) {
            this.body += chunk;
            this.headersSent = true;
            return true;
        },
        end(chunk = "") {
            this.body += chunk;
            this.writableEnded = true;
            return this;
        },
    };
}

function useProductionSiteUrl(t, url = "https://temox.example") {
    const previousFrontendUrl = process.env.FRONTEND_URL;
    const previousCorsOrigins = process.env.CORS_ORIGINS;
    const previousNodeEnv = process.env.NODE_ENV;

    process.env.FRONTEND_URL = url;
    process.env.NODE_ENV = "production";

    t.after(() => {
        if (previousFrontendUrl === undefined) delete process.env.FRONTEND_URL;
        else process.env.FRONTEND_URL = previousFrontendUrl;
        if (previousCorsOrigins === undefined) delete process.env.CORS_ORIGINS;
        else process.env.CORS_ORIGINS = previousCorsOrigins;
        if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousNodeEnv;
    });
}

test("sitemap index lists public pages and paginated product sitemaps", async (t) => {
    useProductionSiteUrl(t);
    t.mock.method(productUploadModel, "countDocuments", async (filter) => {
        assert.deepEqual(filter, { slug: { $type: "string", $gt: "" } });
        return 10001;
    });

    const res = createResponse();
    await sitemapController.sitemapIndexController({}, res);

    assert.equal(res.statusCode, 200);
    assert.match(res.headers["content-type"], /application\/xml/);
    assert.match(res.body, /<sitemapindex/);
    assert.match(res.body, /https:\/\/temox\.example\/sitemap-pages\.xml/);
    assert.match(res.body, /sitemap-products\.xml\?page=1/);
    assert.match(res.body, /sitemap-products\.xml\?page=2/);
    assert.doesNotMatch(res.body, /localhost/);
});

test("static sitemap includes public routes and excludes private routes", async (t) => {
    useProductionSiteUrl(t);

    const res = createResponse();
    await sitemapController.publicPagesSitemapController({}, res);

    assert.equal(res.statusCode, 200);
    assert.match(res.body, /https:\/\/temox\.example\/<\/loc>/);
    assert.match(res.body, /https:\/\/temox\.example\/category<\/loc>/);
    assert.match(res.body, /https:\/\/temox\.example\/shop-catalog<\/loc>/);
    assert.match(res.body, /https:\/\/temox\.example\/privacy<\/loc>/);
    assert.match(res.body, /https:\/\/temox\.example\/terms<\/loc>/);
    assert.doesNotMatch(res.body, /\/admin|\/login|\/register|\/cart|\/my-orders|\/wishlist/);
});

test("product sitemap streams slug URLs and reliable lastmod values", async (t) => {
    useProductionSiteUrl(t);
    const products = [
        {
            slug: "mavo-desk-lamp",
            updatedAt: new Date("2026-10-15T12:30:00.000Z"),
        },
        { slug: "cable & adapter", updatedAt: null },
    ];
    let query;
    const cursor = {
        async next() {
            return products.shift() || null;
        },
        async close() {},
    };
    query = {
        select(fields) {
            assert.equal(fields, "slug updatedAt");
            return this;
        },
        sort(fields) {
            assert.deepEqual(fields, { _id: 1 });
            return this;
        },
        skip(count) {
            assert.equal(count, 0);
            return this;
        },
        limit(count) {
            assert.equal(count, 10000);
            return this;
        },
        lean() {
            return this;
        },
        cursor() {
            return cursor;
        },
    };
    t.mock.method(productUploadModel, "find", (filter) => {
        assert.deepEqual(filter, { slug: { $type: "string", $gt: "" } });
        return query;
    });

    const res = createResponse();
    await sitemapController.productsSitemapController({ query: { page: "1" } }, res);

    assert.equal(res.statusCode, 200);
    assert.match(res.body, /<urlset/);
    assert.match(res.body, /https:\/\/temox\.example\/product\/mavo-desk-lamp/);
    assert.match(res.body, /<lastmod>2026-10-15T12:30:00\.000Z<\/lastmod>/);
    assert.match(res.body, /cable%20%26%20adapter/);
    assert.doesNotMatch(res.body, /localhost/);
    assert.match(res.body, /<\/urlset>$/);
});

test("production sitemap refuses a localhost website URL", async (t) => {
    useProductionSiteUrl(t, "http://localhost:5173");
    t.mock.method(console, "error", () => {});

    const res = createResponse();
    await sitemapController.publicPagesSitemapController({}, res);

    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(res.body, /localhost/);
});
