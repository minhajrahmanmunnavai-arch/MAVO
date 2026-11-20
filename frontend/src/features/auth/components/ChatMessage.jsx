import { useState } from "react";
import { Check, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

function messageError(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export default function ChatMessage({
  message,
  isMine,
  appearance = "customer",
  onSave,
  onDelete,
  formatTime,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isCustomerAppearance = appearance === "customer";
  const ownMessageClass = isCustomerAppearance
    ? "rounded-br-md bg-stone-900 text-white"
    : "rounded-br-md bg-gray-900 text-white";
  const otherMessageClass = isCustomerAppearance
    ? "rounded-bl-md border border-stone-200 bg-white text-stone-900 shadow-sm"
    : "rounded-bl-md border border-gray-200 bg-white text-gray-900";
  const mutedOwnClass = isCustomerAppearance ? "text-stone-300" : "text-gray-300";
  const mutedOtherClass = isCustomerAppearance ? "text-stone-500" : "text-gray-500";
  const timeOwnClass = isCustomerAppearance ? "text-stone-300" : "text-gray-300";
  const timeOtherClass = isCustomerAppearance ? "text-stone-400" : "text-gray-400";
  const isDeleted = Boolean(message.isDeleted);

  const handleSave = async (event) => {
    event.preventDefault();
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || trimmedDraft.length > 2000 || isSaving) return;

    setIsSaving(true);
    setError("");
    try {
      await onSave(message.id, trimmedDraft);
      setIsEditing(false);
    } catch (saveError) {
      setError(messageError(saveError, "Unable to edit this message."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsMenuOpen(false);
    setError("");
    try {
      await onDelete(message.id);
    } catch (deleteError) {
      setError(messageError(deleteError, "Unable to delete this message."));
    }
  };

  return (
    <div className={`flex items-start gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
          isDeleted
            ? "border border-gray-200 bg-gray-100 text-gray-500"
            : isMine
              ? ownMessageClass
              : otherMessageClass
        }`}
      >
        <p className={`text-[11px] font-semibold ${isMine ? mutedOwnClass : mutedOtherClass}`}>
          {isMine ? "You" : message.senderName}
        </p>
        {isEditing ? (
          <form onSubmit={handleSave}>
            <textarea
              aria-label="Edit message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              rows={3}
              autoFocus
              className="mt-2 w-full min-w-48 resize-y rounded-lg border border-white/40 bg-white p-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-400"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                aria-label="Cancel edit"
                onClick={() => {
                  setIsEditing(false);
                  setDraft(message.body);
                  setError("");
                }}
                disabled={isSaving}
                className="rounded-md p-1 text-current hover:bg-black/10 disabled:opacity-50"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="submit"
                aria-label="Save edit"
                disabled={!draft.trim() || isSaving}
                className="rounded-md p-1 text-current hover:bg-black/10 disabled:opacity-50"
              >
                <Check aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </form>
        ) : (
          <p className={`mt-1 whitespace-pre-wrap wrap-break-wordbreak-word text-sm leading-6 ${isDeleted ? "italic" : ""}`}>
            {isDeleted ? "This message was deleted." : message.body}
          </p>
        )}
        {!isEditing && (
          <time
            dateTime={message.createdAt}
            className={`mt-2 block text-[10px] ${isMine && !isDeleted ? timeOwnClass : timeOtherClass}`}
          >
            {formatTime(message.createdAt)}
            {message.editedAt && !isDeleted ? " · edited" : ""}
          </time>
        )}
        {error && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
      {isMine && !isDeleted && (
        <div className="relative mt-2 shrink-0">
          <button
            type="button"
            aria-label="Message options"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-full p-1 cursor-pointer text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-10 min-w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setDraft(message.body);
                  setError("");
                  setIsEditing(true);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
