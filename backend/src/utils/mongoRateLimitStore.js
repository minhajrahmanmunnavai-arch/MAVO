const rateLimitCounterModel = require("../models/rateLimitCounter.model");
const { createHmac } = require("crypto");

class MongoRateLimitStore {
    constructor(prefix) {
        this.prefix = prefix;
        this.localKeys = false;
        this.windowMs = 60 * 1000;
    }

    getStoredKey(key) {
        const digest = createHmac("sha256", process.env.JWT_SECRET)
            .update(key)
            .digest("hex");
        return `${this.prefix}${digest}`;
    }

    init(options) {
        this.windowMs = options.windowMs;
    }

    async get(key) {
        const counter = await rateLimitCounterModel
            .findOne({ key: this.getStoredKey(key) })
            .lean();
        if (!counter) return undefined;

        return {
            totalHits: counter.count,
            resetTime: counter.resetAt,
        };
    }

    async increment(key) {
        const storedKey = this.getStoredKey(key);
        const now = new Date();
        const resetAt = new Date(now.getTime() + this.windowMs);
        const isExpired = {
            $or: [
                { $eq: [{ $ifNull: ["$resetAt", null] }, null] },
                { $lte: ["$resetAt", now] },
            ],
        };

        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const counter = await rateLimitCounterModel.findOneAndUpdate(
                    { key: storedKey },
                    [
                        {
                            $set: {
                                key: { $literal: storedKey },
                                count: {
                                    $cond: [
                                        isExpired,
                                        1,
                                        { $add: [{ $ifNull: ["$count", 0] }, 1] },
                                    ],
                                },
                                resetAt: { $cond: [isExpired, resetAt, "$resetAt"] },
                            },
                        },
                    ],
                    { upsert: true, new: true, lean: true, updatePipeline: true }
                );

                return {
                    totalHits: counter.count,
                    resetTime: counter.resetAt,
                };
            } catch (error) {
                if (error.code !== 11000 || attempt === 2) throw error;
            }
        }

        throw new Error("Unable to increment the shared rate limit counter.");
    }

    async decrement(key) {
        await rateLimitCounterModel.updateOne(
            { key: this.getStoredKey(key), count: { $gt: 0 } },
            { $inc: { count: -1 } }
        );
    }

    async resetKey(key) {
        await rateLimitCounterModel.deleteOne({ key: this.getStoredKey(key) });
    }
}

module.exports = MongoRateLimitStore;
