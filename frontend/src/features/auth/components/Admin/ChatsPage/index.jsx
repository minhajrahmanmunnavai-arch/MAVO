import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, MessageCircle, Send } from "lucide-react";
import ChatMessage from "../../ChatMessage.jsx";
import {
  deleteAdminChatMessage,
  editAdminChatMessage,
  getAdminChatMessages,
  getAdminConversations,
  markAdminConversationRead,
  sendAdminChatMessage,
} from "../../../services/chat.api.js";
import {
  joinRealtimeChat,
  leaveRealtimeChat,
  subscribeToLiveUpdates,
  subscribeToRealtimeConnection,
} from "../../../services/liveUpdates.api.js";

const EMPTY_MESSAGES = [];

function mergeMessage(messages, message) {
  if (!message?.id) return messages;
  const existingIndex = messages.findIndex((item) => item.id === message.id);
  if (existingIndex < 0) return [...messages, message].sort(
    (first, second) => new Date(first.createdAt) - new Date(second.createdAt)
  );
  return messages.map((item) => item.id === message.id ? message : item);
}

function formatChatDate(date) {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messageData, setMessageData] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const messagesRequestPending = useRef(false);
  const messageRequestId = useRef(0);
  const messages =
    messageData?.conversationId === selectedConversationId
      ? messageData.messages
      : EMPTY_MESSAGES;

  const loadConversations = useCallback(async () => {
    try {
      const results = await getAdminConversations();
      setConversations(results);
      setSelectedConversationId((current) =>
        current && results.some((item) => item.id === current)
          ? current
          : ""
      );
      setError("");
    } catch (loadError) {
      setError(
        loadError.response?.data?.message ||
          loadError.message ||
          "Unable to load customer chats."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadConversations, 0);
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "chat:changed") loadConversations();
    });
    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) return undefined;

    const requestId = ++messageRequestId.current;
    const loadMessages = async () => {
      if (messagesRequestPending.current) return;
      messagesRequestPending.current = true;
      try {
        const chat = await getAdminChatMessages(selectedConversationId);
        if (messageRequestId.current === requestId) {
          setMessageData({
            conversationId: selectedConversationId,
            messages: chat.messages,
          });
          setError("");
        }
      } catch (loadError) {
        if (messageRequestId.current === requestId) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Unable to load messages."
          );
        }
      } finally {
        messagesRequestPending.current = false;
      }
    };

    loadMessages();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type !== "chat:changed") return;

      const conversation = conversations.find(
        (item) => item.id === selectedConversationId
      );
      const matches =
        conversation?.chatType === "seller"
          ? update.resourceId === "seller" &&
            (!update.chatConversationId ||
              update.chatConversationId === selectedConversationId.replace(/^seller_/, ""))
          : update.resourceId === conversation?.orderId;
      if (!matches) return;

      if (update.message?.id) {
        setMessageData((current) => ({
          conversationId: selectedConversationId,
          messages:
            current?.conversationId === selectedConversationId
              ? mergeMessage(current.messages, update.message)
              : [update.message],
        }));
      } else {
        loadMessages();
      }
    });
    const unsubscribeConnection =
      subscribeToRealtimeConnection(loadMessages);
    return () => {
      if (messageRequestId.current === requestId) messageRequestId.current += 1;
      unsubscribe();
      unsubscribeConnection();
    };
  }, [selectedConversationId, conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  );

  const selectedChatType = selectedConversation?.chatType;
  const selectedChatResourceId =
    selectedChatType === "seller"
      ? "seller"
      : selectedConversation?.orderId;

  useEffect(() => {
    if (!selectedConversation) return undefined;
    joinRealtimeChat({
      chatType: selectedChatType,
      resourceId: selectedChatResourceId,
      conversationId: selectedConversation.id,
    });
    const unsubscribeConnection = subscribeToRealtimeConnection(() => {
      if (selectedConversation.chatType === "seller") return;
      setSelectedConversationId((current) => current);
    });
    return () => {
      unsubscribeConnection();
      leaveRealtimeChat();
    };
  }, [selectedConversation, selectedChatType, selectedChatResourceId]);

  const handleSelectConversation = async (conversationId) => {
    setSelectedConversationId(conversationId);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, isUnread: false }
          : conversation
      )
    );

    try {
      await markAdminConversationRead(conversationId);
    } catch (readError) {
      setError(
        readError.response?.data?.message ||
          readError.message ||
          "Unable to mark conversation as read."
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !selectedConversationId || isSending) return;

    setIsSending(true);
    setError("");
    try {
      const sentMessage = await sendAdminChatMessage(
        selectedConversationId,
        trimmedMessage
      );
      setMessageData((current) => ({
        conversationId: selectedConversationId,
        messages:
          current?.conversationId === selectedConversationId
            ? mergeMessage(current.messages, sentMessage)
            : [sentMessage],
      }));
      setMessage("");
      await loadConversations();
    } catch (sendError) {
      setError(
        sendError.response?.data?.message ||
          sendError.message ||
          "Unable to send reply."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId, body) => {
    const updatedMessage = await editAdminChatMessage(
      selectedConversationId,
      messageId,
      body
    );
    setMessageData((current) =>
      current?.conversationId === selectedConversationId
        ? {
            ...current,
            messages: current.messages.map((item) =>
              item.id === messageId ? updatedMessage : item
            ),
          }
        : current
    );
    await loadConversations();
  };

  const handleDeleteMessage = async (messageId) => {
    const deletedMessage = await deleteAdminChatMessage(
      selectedConversationId,
      messageId
    );
    setMessageData((current) =>
      current?.conversationId === selectedConversationId
        ? {
            ...current,
            messages: current.messages.map((item) =>
              item.id === messageId ? deletedMessage : item
            ),
          }
        : current
    );
    await loadConversations();
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Customer support
        </p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Customer chats</h1>
          <span
            className="inline-flex min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700"
            aria-label={`${conversations.length} conversations`}
          >
            {conversations.length}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Reply to order questions and general customer messages. Conversations refresh automatically.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border   border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {selectedConversation ? (
        <section className="flex min-h-128 flex-col overflow-hidden rounded-xl border border-gray-200 cursor-pointer bg-white shadow-sm">
          <header className="flex flex-wrap cursor-pointer items-center gap-4 border-b border-gray-200 px-5 py-4">
            <button
              type="button"
              onClick={() => setSelectedConversationId("")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium  text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              All conversations
            </button>
            <div>
              <h2 className="font-semibold text-gray-900">
                {selectedConversation.customerName}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {selectedConversation.customerEmail} ·{" "}
                {selectedConversation.chatType === "seller"
                  ? "General seller chat"
                  : `Order #${selectedConversation.orderId.slice(-8)} · ${selectedConversation.orderStatus}`}
              </p>
            </div>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-5 sm:px-6" aria-live="polite">
            {messages.map((item) => {
              const isAdminMessage = item.senderRole === "admin";
              return (
                <ChatMessage
                  key={item.id}
                  message={item}
                  isMine={isAdminMessage}
                  appearance="admin"
                  onSave={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  formatTime={formatChatDate}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex items-end gap-3 border-t border-gray-200 p-4">
            <label className="sr-only" htmlFor="admin-chat-message">Your reply</label>
            <textarea
              id="admin-chat-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              rows={1}
              placeholder="Write a reply..."
              className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              aria-label="Send reply"
              disabled={!message.trim() || isSending}
              className="flex h-11 w-11 cursor-pointer shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSending ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </form>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Conversations
              <span className="ml-2 text-xs font-normal text-gray-500">
                {conversations.length}
              </span>
            </h2>
          </div>
          {isLoading ? (
            <p className="px-5 py-8 text-sm text-gray-500">Loading chats...</p>
          ) : conversations.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <MessageCircle aria-hidden="true" className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No customer chats yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectConversation(conversation.id)}
                    className="w-full px-5 py-4 text-left cursor-pointer transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className={`truncate text-sm text-gray-900 ${conversation.isUnread ? "font-bold" : "font-normal"}`}>
                        {conversation.customerName}
                      </span>
                      <span className={`shrink-0 text-xs text-gray-400 ${conversation.isUnread ? "font-bold" : "font-normal"}`}>
                        {formatChatDate(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className={`mt-1 block text-xs text-gray-500 ${conversation.isUnread ? "font-bold" : "font-normal"}`}>
                      {conversation.chatType === "seller"
                        ? "General seller chat"
                        : `Order #${conversation.orderId.slice(-8)}`}
                    </span>
                    <span className={`mt-1 block truncate text-sm text-gray-600 ${conversation.isUnread ? "font-bold" : "font-normal"}`}>
                      {conversation.lastMessageRole === "admin" ? "You: " : ""}
                      {conversation.lastMessage}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  );
}
