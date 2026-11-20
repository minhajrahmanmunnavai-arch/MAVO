const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const authController = require("../src/controller/authController");
const authMiddleware = require("../src/middlewares/auth.middleware");
const authSessionModel = require("../src/models/authSession.model");
const userModel = require("../src/models/user.model");
const customerModel = require("../src/models/customer.model");
const csrfProtection = require("../src/middlewares/csrf.middleware");
const hashToken = require("../src/utils/hashToken");
const validateEnvironment = require("../src/config/validateEnvironment");

function runCsrfMiddleware({ method = "POST", origin, fetchSite } = {}) {
    let statusCode;
    let responseBody;
    let passed = false;
    const req = {
        method,
        get(name) {
            if (name === "origin") return origin;
            if (name === "sec-fetch-site") return fetchSite;
            return undefined;
        },
    };
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        },
    };

    csrfProtection(req, res, () => {
        passed = true;
    });

    return { statusCode, responseBody, passed };
}

test("CSRF protection rejects untrusted and cross-site mutations", () => {
    assert.equal(runCsrfMiddleware({ origin: "https://attacker.example" }).statusCode, 403);
    assert.equal(runCsrfMiddleware({ fetchSite: "cross-site" }).statusCode, 403);
    assert.equal(runCsrfMiddleware({ origin: "null" }).statusCode, 403);
});

test("CSRF protection allows same-origin mutations and safe methods", () => {
    assert.equal(runCsrfMiddleware({ origin: "http://localhost:5173" }).passed, true);
    assert.equal(runCsrfMiddleware({ method: "GET", fetchSite: "cross-site" }).passed, true);
});

test("token hashes are deterministic and do not expose the token", () => {
    const token = "test-refresh-token";
    const hash = hashToken(token);

    assert.equal(hash, hashToken(token));
    assert.notEqual(hash, token);
    assert.match(hash, /^[a-f0-9]{64}$/);
});

test("registration accepts an 8-character password", async (t) => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-secret-key-with-at-least-32-bytes";
    t.after(() => {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });

    t.mock.method(userModel, "findOne", async () => null);
    t.mock.method(userModel, "create", async () => ({
        _id: "507f1f77bcf86cd799439011",
        username: "Test User",
        email: "test@example.com",
        role: "user",
        createdAt: new Date(),
    }));
    t.mock.method(customerModel, "create", async () => ({}));
    t.mock.method(authSessionModel, "create", async () => ({
        _id: "507f1f77bcf86cd799439012",
    }));

    const cookies = [];
    let statusCode;
    let responseBody;
    const res = {
        cookie(name, value, options) {
            cookies.push({ name, value, options });
            return this;
        },
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        },
    };

    await authController.registerNewUserController(
        {
            body: {
                username: "Test User",
                email: "test@example.com",
                password: "Abc123!x",
            },
        },
        res
    );

    assert.equal(statusCode, 201);
    assert.equal(responseBody.user.email, "test@example.com");
    assert.equal(cookies.length, 2);
    const refreshCookie = cookies.find(({ name }) => name === "refreshToken");
    assert.ok(refreshCookie.options.maxAge >= 10 * 365 * 24 * 60 * 60 * 1000);
});

test("login accepts an 8-character password and checks credentials", async (t) => {
    t.mock.method(userModel, "findOne", async () => null);
    let statusCode;
    let responseBody;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        },
    };

    await authController.loginUserController(
        { body: { email: "test@example.com", password: "Abc123!x" } },
        res
    );

    assert.equal(statusCode, 400);
    assert.equal(responseBody.message, "Invalid credentials");
});

test("refreshing a session renews the persistent refresh-token lifetime", async (t) => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-secret-key-with-at-least-32-bytes";
    t.after(() => {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });

    const session = {
        _id: "507f1f77bcf86cd799439012",
        user: "507f1f77bcf86cd799439011",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    const user = {
        _id: session.user,
        username: "Test User",
        email: "test@example.com",
        role: "user",
    };
    let update;
    const cookies = [];
    let statusCode;
    t.mock.method(authSessionModel, "findOne", async () => session);
    t.mock.method(userModel, "findById", async () => user);
    t.mock.method(authSessionModel, "findOneAndUpdate", async (filter, changes) => {
        update = changes;
        return session;
    });

    const res = {
        cookie(name, value, options) {
            cookies.push({ name, value, options });
            return this;
        },
        status(code) {
            statusCode = code;
            return this;
        },
        json() {
            return this;
        },
    };

    await authController.refreshTokenController(
        { cookies: { refreshToken: "current-refresh-token" } },
        res
    );

    const refreshCookie = cookies.find(({ name }) => name === "refreshToken");
    const expectedLifetimeMs = 10 * 365 * 24 * 60 * 60 * 1000;

    assert.equal(statusCode, 200);
    assert.ok(update.$set.expiresAt.getTime() >= Date.now() + expectedLifetimeMs - 1000);
    assert.ok(refreshCookie.options.maxAge >= expectedLifetimeMs - 1000);
});

