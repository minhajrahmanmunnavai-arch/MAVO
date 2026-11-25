const express = require("express");
const { androidAppUpdateController } = require("../controller/androidAppUpdateController");

const appUpdateRouter = express.Router();

appUpdateRouter.get("/android", androidAppUpdateController);

module.exports = appUpdateRouter;
