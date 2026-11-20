import { useEffect, useMemo, useState } from "react";
import { Image, Search, Star } from "lucide-react";
import { getAdminReviews } from "../../../services/adminReview.api.js";
import { subscribeToLiveUpdates } from "../../../services/liveUpdates.api.js";
import { useAdmin } from "../../contex/AdminContext.jsx";

function formatReviewDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function ReviewsPage() {
  const { navigateTo } = useAdmin();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      try {
        const loadedReviews = await getAdminReviews();
        if (active) {
          setReviews(loadedReviews);
          setLoadError("");
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error.response?.data?.message || error.message || "Unable to load reviews."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReviews();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "reviews:changed") loadReviews();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const filteredReviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return reviews;

    return reviews.filter((review) =>
      [
        review.userName,
        review.userEmail,
        review.productName,
        review.comment,
        review.orderId,
      ].some((value) => String(value).toLowerCase().includes(query))
    );
  }, [reviews, searchTerm]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Customer feedback and the products they reviewed.
          </p>
        </div>
        <div className="text-sm font-medium text-gray-500">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </div>
      </header>

      <label className="flex max-w-md items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search reviews, customers, or products"
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          aria-label="Search reviews"
        />
      </label>

      {loadError && <p className="text-sm text-red-600" role="alert">{loadError}</p>}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Rating &amp; review</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-sm text-gray-500">
                    Loading reviews...
                  </td>
                </tr>
              ) : filteredReviews.length ? (
                filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View review by ${review.userName} for ${review.productName}`}
                    onClick={() => navigateTo("review-details", { review })}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigateTo("review-details", { review });
                      }
                    }}
                    className="cursor-pointer align-top hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{review.userName}</p>
                      <p className="mt-1 text-xs text-gray-500">{review.userEmail || "—"}</p>
                      {review.orderId && (
                        <p className="mt-1 text-[10px] text-gray-400">
                          Order {review.orderId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {review.productImage ? (
                          <img
                            src={review.productImage}
                            alt=""
                            className="h-10 w-10 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                            <Image className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{review.productName}</span>
                      </div>
                    </td>
                    <td className="max-w-lg px-4 py-4">
                      <div
                        className="flex items-center gap-0.5 text-amber-500"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={`h-3.5 w-3.5 ${
                              index < review.rating ? "fill-current" : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-gray-700">
                        {review.comment}
                      </p>
                      {review.media.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {review.media.map((media, index) => (
                            <a
                              key={`${media.url}-${index}`}
                              href={media.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              {media.type === "video" ? "View video" : "View photo"}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-500">
                      {formatReviewDate(review.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-sm text-gray-500">
                    {reviews.length ? "No reviews match your search." : "No product reviews yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
