const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { streamUpdates } = require("../utils/liveUpdates");

const liveUpdatesRouter = express.Router();

liveUpdatesRouter.get("/", authMiddleware.optionalAuthUser, streamUpdates);

module.exports = liveUpdatesRouter;
