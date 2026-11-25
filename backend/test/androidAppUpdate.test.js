const test = require("node:test");
const assert = require("node:assert/strict");
const {
    androidAppUpdateController,
    getAndroidUpdateConfig,
} = require("../src/controller/androidAppUpdateController");

const APK_URL = "https://updates.example.com/mavo.apk";
const APK_SHA256 = "a".repeat(64);

function createResponse() {
    return {
        statusCode: 200,
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

function withUpdateConfig(t, values) {
    const keys = [
        "ANDROID_LATEST_VERSION",
        "ANDROID_LATEST_VERSION_CODE",
        "ANDROID_APK_DOWNLOAD_URL",
        "ANDROID_APK_SHA256",
        "ANDROID_UPDATE_MANDATORY",
        "ANDROID_RELEASE_NOTES",
    ];
    const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

    for (const key of keys) delete process.env[key];
    Object.assign(process.env, values);

    t.after(() => {
        for (const key of keys) {
            if (previous[key] === undefined) delete process.env[key];
            else process.env[key] = previous[key];
        }
    });
}

function requestWithVersionCode(versionCode) {
    return { query: { currentVersionCode: String(versionCode) } };
}

test("reports no actionable update when an APK URL or checksum is missing", (t) => {
    withUpdateConfig(t, {
        ANDROID_LATEST_VERSION: "1.0.1",
        ANDROID_LATEST_VERSION_CODE: "2",
        ANDROID_APK_DOWNLOAD_URL: APK_URL,
    });

    const res = createResponse();
    androidAppUpdateController(requestWithVersionCode(1), res);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.updateAvailable, false);
    assert.equal(res.body.data.downloadUrl, null);
    assert.equal(res.body.data.apkSha256, null);
});

test("returns a configured update only for an older installed versionCode", (t) => {
    withUpdateConfig(t, {
        ANDROID_LATEST_VERSION: "1.0.1",
        ANDROID_LATEST_VERSION_CODE: "2",
        ANDROID_APK_DOWNLOAD_URL: APK_URL,
        ANDROID_APK_SHA256: APK_SHA256,
        ANDROID_UPDATE_MANDATORY: "true",
        ANDROID_RELEASE_NOTES: "Bug fixes",
    });

    const olderResponse = createResponse();
    androidAppUpdateController(requestWithVersionCode(1), olderResponse);
    assert.equal(olderResponse.body.data.updateAvailable, true);
    assert.equal(olderResponse.body.data.mandatory, true);
    assert.equal(olderResponse.body.data.apkSha256, APK_SHA256);

    for (const installedVersionCode of [2, 3]) {
        const currentOrNewerResponse = createResponse();
        androidAppUpdateController(requestWithVersionCode(installedVersionCode), currentOrNewerResponse);
        assert.equal(currentOrNewerResponse.body.data.updateAvailable, false);
        assert.equal(currentOrNewerResponse.body.data.mandatory, false);
    }
});

test("rejects invalid client version codes and unsafe release configuration", (t) => {
    const invalidRequestResponse = createResponse();
    androidAppUpdateController({ query: { currentVersionCode: "1.2" } }, invalidRequestResponse);
    assert.equal(invalidRequestResponse.statusCode, 400);

    assert.throws(() => getAndroidUpdateConfig({
        ANDROID_APK_DOWNLOAD_URL: "http://example.com/mavo.apk",
    }));
    assert.throws(() => getAndroidUpdateConfig({
        ANDROID_APK_SHA256: "not-a-checksum",
    }));
});
