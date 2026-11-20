const express = require("express");
const sitemapController = require("../controller/sitemapController");

const sitemapRouter = express.Router();

sitemapRouter.get("/sitemap.xml", sitemapController.sitemapIndexController);
sitemapRouter.get(
    "/sitemap-pages.xml",
    sitemapController.publicPagesSitemapController
);
sitemapRouter.get(
    "/sitemap-products.xml",
    sitemapController.productsSitemapController
);

module.exports = sitemapRouter;
