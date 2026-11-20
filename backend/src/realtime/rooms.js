const USER_ROOM_PREFIX = "user:";
const SESSION_ROOM_PREFIX = "session:";
const ADMIN_ROOM = "role:admin";
const CHAT_ROOM_PREFIX = "chat:";

function userRoom(userId) {
    return `${USER_ROOM_PREFIX}${String(userId)}`;
}

function sessionRoom(sessionId) {
    return `${SESSION_ROOM_PREFIX}${String(sessionId)}`;
}

function chatRoom(chatType, resourceId) {
    return `${CHAT_ROOM_PREFIX}${String(chatType)}:${String(resourceId)}`;
}

module.exports = { ADMIN_ROOM, userRoom, sessionRoom, chatRoom };
