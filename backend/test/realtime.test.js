const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");
const { io: createClient } = require("socket.io-client");
const authSessionModel = require("../src/models/authSession.model");
const authController = require("../src/controller/authController");
const { attachSocketServer } = require("../src/realtime/socketServer");
const { publishUpdate, setSocketServer } = require("../src/utils/liveUpdates");

const JWT_SECRET = "realtime-test-secret-with-at-least-32-bytes";

function createToken(id, sid, purpose = "realtime") {
    return jwt.sign(
        { id, sid, purpose },
        JWT_SECRET,
        {
            expiresIn: "2m",
            algorithm: "HS256",
            issuer: "mavo-api",
            audience: "mavo-socket",
        }
    );
}

function connectClient(url, token) {
    const socket = createClient(url, {
        auth: token ? { token } : {},
        reconnection: false,
        timeout: 2000,
        transports: ["websocket"],
    });

    return new Promise((resolve, reject) => {
        socket.once("connect", () => resolve(socket));
        socket.once("connect_error", (error) => {
            socket.close();
            reject(error);
        });
    });
}

test("socket updates are authenticated and routed to only the user and admin rooms", async (t) => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = JWT_SECRET;
    const sessions = new Map([
        ["session-user-a", {
            _id: "session-user-a",
            user: { _id: "user-a", role: "user" },
        }],
        ["session-user-b", {
            _id: "session-user-b",
            user: { _id: "user-b", role: "user" },
        }],
        ["session-admin", {
            _id: "session-admin",
            user: { _id: "admin", role: "admin" },
        }],
    ]);

    t.mock.method(authSessionModel, "findOne", (filter) => ({
        populate() {
            return this;
        },
        select() {
            return this;
        },
        lean() {
            const sessionId = filter._id || (filter.$or && "session-user-a");
            const session = sessions.get(String(sessionId));
            if (
                !session ||
                (filter.user && String(filter.user) !== String(session.user._id)) ||
                (filter.expiresAt && !(filter.expiresAt.$gt instanceof Date))
            ) {
                return Promise.resolve(null);
            }
            return Promise.resolve(session);
        },
    }));

    const httpServer = http.createServer();
    const socketServer = attachSocketServer(httpServer);
    const clients = [];

    t.after(async () => {
        clients.forEach((client) => client.close());
        await new Promise((resolve) => socketServer.close(resolve));
        setSocketServer(null);
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });

    await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const { port } = httpServer.address();
    const url = `http://127.0.0.1:${port}`;

    const userA = await connectClient(
        url,
        createToken("user-a", "session-user-a")
    );
    const userB = await connectClient(
        url,
        createToken("user-b", "session-user-b")
    );
    const admin = await connectClient(
        url,
        createToken("admin", "session-admin")
    );
    clients.push(userA, userB, admin);

    let userBUpdates = 0;
    userB.on("live:update", () => {
        userBUpdates += 1;
    });

    const message = {
        id: "message-a",
        senderId: "user-a",
        senderRole: "user",
        senderName: "Customer A",
        body: "Order update?",
        isDeleted: false,
        editedAt: null,
        createdAt: new Date().toISOString(),
    };
    const userUpdate = new Promise((resolve) => userA.once("live:update", resolve));
    const adminUpdate = new Promise((resolve) => admin.once("live:update", resolve));
    publishUpdate({
        type: "chat:changed",
        userId: "user-a",
        resourceId: "order-a",
        message,
    });

    const expectedUpdate = {
        type: "chat:changed",
        resourceId: "order-a",
        message,
    };
    assert.deepEqual(await userUpdate, expectedUpdate);
    assert.deepEqual(await adminUpdate, expectedUpdate);
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(userBUpdates, 0);

    await assert.rejects(
        connectClient(url, createToken("user-a", "session-user-a", "wrong-purpose")),
        /Authentication required/
    );
    await assert.rejects(
          connectClient(url, createToken("user-b", "session-user-a")),
          /Authentication required/
    );

    t.mock.method(authSessionModel, "deleteOne", async () => ({ deletedCount: 1 }));
    let logoutStatus;
    const logoutResponse = {
          clearCookie() {
              return this;
          },
          status(code) {
              logoutStatus = code;
              return this;
          },
          json() {
              return this;
          },
    };
    const userADisconnected = new Promise((resolve) => userA.once("disconnect", resolve));
    await authController.logoutUserController(
          { cookies: { refreshToken: "user-a-refresh-token" } },
          logoutResponse
    );
    await userADisconnected;
    assert.equal(logoutStatus, 200);
    assert.equal(userB.connected, true);
    assert.equal(admin.connected, true);
});
