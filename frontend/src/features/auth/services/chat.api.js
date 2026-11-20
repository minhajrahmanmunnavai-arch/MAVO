import { api } from "./auth.api.js";

function readMessagesResponse(data) {
  if (!Array.isArray(data?.messages)) {
    throw new Error("Chat request failed: invalid messages response.");
  }
  return data;
}

export async function getOrderChat(orderId) {
  if (!orderId) throw new Error("An order ID is required.");
  const response = await api.get(
    `/api/chats/orders/${encodeURIComponent(orderId)}`
  );
  return readMessagesResponse(response.data);
}

export async function sendOrderChatMessage(orderId, message) {
  if (!orderId) throw new Error("An order ID is required.");
  const response = await api.post(
    `/api/chats/orders/${encodeURIComponent(orderId)}/messages`,
    { message }
  );
  if (!response.data?.message?.id) {
    throw new Error("Unable to send message: invalid server response.");
  }
  return response.data;
}

export async function editOrderChatMessage(orderId, messageId, message) {
  if (!orderId || !messageId) {
    throw new Error("An order ID and message ID are required.");
  }
  const response = await api.patch(
    `/api/chats/orders/${encodeURIComponent(orderId)}/messages/${encodeURIComponent(messageId)}`,
    { message }
  );
  if (!response.data?.message?.id) {
    throw new Error("Unable to edit message: invalid server response.");
  }
  return response.data.message;
}

export async function deleteOrderChatMessage(orderId, messageId) {
  if (!orderId || !messageId) {
    throw new Error("An order ID and message ID are required.");
  }
  const response = await api.delete(
    `/api/chats/orders/${encodeURIComponent(orderId)}/messages/${encodeURIComponent(messageId)}`
  );
  if (!response.data?.message?.id) {
    throw new Error("Unable to delete message: invalid server response.");
  }
  return response.data.message;
}

export async function getAdminConversations() {
  const response = await api.get("/api/chats/admin/conversations");
  if (!Array.isArray(response.data?.conversations)) {
    throw new Error("Unable to load chats: invalid server response.");
  }
  return response.data.conversations;
}

export async function getAdminChatMessages(conversationId) {
  if (!conversationId) throw new Error("A conversation ID is required.");
  const response = await api.get(
    `/api/chats/admin/conversations/${encodeURIComponent(conversationId)}/messages`
  );
  return readMessagesResponse(response.data);
}

export async function markAdminConversationRead(conversationId) {
  if (!conversationId) throw new Error("A conversation ID is required.");
  const response = await api.post(
    `/api/chats/admin/conversations/${encodeURIComponent(conversationId)}/read`
  );
  if (response.data?.success !== true) {
    throw new Error("Unable to mark conversation as read.");
  }
}

export async function sendAdminChatMessage(conversationId, message) {
  if (!conversationId) throw new Error("A conversation ID is required.");
  const response = await api.post(
    `/api/chats/admin/conversations/${encodeURIComponent(conversationId)}/messages`,
    { message }
  );
  if (!response.data?.message?.id) {
    throw new Error("Unable to send reply: invalid server response.");
  }
  return response.data.message;
}

export async function editAdminChatMessage(conversationId, messageId, message) {
  if (!conversationId || !messageId) {
    throw new Error("A conversation ID and message ID are required.");
  }
  const response = await api.patch(
    `/api/chats/admin/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
    { message }
  );
  if (!response.data?.message?.id) {
    throw new Error("Unable to edit reply: invalid server response.");
  }
  return response.data.message;
}

export async function deleteAdminChatMessage(conversationId, messageId) {
  if (!conversationId || !messageId) {
    throw new Error("A conversation ID and message ID are required.");
  }
  const response = await api.delete(
    `/api/chats/admin/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`
  );
  if (!response.data?.message?.id) {
    throw new Error("Unable to delete reply: invalid server response.");
  }
  return response.data.message;
}
