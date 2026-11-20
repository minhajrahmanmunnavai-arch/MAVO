const { ADMIN_ROOM, userRoom, sessionRoom } = require("../realtime/rooms");

const clients = new Set();
let socketServer = null;

function setSocketServer(server) {
    socketServer = server;
}

function publishUpdate({
    type,
    userId = null,
    resourceId = null,
    chatType = null,
    chatResourceId = null,
    chatConversationId = null,
    message = null,
}) {
    const update = {
        type,
        ...(typeof resourceId === "string" && resourceId.length <= 128
            ? { resourceId }
            : {}),
        ...(typeof chatConversationId === "string" && chatConversationId.length <= 128
            ? { chatConversationId }
            : {}),
        ...(message && typeof message.id === "string" ? { message } : {}),
    };
    const sseMessage = `data: ${JSON.stringify(update)}\n\n`;
    const publicSocketUpdate = [
        "products:changed",
        "categories:changed",
        "reviews:changed",
    ].includes(type);
    const publicSseUpdate = ["products:changed", "categories:changed"].includes(type);

    if (socketServer) {
        if (publicSocketUpdate) {
            socketServer.emit("live:update", update);
        } else {
            const rooms = new Set([ADMIN_ROOM]);
            if (userId) rooms.add(userRoom(userId));
            if (chatType && chatResourceId) {
                const { chatRoom } = require("../realtime/rooms");
                rooms.add(chatRoom(chatType, chatResourceId));
            }
            for (const room of rooms) {
                socketServer.to(room).emit("live:update", update);
            }
        }
    }

    for (const client of clients) {
        if (
            !publicSseUpdate &&
            client.role !== "admin" &&
            (!userId || String(client.userId) !== String(userId))
        ) {
            continue;
        }

        try {
            client.response.write(sseMessage);
        } catch (error) {
            clients.delete(client);
            clearInterval(client.heartbeat);
        }
    }
}

function disconnectSessionSockets(sessionId) {
    const activeSessionRoom = sessionRoom(sessionId);
    socketServer?.in(activeSessionRoom).disconnectSockets(true);

    for (const client of clients) {
        if (String(client.sessionId) !== String(sessionId)) continue;
        clients.delete(client);
        clearInterval(client.heartbeat);
        if (!client.response.destroyed) client.response.end();
    }
}

function streamUpdates(req, res) {
    res.status(200).set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 5000\n\n");

    const client = {
        response: res,
        userId: req.user?.id,
        role: req.user?.role,
        sessionId: req.user?.sid,
        heartbeat: setInterval(() => {
            if (!res.destroyed) res.write(": keep-alive\n\n");
        }, 20000),
    };
    clients.add(client);

    req.on("close", () => {
        clients.delete(client);
        clearInterval(client.heartbeat);
    });
}

module.exports = {
    publishUpdate,
    streamUpdates,
    setSocketServer,
    disconnectSessionSockets,
};
