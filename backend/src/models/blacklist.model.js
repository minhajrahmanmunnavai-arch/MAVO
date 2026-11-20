const mongoose = require ("mongoose");

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type:String,
        required: [true, "Token is required"]
    },
    expiresAt: {
        type: Date,
    },
}, {
    timestamps: true
})

blacklistTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const blacklistModel = mongoose.model("blacklistToken", blacklistTokenSchema);

module.exports = blacklistModel;