import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Image,
  MessageCircle,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useAdmin } from "../../contex/AdminContext.jsx";
import {
  getProductReviews,
  deleteProductReviewReply,
  replyToProductReview,
  updateProductReviewReply,
  voteOnProductReview,
} from "../../../services/review.api.js";
import { deleteAdminReview } from "../../../services/adminReview.api.js";
import { useAuth } from "../../../Hooks/useAuth.js";

function formatReviewDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function appendReplyToThread(replies, parentReplyId, newReply) {
  return replies.map((reply) =>
    reply.id === parentReplyId
      ? { ...reply, replies: [...(reply.replies || []), newReply] }
      : {
          ...reply,
          replies: appendReplyToThread(reply.replies || [], parentReplyId, newReply),
        }
  );
}

function updateReplyInThread(replies, replyId, update) {
  return replies.map((reply) =>
    reply.id === replyId
      ? { ...reply, ...update }
      : {
          ...reply,
          replies: updateReplyInThread(reply.replies || [], replyId, update),
        }
  );
}

function removeReplyFromThread(replies, replyId) {
  return replies
    .filter((reply) => reply.id !== replyId)
    .map((reply) => ({
      ...reply,
      replies: removeReplyFromThread(reply.replies || [], replyId),
    }));
}

function ReviewReply({
  reply,
  reviewId,
  adminUserId,
  onReply,
  onOpenContextMenu,
  editingReplyId,
  editingReplyComment,
  setEditingReplyComment,
  onEdit,
  onCancelEdit,
}) {
  const [replyFormOpen, setReplyFormOpen] = useState(false);
  const [replyComment, setReplyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editingReplyId === reply.id;

  const handleReplySubmit = async (event) => {
    event.preventDefault();
    const comment = replyComment.trim();
    if (!comment || submitting) return;

    setSubmitting(true);
    const submitted = await onReply(reviewId, reply.id, comment);
    if (submitted) {
      setReplyComment("");
      setReplyFormOpen(false);
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const comment = editingReplyComment.trim();
    if (!comment) return;
    const updated = await onEdit(reviewId, reply.id, comment);
    if (updated) onCancelEdit();
  };

  const handleContextMenu = (event) => {
    event.stopPropagation();
    if (!adminUserId || String(reply.userId) !== adminUserId) return;
    event.preventDefault();
    onOpenContextMenu(event, {
      type: "reply",
      reviewId,
      replyId: reply.id,
      comment: reply.comment,
    });
  };

  return (
    <div
      className="min-w-0 border-l-2 border-gray-200 pl-4"
      onContextMenu={(event) => event.stopPropagation()}
    >
      <div
        onContextMenu={handleContextMenu}
        className="rounded-xl bg-gray-50 px-3 py-2"
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-gray-800">
            Reply by {reply.userName || "Customer"}
          </span>
          <span className="text-xs text-gray-400">{formatReviewDate(reply.createdAt)}</span>
        </div>
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="mt-2 space-y-2">
            <textarea
              value={editingReplyComment}
              onChange={(event) => setEditingReplyComment(event.target.value)}
              maxLength={1000}
              required
              rows={2}
              aria-label="Edit your reply"
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!editingReplyComment.trim()}
                className="cursor-pointer rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="cursor-pointer rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600">
            {reply.comment}
          </p>
        )}
      </div>
      {!isEditing && (
        <button
          type="button"
          aria-expanded={replyFormOpen}
          onClick={() => {
            setReplyFormOpen((isOpen) => !isOpen);
            setReplyComment("");
          }}
          className="mt-1 cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          Reply
        </button>
      )}
      {!isEditing && replyFormOpen && (
        <form
          onSubmit={handleReplySubmit}
          className="mt-2 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2"
        >
          <label htmlFor={`reply-${reviewId}-${reply.id}`} className="sr-only">
            Reply to {reply.userName || "Customer"}
          </label>
          <input
            id={`reply-${reviewId}-${reply.id}`}
            value={replyComment}
            onChange={(event) => setReplyComment(event.target.value)}
            maxLength={1000}
            required
            placeholder={`Reply to ${reply.userName || "Customer"}...`}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!replyComment.trim() || submitting}
            className="shrink-0 cursor-pointer rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send"}
          </button>
        </form>
      )}
      {reply.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {reply.replies.map((childReply) => (
            <ReviewReply
              key={childReply.id}
              reply={childReply}
              reviewId={reviewId}
              adminUserId={adminUserId}
              onReply={onReply}
              onOpenContextMenu={onOpenContextMenu}
              editingReplyId={editingReplyId}
              editingReplyComment={editingReplyComment}
              setEditingReplyComment={setEditingReplyComment}
              onEdit={onEdit}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewDetailsPage() {
  const { selectedReview, setSelectedReview, navigateTo } = useAdmin();
  const { user } = useAuth();
  const adminUserId = String(user?._id || user?.id || "");
  const [reviewActivity, setReviewActivity] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [activityLoading, setActivityLoading] = useState(Boolean(selectedReview?.productId));
  const [activityError, setActivityError] = useState(
    selectedReview?.productId
      ? ""
      : "Unable to load review activity: product details are missing."
  );
  const [actionError, setActionError] = useState("");
  const [replyComment, setReplyComment] = useState("");
  const [replyFormOpen, setReplyFormOpen] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [pendingVote, setPendingVote] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [editingReplyId, setEditingReplyId] = useState("");
  const [editingReplyComment, setEditingReplyComment] = useState("");
  const [pendingReplyMutation, setPendingReplyMutation] = useState(false);

  useEffect(() => {
    if (!contextMenu) return undefined;

    const closeMenu = () => setContextMenu(null);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("click", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!selectedReview?.productId) return undefined;

    let active = true;

    getProductReviews(selectedReview.productId)
      .then((reviews) => {
        const review = reviews.find((item) => item.id === selectedReview.id);
        if (active) {
          setProductReviews(reviews);
          if (review) {
            setReviewActivity(review);
          } else {
            setActivityError("This review is no longer available.");
          }
        }
      })
      .catch((error) => {
        if (active) {
          setActivityError(
            error.response?.data?.message || error.message || "Unable to load review activity."
          );
        }
      })
      .finally(() => {
        if (active) setActivityLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedReview?.id, selectedReview?.productId]);

  const review = reviewActivity
    ? { ...selectedReview, ...reviewActivity }
    : selectedReview;
  const likes = reviewActivity?.likes || 0;
  const dislikes = reviewActivity?.dislikes || 0;
  const userVote = reviewActivity?.userVote || null;
  const replies = reviewActivity?.replies || [];
  const otherProductReviews = productReviews.filter(
    (productReview) => productReview.id !== selectedReview?.id
  );

  const openContextMenu = (event, item) => {
    event.preventDefault();
    const menuHeight = item.type === "review" ? 44 : 84;
    setContextMenu({
      ...item,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 196)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight)),
    });
  };

  const handleVote = async (vote) => {
    if (pendingVote) return;
    setPendingVote(vote);
    setActionError("");
    try {
      const result = await voteOnProductReview(selectedReview.id, vote);
      setReviewActivity((currentReview) => ({
        ...(currentReview || selectedReview),
        ...result,
      }));
    } catch (error) {
      setActionError(
        error.response?.data?.message || error.message || "Unable to update your vote."
      );
    } finally {
      setPendingVote("");
    }
  };

  const submitReply = async (reviewId, parentReplyId, comment) => {
    if (!comment || submittingReply) return false;
    setSubmittingReply(true);
    setActionError("");
    try {
      const reply = await replyToProductReview(reviewId, comment, parentReplyId);
      const appendReply = (currentReplies) =>
        parentReplyId
          ? appendReplyToThread(currentReplies, parentReplyId, reply)
          : [...currentReplies, reply];

      setProductReviews((currentReviews) =>
        currentReviews.map((productReview) =>
          productReview.id === reviewId
            ? { ...productReview, replies: appendReply(productReview.replies || []) }
            : productReview
        )
      );
      if (reviewId === selectedReview.id) {
        setReviewActivity((currentReview) => {
          const current = currentReview || selectedReview;
          return { ...current, replies: appendReply(current.replies || []) };
        });
      }
      return true;
    } catch (error) {
      setActionError(
        error.response?.data?.message || error.message || "Unable to submit your reply."
      );
      return false;
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReplySubmit = async (event) => {
    event.preventDefault();
    const comment = replyComment.trim();
    if (!comment || submittingReply) return;

    const submitted = await submitReply(selectedReview.id, null, comment);
    if (submitted) {
      setReplyComment("");
      setReplyFormOpen(false);
    }
  };

  const handleEditReply = async (reviewId, replyId, comment) => {
    if (pendingReplyMutation) return false;
    setPendingReplyMutation(true);
    setActionError("");
    try {
      const updatedReply = await updateProductReviewReply(reviewId, replyId, comment);
      setProductReviews((currentReviews) =>
        currentReviews.map((productReview) =>
          productReview.id === reviewId
            ? {
                ...productReview,
                replies: updateReplyInThread(
                  productReview.replies || [],
                  replyId,
                  updatedReply
                ),
              }
            : productReview
        )
      );
      if (reviewId === selectedReview.id) {
        setReviewActivity((currentReview) =>
          currentReview
            ? {
                ...currentReview,
                replies: updateReplyInThread(
                  currentReview.replies || [],
                  replyId,
                  updatedReply
                ),
              }
            : currentReview
        );
      }
      return true;
    } catch (error) {
      setActionError(
        error.response?.data?.message || error.message || "Unable to update your reply."
      );
      return false;
    } finally {
      setPendingReplyMutation(false);
    }
  };

  const handleDeleteReply = async (reviewId, replyId) => {
    if (!window.confirm("Delete this reply and its nested replies?")) return;
    if (pendingReplyMutation) return;

    setPendingReplyMutation(true);
    setActionError("");
    try {
      await deleteProductReviewReply(reviewId, replyId);
      setProductReviews((currentReviews) =>
        currentReviews.map((productReview) =>
          productReview.id === reviewId
            ? {
                ...productReview,
                replies: removeReplyFromThread(productReview.replies || [], replyId),
              }
            : productReview
        )
      );
      if (reviewId === selectedReview.id) {
        setReviewActivity((currentReview) =>
          currentReview
            ? {
                ...currentReview,
                replies: removeReplyFromThread(currentReview.replies || [], replyId),
              }
            : currentReview
        );
      }
    } catch (error) {
      setActionError(
        error.response?.data?.message || error.message || "Unable to delete your reply."
      );
    } finally {
      setPendingReplyMutation(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review and all associated replies?")) return;
    setActionError("");
    try {
      await deleteAdminReview(reviewId);
      setProductReviews((currentReviews) =>
        currentReviews.filter((productReview) => productReview.id !== reviewId)
      );
      if (reviewId === selectedReview.id) {
        setReviewActivity(null);
        setSelectedReview(null);
        navigateTo("reviews");
      }
    } catch (error) {
      setActionError(
        error.response?.data?.message || error.message || "Unable to delete this review."
      );
    }
  };

  const handleContextMenuAction = () => {
    if (!contextMenu) return;
    const selectedAction = contextMenu;
    setContextMenu(null);

    if (selectedAction.type === "review") {
      handleDeleteReview(selectedAction.reviewId);
      return;
    }

    if (selectedAction.type === "reply") {
      setEditingReplyId(selectedAction.replyId);
      setEditingReplyComment(selectedAction.comment);
      setActionError("");
    }
  };

  const handleContextMenuDelete = () => {
    if (!contextMenu || contextMenu.type !== "reply") return;
    const { reviewId, replyId } = contextMenu;
    setContextMenu(null);
    handleDeleteReply(reviewId, replyId);
  };

  const cancelReplyEdit = () => {
    setEditingReplyId("");
    setEditingReplyComment("");
  };

  if (!selectedReview) {
    return (
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">Review details are unavailable.</p>
        <button
          type="button"
          onClick={() => navigateTo("reviews")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Reviews
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigateTo("reviews")}
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Reviews
      </button>

      <header>
        <h1 className="text-2xl font-bold text-gray-900">Review Details</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review submitted {formatReviewDate(review.createdAt)}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Reviewed product
          </h2>
          <div className="mt-4 flex items-center gap-4">
            {review.productImage ? (
              <img
                src={review.productImage}
                alt=""
                className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                <Image className="h-6 w-6" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{review.productName}</p>
              <p className="mt-1 break-all text-xs text-gray-500">
                Product ID: {review.productId || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Reviewer
          </h2>
          <p className="mt-4 font-semibold text-gray-900">{review.userName}</p>
          <p className="mt-1 text-sm text-gray-500">{review.userEmail || "—"}</p>
          <p className="mt-3 text-xs text-gray-500">
            Order ID: <span className="break-all">{review.orderId || "—"}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Review ID: <span className="break-all">{review.id}</span>
          </p>
        </div>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        onContextMenu={(event) =>
          openContextMenu(event, { type: "review", reviewId: selectedReview.id })
        }
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Customer feedback
        </h2>
        <div
          className="mt-4 flex items-center gap-0.5 text-amber-500"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${
                index < review.rating ? "fill-current" : "text-gray-200"
              }`}
            />
          ))}
          <span className="ml-2 text-sm font-medium text-gray-700">
            {review.rating} out of 5
          </span>
        </div>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
          {review.comment}
        </p>
        {review.media.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {review.media.map((media, index) => (
              <a
                key={`${media.url}-${index}`}
                href={media.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-gray-50"
              >
                {media.type === "video" ? "View video attachment" : "View photo attachment"}
              </a>
            ))}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-2 text-xs font-medium text-gray-500">
          <button
            type="button"
            onClick={() => handleVote("like")}
            disabled={Boolean(pendingVote) || activityLoading}
            aria-pressed={userVote === "like"}
            className={`inline-flex cursor-pointer items-center gap-1.5 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${
              userVote === "like" ? "text-blue-700" : ""
            }`}
          >
            <ThumbsUp size={15} aria-hidden="true" />
            Like{likes ? ` ${likes}` : ""}
          </button>
          <button
            type="button"
            onClick={() => handleVote("dislike")}
            disabled={Boolean(pendingVote) || activityLoading}
            aria-pressed={userVote === "dislike"}
            className={`inline-flex cursor-pointer items-center gap-1.5 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${
              userVote === "dislike" ? "text-blue-700" : ""
            }`}
          >
            <ThumbsDown size={15} aria-hidden="true" />
            Dislike{dislikes ? ` ${dislikes}` : ""}
          </button>
          <button
            type="button"
            aria-expanded={replyFormOpen}
            onClick={() => {
              setReplyFormOpen((isOpen) => !isOpen);
              setReplyComment("");
              setActionError("");
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 hover:text-gray-900"
          >
            <MessageCircle size={15} aria-hidden="true" />
            Reply
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Replies to this review
        </h2>
        {activityLoading && (
          <p className="mt-3 text-sm text-gray-500" role="status">Loading replies...</p>
        )}
        {activityError && (
          <p className="mt-3 text-sm text-red-600" role="alert">{activityError}</p>
        )}
        {actionError && (
          <p className="mt-3 text-sm text-red-600" role="alert">{actionError}</p>
        )}

        {!activityLoading && (
          <div className="mt-4 space-y-4">
            {replies.length ? (
              replies.map((reply) => (
                <ReviewReply
                  key={reply.id}
                  reply={reply}
                  reviewId={selectedReview.id}
                  adminUserId={adminUserId}
                  onReply={submitReply}
                  onOpenContextMenu={openContextMenu}
                  editingReplyId={editingReplyId}
                  editingReplyComment={editingReplyComment}
                  setEditingReplyComment={setEditingReplyComment}
                  onEdit={handleEditReply}
                  onCancelEdit={cancelReplyEdit}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">
                {activityError ? "Unable to display existing replies." : "No replies yet."}
              </p>
            )}
          </div>
        )}

        {replyFormOpen && (
          <form
            onSubmit={handleReplySubmit}
            className="mt-2 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2"
          >
            <label htmlFor="admin-review-reply" className="sr-only">
              Reply to {review.userName}
            </label>
            <input
              id="admin-review-reply"
              type="text"
              value={replyComment}
              onChange={(event) => setReplyComment(event.target.value)}
              maxLength={1000}
              required
              placeholder={`Reply to ${review.userName}...`}
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={!replyComment.trim() || submittingReply || activityLoading}
              className="shrink-0 cursor-pointer rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingReply ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Other reviews for this product
        </h2>
        {activityLoading ? (
          <p className="mt-4 text-sm text-gray-500" role="status">
            Loading product reviews...
          </p>
        ) : !productReviews.length && activityError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            Unable to load reviews for this product.
          </p>
        ) : otherProductReviews.length ? (
          <div className="mt-4 space-y-5">
            {otherProductReviews.map((productReview) => (
              <article
                key={productReview.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                onContextMenu={(event) =>
                  openContextMenu(event, {
                    type: "review",
                    reviewId: productReview.id,
                  })
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {productReview.userName}
                    </p>
                    <time
                      className="text-xs text-gray-500"
                      dateTime={productReview.createdAt}
                    >
                      {formatReviewDate(productReview.createdAt)}
                    </time>
                  </div>
                  <div
                    className="flex items-center gap-0.5 text-amber-500"
                    aria-label={`${productReview.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`h-3.5 w-3.5 ${
                          index < productReview.rating
                            ? "fill-current"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                  {productReview.comment}
                </p>
                {productReview.media?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {productReview.media.map((media, index) => (
                      <a
                        key={`${media.url}-${index}`}
                        href={media.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        {media.type === "video" ? "View video" : "View photo"}
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-4 border-t border-gray-200 pt-3">
                  <p className="text-xs font-semibold text-gray-600">
                    Replies
                  </p>
                  {productReview.replies?.length > 0 ? (
                    <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                      {productReview.replies.map((reply) => (
                        <ReviewReply
                          key={reply.id}
                          reply={reply}
                          reviewId={productReview.id}
                          adminUserId={adminUserId}
                          onReply={submitReply}
                          onOpenContextMenu={openContextMenu}
                          editingReplyId={editingReplyId}
                          editingReplyComment={editingReplyComment}
                          setEditingReplyComment={setEditingReplyComment}
                          onEdit={handleEditReply}
                          onCancelEdit={cancelReplyEdit}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">
                      No replies on this review.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No other reviews for this product.
          </p>
        )}
      </section>

      {contextMenu && (
        <div
          role="menu"
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="fixed z-50 min-w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
        >
          {contextMenu.type === "review" ? (
            <button
              type="button"
              role="menuitem"
              onClick={handleContextMenuAction}
              className="w-full cursor-pointer px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete review and replies
            </button>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={handleContextMenuAction}
                className="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit reply
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={pendingReplyMutation}
                onClick={handleContextMenuDelete}
                className="w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete reply
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
