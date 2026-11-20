const test = require("node:test");
const assert = require("node:assert/strict");
const chatController = require("../src/controller/chatController");
const chatConversationModel = require("../src/models/chatConversation.model");
const sellerChatConversationModel = require("../src/models/sellerChatConversation.model");
const sellerChatMessageModel = require("../src/models/sellerChatMessage.model");

function createResponse() {
    return {
        statusCode: undefined,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

function createPopulateQuery(value) {
    return {
        populate() {
            return this;
        },
        then(resolve, reject) {
            return Promise.resolve(value).then(resolve, reject);
        },
    };
}

test("customer messages use a single general seller conversation", async (t) => {
    const userId = "507f1f77bcf86cd799439011";
    const conversationId = "507f1f77bcf86cd799439012";
    const messageId = "507f1f77bcf86cd799439013";
    const conversation = {
        _id: conversationId,
        save: async () => {},
    };
    const messageDate = new Date("2026-11-18T10:00:00.000Z");
    const findConversation = t.mock.method(
        sellerChatConversationModel,
        "findOne",
        async (filter) => {
            assert.deepEqual(filter, { customer: userId });
            return conversation;
        }
    );
    const createMessage = t.mock.method(
        sellerChatMessageModel,
        "create",
        async (message) => ({
            ...message,
            _id: messageId,
            createdAt: messageDate,
            isDeleted: false,
        })
    );
    const response = createResponse();

    await chatController.sendSellerChatMessage(
        {
            body: { message: "  I have a question about delivery.  " },
            user: { id: userId, username: "Customer" },
        },
        response
    );

    assert.equal(findConversation.mock.callCount(), 1);
    assert.equal(createMessage.mock.calls[0].arguments[0].conversation, conversationId);
    assert.equal(createMessage.mock.calls[0].arguments[0].body, "I have a question about delivery.");
    assert.equal(response.statusCode, 201);
    assert.equal(response.body.message.senderRole, "user");
    assert.equal(response.body.message.body, "I have a question about delivery.");
});

test("admin conversation listing includes general seller chats", async (t) => {
    const conversationId = "507f1f77bcf86cd799439021";
    const sellerConversation = {
        _id: conversationId,
        customer: { username: "Customer", email: "customer@example.com" },
        lastMessageText: "Can you help me?",
        lastMessageRole: "user",
        lastMessageAt: new Date("2026-11-18T10:00:00.000Z"),
        updatedAt: new Date("2026-11-18T10:00:00.000Z"),
        adminLastReadAt: null,
    };
    t.mock.method(chatConversationModel, "find", () =>
        createPopulateQuery([])
    );
    t.mock.method(sellerChatConversationModel, "find", () =>
        createPopulateQuery([sellerConversation])
    );
    const response = createResponse();

    await chatController.getAdminConversations({}, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.conversations[0], {
        id: `seller_${conversationId}`,
        chatType: "seller",
        orderId: null,
        orderStatus: null,
        customerName: "Customer",
        customerEmail: "customer@example.com",
        lastMessage: "Can you help me?",
        lastMessageRole: "user",
        lastMessageAt: sellerConversation.lastMessageAt,
        isUnread: true,
    });
});

test("admin can reply to a general seller conversation", async (t) => {
    const conversationId = "507f1f77bcf86cd799439031";
    const customerId = "507f1f77bcf86cd799439032";
    const messageId = "507f1f77bcf86cd799439033";
    const conversation = {
        _id: conversationId,
        customer: customerId,
        save: async () => {},
    };
    const findConversation = t.mock.method(
        sellerChatConversationModel,
        "findById",
        async (id) => {
            assert.equal(id, conversationId);
            return conversation;
        }
    );
    const createMessage = t.mock.method(
        sellerChatMessageModel,
        "create",
        async (message) => ({
            ...message,
            _id: messageId,
            createdAt: new Date("2026-11-18T11:00:00.000Z"),
            isDeleted: false,
        })
    );
    const response = createResponse();

    await chatController.sendAdminChatMessage(
        {
            params: { conversationId: `seller_${conversationId}` },
            body: { message: "Of course, how can I help?" },
            user: { id: "507f1f77bcf86cd799439034", username: "Support" },
        },
        response
    );

    assert.equal(findConversation.mock.callCount(), 1);
    assert.equal(createMessage.mock.calls[0].arguments[0].conversation, conversationId);
    assert.equal(createMessage.mock.calls[0].arguments[0].senderRole, "admin");
    assert.equal(response.statusCode, 201);
    assert.equal(response.body.message.body, "Of course, how can I help?");
});
