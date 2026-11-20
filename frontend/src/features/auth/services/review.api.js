import { api } from "./auth.api.js";

export async function getReviewEligibility(orderId, productId) {
  const response = await api.get(
    `/api/reviews/orders/${encodeURIComponent(orderId)}/products/${encodeURIComponent(productId)}`
  );
  const eligibility = response.data;

  if (
    eligibility?.eligible !== true ||
    !eligibility.product?.id ||
    !Object.prototype.hasOwnProperty.call(eligibility, "review")
  ) {
    throw new Error("Unable to load review details: invalid server response.");
  }

  return eligibility;
}

export async function getProductReviews(productId) {
  const response = await api.get(
    `/api/reviews/products/${encodeURIComponent(productId)}`
  );
  if (!Array.isArray(response.data?.reviews)) {
    throw new Error("Unable to load product reviews: invalid server response.");
  }
  return response.data.reviews;
}

export async function voteOnProductReview(reviewId, vote) {
  const response = await api.post(
    `/api/reviews/${encodeURIComponent(reviewId)}/vote`,
    { vote }
  );
  const result = response.data;
  if (
    !Number.isInteger(result?.likes) ||
    !Number.isInteger(result?.dislikes) ||
    ![null, "like", "dislike"].includes(result?.userVote)
  ) {
    throw new Error("Unable to update vote: invalid server response.");
  }
  return result;
}

export async function replyToProductReview(reviewId, comment, parentReplyId = null) {
  const response = await api.post(
    `/api/reviews/${encodeURIComponent(reviewId)}/replies`,
    { comment, parentReplyId }
  );
  if (!response.data?.reply?.id) {
    throw new Error("Unable to submit reply: invalid server response.");
  }
  return response.data.reply;
}

export async function updateProductReview(reviewId, { rating, comment }) {
  const response = await api.patch(
    `/api/reviews/${encodeURIComponent(reviewId)}`,
    { rating, comment }
  );
  if (!response.data?.review?.id) {
    throw new Error("Unable to update review: invalid server response.");
  }
  return response.data.review;
}

export async function deleteProductReview(reviewId) {
  await api.delete(`/api/reviews/${encodeURIComponent(reviewId)}`);
}

export async function updateProductReviewReply(reviewId, replyId, comment) {
  const response = await api.patch(
    `/api/reviews/${encodeURIComponent(reviewId)}/replies/${encodeURIComponent(replyId)}`,
    { comment }
  );
  if (!response.data?.reply?.id) {
    throw new Error("Unable to update reply: invalid server response.");
  }
  return response.data.reply;
}

export async function deleteProductReviewReply(reviewId, replyId) {
  await api.delete(
    `/api/reviews/${encodeURIComponent(reviewId)}/replies/${encodeURIComponent(replyId)}`
  );
}

export async function submitProductReview({
  orderId,
  productId,
  rating,
  comment,
  media,
}) {
  const formData = new FormData();
  formData.append("rating", String(rating));
  formData.append("comment", comment);
  media.forEach((file) => formData.append("media", file));

  const response = await api.post(
    `/api/reviews/orders/${encodeURIComponent(orderId)}/products/${encodeURIComponent(productId)}`,
    formData
  );
  if (!response.data?.review?.id) {
    throw new Error("Review submission failed: invalid server response.");
  }
  return response.data.review;
}
