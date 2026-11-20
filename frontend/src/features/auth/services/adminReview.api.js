import { api } from "./auth.api.js";

export async function getAdminReviews() {
  const response = await api.get("/api/admin/reviews");
  if (!Array.isArray(response.data?.reviews)) {
    throw new Error("Unable to load reviews: invalid server response.");
  }

  return response.data.reviews.map((review) => ({
    id: String(review.id || ""),
    userName: review.userName || "Customer",
    userEmail: review.userEmail || "",
    productId: String(review.productId || ""),
    productName: review.productName || "Deleted product",
    productImage: review.productImage || "",
    orderId: String(review.orderId || ""),
    rating: Number(review.rating) || 0,
    comment: review.comment || "",
    media: Array.isArray(review.media) ? review.media : [],
    createdAt: review.createdAt || null,
  }));
}

export async function deleteAdminReview(reviewId) {
  await api.delete(`/api/admin/reviews/${encodeURIComponent(reviewId)}`);
}
