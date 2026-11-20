const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authSessionModel = require("../models/authSession.model");
const chatConversationModel = require("../models/chatConversation.model");
const sellerChatConversationModel = require("../models/sellerChatConversation.model");
const allowedOrigins = require("../utils/allowedOrigins");
const { setSocketServer } = require("../utils/liveUpdates");
const { ADMIN_ROOM, userRoom, sessionRoom, chatRoom } = require("./rooms");

const SOCKET_TOKEN_PURPOSE = "realtime";

function isAllowedOrigin(origin) {
    return !origin || allowedOrigins.has(origin);
}

function attachSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin(origin, callback) {
                if (isAllowedOrigin(origin)) return callback(null, true);
                return callback(new Error("Origin is not allowed by CORS."));
            },
            credentials: true,
        },
        allowRequest(request, callback) {
            callback(null, isAllowedOrigin(request.headers.origin));
        },
        maxHttpBufferSize: 100_000,
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (typeof token !== "string" || token.length > 4096) {
            return next(new Error("Authentication required."));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ["HS256"],
                issuer: "mavo-api",
                audience: "mavo-socket",
            });
        } catch {
            return next(new Error("Authentication required."));
        }

        if (
            decoded.purpose !== SOCKET_TOKEN_PURPOSE ||
            !decoded.id ||
            !decoded.sid
        ) {
            return next(new Error("Authentication required."));
        }

        try {
            const activeSession = await authSessionModel.findOne({
                _id: decoded.sid,
                user: decoded.id,
                expiresAt: { $gt: new Date() },
            }).populate("user", "role").lean();

            if (!activeSession?.user) {
                return next(new Error("Authentication required."));
            }

            socket.data.userId = String(activeSession.user._id);
            socket.data.role = activeSession.user.role;
            socket.data.sessionId = String(activeSession._id);
            socket.data.tokenExpiresAt = decoded.exp * 1000;
            return next();
        } catch (error) {
            console.error("Socket authentication failed:", error);
            return next(new Error("Unable to authenticate socket."));
        }
    });

    io.on("connection", (socket) => {
        socket.join(userRoom(socket.data.userId));
        socket.join(sessionRoom(socket.data.sessionId));
        if (socket.data.role === "admin") socket.join(ADMIN_ROOM);

        const joinedChatRooms = new Set();

        socket.on("chat:join", async (payload, acknowledge) => {
            const ack = typeof acknowledge === "function" ? acknowledge : () => {};

            try {
                const chatType = payload?.chatType;
                let roomName = null;

                if (chatType === "order") {
                    const orderId = String(payload?.resourceId || "");
                    if (!mongoose.isValidObjectId(orderId)) {
                        return ack({ ok: false, error: "Invalid chat room." });
                    }

                    const conversationQuery = socket.data.role === "admin"
                        ? { order: orderId }
                        : { order: orderId, customer: socket.data.userId };
                    const conversation = await chatConversationModel.findOne(conversationQuery)
                        .select("_id order customer");
                    if (!conversation) {
                        return ack({ ok: false, error: "Chat room access denied." });
                    }
                    roomName = chatRoom("order", orderId);
                } else if (chatType === "seller") {
                    let conversation;
                    if (socket.data.role === "admin") {
                        const conversationId = String(payload?.conversationId || "").replace(/^seller_/, "");
                        if (!mongoose.isValidObjectId(conversationId)) {
                            return ack({ ok: false, error: "Invalid chat room." });
                        }
                        conversation = await sellerChatConversationModel.findById(conversationId)
                            .select("_id customer");
                    } else {
                        conversation = await sellerChatConversationModel.findOneAndUpdate(
                            { customer: socket.data.userId },
                            { $setOnInsert: { customer: socket.data.userId } },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        ).select("_id customer");
                    }
                    if (!conversation) {
                        return ack({ ok: false, error: "Chat room access denied." });
                    }
                    roomName = chatRoom("seller", String(conversation.customer));
                } else {
                    return ack({ ok: false, error: "Invalid chat room." });
                }

                for (const previousRoom of joinedChatRooms) {
                    if (previousRoom !== roomName) socket.leave(previousRoom);
                }
                joinedChatRooms.clear();
                socket.join(roomName);
                joinedChatRooms.add(roomName);
                return ack({ ok: true, room: roomName });
            } catch (error) {
                console.error("Chat room join failed:", error);
                return ack({ ok: false, error: "Unable to join chat room." });
            }
        });

        socket.on("chat:leave", (payload) => {
            const chatType = payload?.chatType;
            const resourceId = String(payload?.resourceId || "");
            if (!chatType || !resourceId) return;
            if (chatType === "seller") {
                for (const roomName of [...joinedChatRooms]) {
                    if (roomName.startsWith("chat:seller:")) {
                        socket.leave(roomName);
                        joinedChatRooms.delete(roomName);
                    }
                }
                return;
            }
            const roomName = chatRoom(chatType, resourceId);
            socket.leave(roomName);
            joinedChatRooms.delete(roomName);
        });

        const expiresIn = socket.data.tokenExpiresAt - Date.now();
        if (expiresIn > 0) {
            const expiryTimer = setTimeout(() => socket.disconnect(true), expiresIn);
            expiryTimer.unref?.();
            socket.once("disconnect", () => clearTimeout(expiryTimer));
        }
    });

    setSocketServer(io);
    return io;
}

module.exports = { attachSocketServer, SOCKET_TOKEN_PURPOSE };
