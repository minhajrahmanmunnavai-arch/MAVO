const productUploadModel = require("../models/productUpload.model");

const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
const PRODUCT_SITEMAP_PAGE_SIZE = 10000;
const PUBLIC_PRODUCT_FILTER = {
    slug: { $type: "string", $gt: "" },
};
const PUBLIC_PAGE_PATHS = [
    "/",
    "/category",
    "/shop-catalog",
    "/privacy",
    "/terms",
];

function getSiteOrigin() {
    const production = process.env.NODE_ENV === "production";
    const configuredSiteUrl =
        (process.env.FRONTEND_URL || "").trim() ||
        (process.env.CORS_ORIGINS || "").split(",")[0].trim() ||
        (production ? "" : "http://localhost:5173");

    if (!configuredSiteUrl) {
        throw new Error("Set FRONTEND_URL to the public website URL.");
    }

    const siteUrl = new URL(configuredSiteUrl);
    const hostname = siteUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    const isLocalhost =
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname === "::1" ||
        /^127(?:\.\d{1,3}){3}$/.test(hostname);

    if (!["http:", "https:"].includes(siteUrl.protocol)) {
        throw new Error("FRONTEND_URL must use HTTP or HTTPS.");
    }
    if (production && (siteUrl.protocol !== "https:" || isLocalhost)) {
        throw new Error("Production sitemap requires a public HTTPS website URL.");
    }

    return siteUrl.origin;
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function createUrlEntry(url, lastModified) {
    return [
        "<url>",
        `<loc>${escapeXml(url)}</loc>`,
        lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : "",
        "</url>",
    ].join("");
}

function sendXml(res, body) {
    return res
        .status(200)
        .set("Content-Type", "application/xml; charset=utf-8")
        .set("Cache-Control", "public, max-age=300")
        .send(body);
}

function handleSitemapError(error, res) {
    console.error("Sitemap generation failed:", error);

    if (res.headersSent) {
        if (!res.destroyed) res.destroy(error);
        return;
    }

    return res
        .status(500)
        .set("Content-Type", "text/plain; charset=utf-8")
        .send("Unable to generate sitemap.");
}

function waitForDrain(res) {
    return new Promise((resolve, reject) => {
        const cleanup = () => {
            res.removeListener("drain", onDrain);
            res.removeListener("close", onClose);
            res.removeListener("error", onError);
        };
        const onDrain = () => {
            cleanup();
            resolve();
        };
        const onClose = () => {
            cleanup();
            reject(new Error("Sitemap response closed before completion."));
        };
        const onError = (error) => {
            cleanup();
            reject(error);
        };

        res.once("drain", onDrain);
        res.once("close", onClose);
        res.once("error", onError);
    });
}

async function writeChunk(res, chunk) {
    if (res.destroyed || res.writableEnded) {
        throw new Error("Sitemap response is no longer writable.");
    }
    if (!res.write(chunk)) {
        await waitForDrain(res);
    }
}

async function sitemapIndexController(req, res) {
    try {
        const siteOrigin = getSiteOrigin();
        const productCount = await productUploadModel.countDocuments(
            PUBLIC_PRODUCT_FILTER
        );
        const productSitemapCount = Math.ceil(
            productCount / PRODUCT_SITEMAP_PAGE_SIZE
        );
        const sitemapUrls = [
            new URL("/sitemap-pages.xml", siteOrigin).href,
            ...Array.from(
                { length: productSitemapCount },
                (_, index) =>
                    new URL(
                        `/sitemap-products.xml?page=${index + 1}`,
                        siteOrigin
                    ).href
            ),
        ];
        const sitemapEntries = sitemapUrls
            .map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
            .join("");

        return sendXml(
            res,
            `<?xml version="1.0" encoding="UTF-8"?>` +
                `<sitemapindex xmlns="${SITEMAP_NAMESPACE}">${sitemapEntries}</sitemapindex>`
        );
    } catch (error) {
        return handleSitemapError(error, res);
    }
}

async function publicPagesSitemapController(req, res) {
    try {
        const siteOrigin = getSiteOrigin();
        const entries = PUBLIC_PAGE_PATHS.map((pagePath) =>
            createUrlEntry(new URL(pagePath, siteOrigin).href)
        ).join("");

        return sendXml(
            res,
            `<?xml version="1.0" encoding="UTF-8"?>` +
                `<urlset xmlns="${SITEMAP_NAMESPACE}">${entries}</urlset>`
        );
    } catch (error) {
        return handleSitemapError(error, res);
    }
}

async function productsSitemapController(req, res) {
    let cursor;

    try {
        const siteOrigin = getSiteOrigin();
        const page = Number(req.query.page || 1);
        const offset = (page - 1) * PRODUCT_SITEMAP_PAGE_SIZE;
        if (
            !Number.isSafeInteger(page) ||
            page < 1 ||
            !Number.isSafeInteger(offset)
        ) {
            return res
                .status(400)
                .set("Content-Type", "text/plain; charset=utf-8")
                .send("Sitemap page must be a positive integer.");
        }

        cursor = productUploadModel
            .find(PUBLIC_PRODUCT_FILTER)
            .select("slug updatedAt")
            .sort({ _id: 1 })
            .skip(offset)
            .limit(PRODUCT_SITEMAP_PAGE_SIZE)
            .lean()
            .cursor();

        let product = await cursor.next();
        res.status(200)
            .set("Content-Type", "application/xml; charset=utf-8")
            .set("Cache-Control", "public, max-age=300");
        await writeChunk(
            res,
            `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="${SITEMAP_NAMESPACE}">`
        );

        while (product) {
            const productUrl = new URL(
                `/product/${encodeURIComponent(product.slug)}`,
                siteOrigin
            ).href;
            const updatedAt = product.updatedAt
                ? new Date(product.updatedAt)
                : null;
            const lastModified =
                updatedAt && Number.isFinite(updatedAt.getTime())
                    ? updatedAt.toISOString()
                    : null;

            await writeChunk(res, createUrlEntry(productUrl, lastModified));
            product = await cursor.next();
        }

        await writeChunk(res, "</urlset>");
        res.end();
    } catch (error) {
        return handleSitemapError(error, res);
    } finally {
        if (cursor) {
            try {
                await cursor.close();
            } catch (error) {
                console.error("Unable to close product sitemap cursor:", error);
            }
        }
    }
}

module.exports = {
    sitemapIndexController,
    publicPagesSitemapController,
    productsSitemapController,
};
