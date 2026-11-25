const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;

function getAndroidUpdateConfig(env = process.env) {
    const latestVersion = (env.ANDROID_LATEST_VERSION || "1.0").trim();
    const rawVersionCode = env.ANDROID_LATEST_VERSION_CODE || "1";
    const latestVersionCode = Number(rawVersionCode);
    const rawDownloadUrl = (env.ANDROID_APK_DOWNLOAD_URL || "").trim();
    const rawSha256 = (env.ANDROID_APK_SHA256 || "").trim();
    const rawMandatory = (env.ANDROID_UPDATE_MANDATORY || "false").trim().toLowerCase();
    const releaseNotes = (env.ANDROID_RELEASE_NOTES || "").trim();

    if (!latestVersion || latestVersion.length > 64) {
        throw new Error("ANDROID_LATEST_VERSION must be a non-empty version name.");
    }

    if (!/^\d+$/.test(rawVersionCode) || !Number.isSafeInteger(latestVersionCode) || latestVersionCode < 1) {
        throw new Error("ANDROID_LATEST_VERSION_CODE must be a positive integer.");
    }

    if (!["true", "false"].includes(rawMandatory)) {
        throw new Error("ANDROID_UPDATE_MANDATORY must be true or false.");
    }

    let downloadUrl = null;
    if (rawDownloadUrl) {
        let parsedUrl;
        try {
            parsedUrl = new URL(rawDownloadUrl);
        } catch {
            throw new Error("ANDROID_APK_DOWNLOAD_URL must be an absolute HTTPS URL.");
        }

        if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
            throw new Error("ANDROID_APK_DOWNLOAD_URL must be an absolute HTTPS URL without embedded credentials.");
        }
        downloadUrl = parsedUrl.toString();
    }

    let apkSha256 = null;
    if (rawSha256) {
        if (!SHA256_PATTERN.test(rawSha256)) {
            throw new Error("ANDROID_APK_SHA256 must contain exactly 64 hexadecimal characters.");
        }
        apkSha256 = rawSha256.toLowerCase();
    }

    return {
        latestVersion,
        latestVersionCode,
        downloadUrl,
        apkSha256,
        releaseConfigured: Boolean(downloadUrl && apkSha256),
        mandatory: rawMandatory === "true",
        releaseNotes: releaseNotes ? releaseNotes.slice(0, 2000) : null,
    };
}

function androidAppUpdateController(req, res) {
    const rawCurrentVersionCode = req.query.currentVersionCode;
    if (
        typeof rawCurrentVersionCode !== "string" ||
        !/^\d+$/.test(rawCurrentVersionCode) ||
        !Number.isSafeInteger(Number(rawCurrentVersionCode)) ||
        Number(rawCurrentVersionCode) < 1
    ) {
        return res.status(400).json({
            success: false,
            message: "A valid currentVersionCode is required.",
        });
    }

    try {
        const config = getAndroidUpdateConfig();
        const currentVersionCode = Number(rawCurrentVersionCode);
        const updateAvailable =
            config.releaseConfigured && currentVersionCode < config.latestVersionCode;

        return res.json({
            success: true,
            data: {
                platform: "android",
                latestVersion: config.latestVersion,
                latestVersionCode: config.latestVersionCode,
                updateAvailable,
                downloadUrl: config.releaseConfigured ? config.downloadUrl : null,
                apkSha256: config.releaseConfigured ? config.apkSha256 : null,
                mandatory: updateAvailable && config.mandatory,
                releaseNotes: config.releaseNotes,
            },
        });
    } catch (error) {
        console.error("Android app update configuration error:", error);
        return res.status(503).json({
            success: false,
            message: "Android update configuration is unavailable.",
        });
    }
}

module.exports = {
    androidAppUpdateController,
    getAndroidUpdateConfig,
};
