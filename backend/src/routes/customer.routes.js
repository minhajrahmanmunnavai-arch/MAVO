const express = require("express");
const customerRouter = express.Router();
const customerController = require("../controller/customerController");
const authMiddleware = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");

customerRouter.get("/", authMiddleware.authUser, admin, customerController.getCustomers);

module.exports = customerRouter;
