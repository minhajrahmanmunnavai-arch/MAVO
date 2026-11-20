require ("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const validateEnvironment = require("./src/config/validateEnvironment");
const connectToDB = require("./src/config/database");
const authSessionModel = require("./src/models/authSession.model");
const rateLimitCounterModel = require("./src/models/rateLimitCounter.model");
const { attachSocketServer } = require("./src/realtime/socketServer");

async function startServer() {
    validateEnvironment();
    await connectToDB();
    await Promise.all([
        authSessionModel.init(),
        rateLimitCounterModel.init(),
    ]);

    const app = require("./src/app");
    const port = Number(process.env.PORT) || 3000;
    const server = http.createServer(app);
    const io = attachSocketServer(server);
    server.listen(port, () => {
        console.log(`Server is running on port ${port}.`);
    });

    const shutdown = (signal) => {
        io.close(async () => {
            try {
                await mongoose.disconnect();
            } catch (error) {
                console.error(`Server shutdown after ${signal} failed:`, error);
                process.exitCode = 1;
            }
        });
    };

    server.on("error", async (error) => {
        console.error("HTTP server failed:", error);
        process.exitCode = 1;
        await mongoose.disconnect();
    });

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
    console.error("Server startup failed:", error);
    process.exitCode = 1;
});