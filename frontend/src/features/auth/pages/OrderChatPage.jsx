import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, MessageCircle, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ChatMessage from "../components/ChatMessage.jsx";
import {
  deleteOrderChatMessage,
  editOrderChatMessage,
  getOrderChat,
  sendOrderChatMessage,
} from "../services/chat.api.js";
import {
  joinRealtimeChat,
  leaveRealtimeChat,
  subscribeToLiveUpdates,
  subscribeToRealtimeConnection,
} from "../services/liveUpdates.api.js";

const EMPTY_MESSAGES = [];

function mergeMessage(messages, message) {
  if (!message?.id) return messages;
  const existingIndex = messages.findIndex((item) => item.id === message.id);
  if (existingIndex < 0) return [...messages, message].sort(
    (first, second) => new Date(first.createdAt) - new Date(second.createdAt)
  );
  return messages.map((item) => item.id === message.id ? message : item);
}

function formatMessageTime(date) {
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

function OrderChatConversation({ orderId }) {
  const [messageData, setMessageData] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const messagesRequestPending = useRef(false);
  const requestId = useRef(0);
  const bottomRef = useRef(null);
  const messages =
    messageData?.orderId === orderId ? messageData.messages : EMPTY_MESSAGES;
  const isLoading = messageData?.orderId !== orderId;
  const loadError =
    messageData?.orderId === orderId ? messageData.error : "";

  useEffect(() => {
    const activeRequestId = ++requestId.current;

    const loadMessages = async () => {
      if (messagesRequestPending.current) return;
      messagesRequestPending.current = true;
      try {
        const chat = await getOrderChat(orderId);
        if (requestId.current === activeRequestId) {
          setMessageData({
            orderId,
            messages: chat.messages,
            error: "",
          });
        }
      } catch (error) {
        if (requestId.current === activeRequestId) {
          setMessageData({
            orderId,
            messages: [],
            error:
              error.response?.data?.message ||
              error.message ||
              "Unable to load this conversation.",
          });
        }
      } finally {
        messagesRequestPending.current = false;
      }
    };

    loadMessages();
    joinRealtimeChat({ chatType: "order", resourceId: orderId });
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (
        update.type === "chat:changed" &&
        update.resourceId === orderId &&
        update.message?.id
      ) {
        setMessageData((current) => ({
          orderId,
          messages:
            current?.orderId === orderId
              ? mergeMessage(current.messages, update.message)
              : [update.message],
          error: "",
        }));
      } else if (
        update.type === "chat:changed" &&
        update.resourceId === orderId
      ) {
        loadMessages();
      }
    });
    const unsubscribeConnection = subscribeToRealtimeConnection(loadMessages);
    return () => {
      if (requestId.current === activeRequestId) requestId.current += 1;
      unsubscribe();
      unsubscribeConnection();
      leaveRealtimeChat();
    };
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    setSendError("");
    try {
      const result = await sendOrderChatMessage(orderId, trimmedMessage);
      setMessageData((current) => ({
        orderId,
        messages:
          current?.orderId === orderId
            ? mergeMessage(current.messages, result.message)
            : [result.message],
        error: "",
      }));
      setMessageText("");
    } catch (error) {
      setSendError(
        error.response?.data?.message ||
          error.message ||
          "Unable to send your message."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId, body) => {
    const updatedMessage = await editOrderChatMessage(orderId, messageId, body);
    setMessageData((current) =>
      current?.orderId === orderId
        ? {
            ...current,
            messages: current.messages.map((item) =>
              item.id === messageId ? updatedMessage : item
            ),
          }
        : current
    );
  };

  const handleDeleteMessage = async (messageId) => {
    const deletedMessage = await deleteOrderChatMessage(orderId, messageId);
    setMessageData((current) =>
      current?.orderId === orderId
        ? {
            ...current,
            messages: current.messages.map((item) =>
              item.id === messageId ? deletedMessage : item
            ),
          }
        : current
    );
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8 max-[421px]:px-3 max-[421px]:py-4">
      <Link
        to="/my-orders"
        className="mb-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950 max-[421px]:mb-3"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to My Orders
      </Link>

      <section className="flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b border-stone-200 px-4 py-4 sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white">
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-stone-900">
              MAVO Store Support
            </h1>
            <p className="mt-0.5 truncate text-xs text-stone-500">
              Chat about order #{orderId.slice(-8)}
            </p>
          </div>
          <span className="hidden items-center gap-2 text-xs text-stone-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Replies refresh automatically
          </span>
        </header>

        <div
          className="min-w-0 flex-1 space-y-4 overflow-y-auto bg-[#f7f7f5] px-4 py-6 sm:px-8 max-[421px]:px-3 max-[421px]:py-4"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <div className="flex h-full min-h-64 items-center justify-center gap-2 text-sm text-stone-500" role="status">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              Loading conversation...
            </div>
          ) : loadError ? (
            <p className="mx-auto max-w-md rounded-xl border border-red-200 bg-white px-4 py-3 text-center text-sm text-red-700" role="alert">
              {loadError}
            </p>
          ) : messages.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-stone-400 shadow-sm">
                <MessageCircle aria-hidden="true" className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-stone-800">
                Start a conversation
              </h2>
              <p className="mt-1 max-w-xs text-xs leading-5 text-stone-500">
                Send a message to MAVO Store Support about this order.
              </p>
            </div>
          ) : (
            messages.map((item) => {
              const isMine = item.senderRole === "user";
              return (
                <ChatMessage
                  key={item.id}
                  message={item}
                  isMine={isMine}
                  appearance="customer"
                  onSave={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  formatTime={formatMessageTime}
                />
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {sendError && (
          <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-6" role="alert">
            {sendError}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-3 border-t border-stone-200 bg-white p-3 sm:p-4"
        >
          <label className="sr-only" htmlFor="seller-chat-message">
            Your message
          </label>
          <textarea
            id="seller-chat-message"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            maxLength={2000}
            rows={1}
            placeholder="Write a message..."
            className="max-h-36 min-h-12 min-w-0 flex-1 resize-y rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            aria-label="Send message"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isSending ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Send aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="bg-white px-4 pb-3 text-center text-[10px] text-stone-400">
          Messages refresh automatically every few seconds.
        </p>
      </section>
    </div>
  );
}

export default function OrderChatPage() {
  const { orderId } = useParams();

  if (!orderId) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-xl font-semibold text-stone-900">Order unavailable</h1>
        <Link to="/my-orders" className="mt-4 inline-block text-sm font-semibold underline">
          Return to My Orders
        </Link>
      </main>
    );
  }

  return <OrderChatConversation key={orderId} orderId={orderId} />;
}
