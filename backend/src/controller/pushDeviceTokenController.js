const pushDeviceTokenModel = require("../models/pushDeviceToken.model");

const supportedPlatforms = new Set(["android", "ios"]);

async function registerPushDevice(req, res) {
    const { token, platform } = req.body || {};
    if (
        typeof token !== "string" ||
        !token.trim() ||
        token.length > 4096 ||
        !supportedPlatforms.has(platform)
    ) {
        return res.status(400).json({
            message: "A valid push token and supported platform are required.",
        });
    }

    try {
        await pushDeviceTokenModel.findOneAndUpdate(
            { token: token.trim() },
            {
                $set: {
                    user: req.user.id,
                    platform,
                    lastSeenAt: new Date(),
                },
            },
            { upsert: true, new: true, runValidators: true }
        );
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Register Push Device Error:", error);
        return res.status(500).json({ message: "Unable to register this device." });
    }
}

async function unregisterPushDevice(req, res) {
    const { token } = req.body || {};
    if (typeof token !== "string" || !token.trim() || token.length > 4096) {
        return res.status(400).json({ message: "A valid push token is required." });
    }

    try {
        await pushDeviceTokenModel.deleteOne({
            user: req.user.id,
            token: token.trim(),
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Unregister Push Device Error:", error);
        return res.status(500).json({ message: "Unable to unregister this device." });
    }
}

module.exports = { registerPushDevice, unregisterPushDevice };