test("socket tickets are short-lived and scoped to the authenticated session", (t) => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-secret-key-with-at-least-32-bytes";
    t.after(() => {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });

    let statusCode;
    let body;
    let cacheControl;
    const res = {
        set(name, value) {
            if (name === "Cache-Control") cacheControl = value;
            return this;
        },
        status(code) {
            statusCode = code;
            return this;
        },
        json(value) {
            body = value;
            return this;
        },
    };

    authController.createSocketTokenController(
        { user: { id: "507f1f77bcf86cd799439011", sid: "507f1f77bcf86cd799439012" } },
        res
    );

    const decoded = jwt.verify(body.token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: "mavo-api",
        audience: "mavo-socket",
    });
    assert.equal(statusCode, 200);
    assert.equal(cacheControl, "no-store");
    assert.equal(decoded.purpose, "realtime");
    assert.equal(decoded.id, "507f1f77bcf86cd799439011");
    assert.equal(decoded.sid, "507f1f77bcf86cd799439012");
    assert.ok(decoded.exp - decoded.iat <= 5 * 60);
});

test("refresh-token replay revokes the associated session", async (t) => {
    let lookup = 0;
    let revoked = false;
    t.mock.method(authSessionModel, "findOne", async () => {
        lookup += 1;
        return lookup === 1 ? null : { _id: "replayed-session" };
    });
    t.mock.method(authSessionModel, "deleteOne", async () => {
        revoked = true;
    });

    let statusCode;
    let responseBody;
    const clearedCookies = [];
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        },
        clearCookie(name) {
            clearedCookies.push(name);
            return this;
        },
    };

    await authController.refreshTokenController(
        { cookies: { refreshToken: "replayed-refresh-token" } },
        res
    );

    assert.equal(statusCode, 401);
    assert.match(responseBody.message, /reuse detected/i);
    assert.equal(revoked, true);
    assert.deepEqual(clearedCookies, ["token", "refreshToken"]);
});

test("revoked sessions invalidate otherwise valid access tokens", async (t) => {
    const secret = "test-secret-key-with-at-least-32-bytes";
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;
    t.after(() => {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });

    t.mock.method(authSessionModel, "findOne", () => ({
        populate() {
            return {
                lean: async () => null,
            };
        },
    }));
    const token = jwt.sign(
        { id: "507f1f77bcf86cd799439011", sid: "507f1f77bcf86cd799439012" },
        secret,
        { expiresIn: "1m", algorithm: "HS256", issuer: "mavo-api", audience: "mavo-web" }
    );
    let statusCode;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json() {
            return this;
        },
    };

    await authMiddleware.authUser({ cookies: { token } }, res, () => {
        assert.fail("Revoked session must not reach the protected handler.");
    });

    assert.equal(statusCode, 401);
});

test("production environment requires HTTPS and secure configuration", (t) => {
    const names = [
        "NODE_ENV",
        "MONGO_URI",
        "JWT_SECRET",
        "CORS_ORIGINS",
        "FRONTEND_URL",
        "HTTPS_ENABLED",
        "COOKIE_SAME_SITE",
        "TRUST_PROXY_HOPS",
    ];
    const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
    t.after(() => {
        for (const name of names) {
            if (original[name] === undefined) delete process.env[name];
            else process.env[name] = original[name];
        }
    });

    Object.assign(process.env, {
        NODE_ENV: "production",
        MONGO_URI: "mongodb://localhost/test",
        JWT_SECRET: "a".repeat(64),
        CORS_ORIGINS: "https://shop.example",
        HTTPS_ENABLED: "true",
        COOKIE_SAME_SITE: "strict",
    });
    delete process.env.FRONTEND_URL;
    delete process.env.TRUST_PROXY_HOPS;
    assert.doesNotThrow(validateEnvironment);

    process.env.HTTPS_ENABLED = "false";
    assert.throws(validateEnvironment, /HTTPS_ENABLED/);

    process.env.HTTPS_ENABLED = "true";
    process.env.CORS_ORIGINS = "http://shop.example";
    assert.throws(validateEnvironment, /must use HTTPS/);

    process.env.CORS_ORIGINS = "https://shop.example";
    process.env.JWT_SECRET = "too-short";
    assert.throws(validateEnvironment, /at least 32 bytes/);
});
