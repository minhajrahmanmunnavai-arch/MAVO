const firebaseAdmin = require("firebase-admin");
const pushDeviceTokenModel = require("../models/pushDeviceToken.model");

const ANDROID_CHANNEL_ID = "mavo_push";
const INVALID_TOKEN_CODES = new Set([
    "messaging/invalid-registration-token",
    "messaging/registration-token-not-registered",
]);

let firebaseApp;

function getFirebaseMessaging() {
    const projectId = process.env.FCM_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) {
        throw new Error("FCM_PROJECT_ID must be configured before sending push notifications.");
    }

    if (!firebaseApp) {
        firebaseApp = firebaseAdmin.initializeApp(
            {
                credential: firebaseAdmin.credential.applicationDefault(),
                projectId,
            },
            "mavo-push-notifications"
        );
    }

    return firebaseAdmin.messaging(firebaseApp);
}

function splitIntoBatches(items, batchSize) {
    const batches = [];
    for (let index = 0; index < items.length; index += batchSize) {
        batches.push(items.slice(index, index + batchSize));
    }
    return batches;
}

async function sendPushNotification(notification) {
    const devices = await pushDeviceTokenModel.find({
        user: notification.user,
    }).select("token").lean();
    if (devices.length === 0) return { sent: 0 };

    const messaging = getFirebaseMessaging();
    let sent = 0;
    const invalidTokens = [];
    const deliveryErrors = [];
    const data = {
        notificationId: String(notification._id),
        kind: String(notification.kind),
        to: String(notification.to),
        ...(notification.relatedId ? { relatedId: String(notification.relatedId) } : {}),
    };

    for (const batch of splitIntoBatches(devices, 500)) {
        const tokens = batch.map(({ token }) => token);
        const result = await messaging.sendEachForMulticast({
            tokens,
            notification: {
                title: notification.title,
                body: notification.description,
            },
            data,
            android: {
                priority: "high",
                notification: {
                    channelId: ANDROID_CHANNEL_ID,
                    sound: "default",
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                    },
                },
            },
        });

        result.responses.forEach((response, index) => {
            if (response.success) {
                sent += 1;
            } else if (INVALID_TOKEN_CODES.has(response.error?.code)) {
                invalidTokens.push(tokens[index]);
            } else {
                deliveryErrors.push(response.error);
            }
        });
    }

    if (invalidTokens.length > 0) {
        await pushDeviceTokenModel.deleteMany({ token: { $in: invalidTokens } });
    }
    if (deliveryErrors.length > 0) {
        throw new Error(
            `FCM failed to deliver to ${deliveryErrors.length} device(s).`
        );
    }

    return { sent, removedInvalidTokens: invalidTokens.length };
}

module.exports = { sendPushNotification };
