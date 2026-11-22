import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  MessageSquareText,
  Star,
  Video,
  X,
} from "lucide-react";
import {
  getReviewEligibility,
  submitProductReview,
} from "../services/review.api.js";
import "./ProductReviewPage.responsive.css";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function ReviewMedia({ media }) {
  return media.map((item, index) => (
    item.type === "video" ? (
      <video
        key={`${item.url}-${index}`}
        src={item.url}
        controls
        className="max-h-80 max-w-full rounded-lg"
      />
    ) : (
      <img
        key={`${item.url}-${index}`}
        src={item.url}
        alt={`Customer review attachment ${index + 1}`}
        className="max-h-80 max-w-full rounded-lg object-contain"
      />
    )
  ));
}

export default function ProductReviewPage() {
  const { orderId, productId } = useParams();
  const navigate = useNavigate();
  const [eligibility, setEligibility] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [media, setMedia] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getReviewEligibility(orderId, productId)
      .then((result) => {
        if (active) {
          setEligibility(result);
          setRating(result.review?.rating || 5);
          setComment(result.review?.comment || "");
        }
      })
      .catch((requestError) => {
        if (active) {
          setLoadError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load this review."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [orderId, productId]);

  const handleMediaChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");

    if (media.length + files.length > MAX_FILES) {
      setError("You can attach up to 3 photos or videos.");
      return;
    }

    const invalidFile = files.find(
      (file) =>
        (!file.type.startsWith("image/") && !file.type.startsWith("video/")) ||
        file.size > MAX_FILE_SIZE
    );
    if (invalidFile) {
      setError(
        invalidFile.size > MAX_FILE_SIZE
          ? "Each photo or video must be 10 MB or smaller."
          : "Attachments must be photos or videos."
      );
      return;
    }

    setMedia((currentMedia) => [...currentMedia, ...files]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!comment.trim()) {
      setError("Please add a comment to your review.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitProductReview({
        orderId,
        productId,
        rating,
        comment: comment.trim(),
        media,
      });
      navigate(`/product/${productId}#reviews`, { replace: true });
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          submitError.message ||
          "Unable to submit your review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="product-review-page min-h-[70vh] bg-stone-50 px-5 py-10 sm:px-8 max-[621px]:px-3 max-[621px]:py-6">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft size={16} />
          Back to orders
        </Link>

        {loadError ? (
          <p role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {loadError}
          </p>
        ) : !eligibility ? (
          <p role="status" className="mt-8 rounded-xl bg-white p-8 text-center text-sm text-stone-500">
            Loading review details...
          </p>
        ) : (
          <section className="product-review-card mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="product-review-product-header flex items-center gap-4 border-b border-stone-100 bg-gradient-to-r from-amber-50/80 to-white p-6 sm:p-8 max-[621px]:gap-3 max-[621px]:p-4">
              {eligibility.product.image && (
                <img
                  src={eligibility.product.image}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-2xl border border-white bg-white object-contain p-1 shadow-sm max-[621px]:h-16 max-[621px]:w-16"
                />
              )}
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  <CheckCircle2 size={14} />
                  Verified delivery
                </p>
                <h1 className="mt-2 break-words font-serif text-2xl font-semibold leading-tight text-stone-900 sm:text-3xl max-[621px]:text-xl">
                  {eligibility.product.title}
                </h1>
                {!eligibility.review && (
                  <p className="mt-1 text-sm text-stone-600">
                    Your experience helps others shop with confidence.
                  </p>
                )}
              </div>
            </div>

            {eligibility.review ? (
              <div className="product-review-submitted pt-6">
                <p className="font-semibold text-stone-900">Your review has been submitted</p>
                <div className="mt-3 flex items-center gap-1" aria-label={`${eligibility.review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={20}
                      className={index < eligibility.review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}
                    />
                  ))}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                  {eligibility.review.comment}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ReviewMedia media={eligibility.review.media || []} />
                </div>
              </div>
            ) : (
              <form className="product-review-form space-y-5 p-6 sm:p-8 max-[621px]:space-y-4 max-[621px]:p-4" onSubmit={handleSubmit}>
                <fieldset className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 max-[621px]:p-3">
                  <legend className="sr-only">Your rating</legend>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        How would you rate it?
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        Choose a star rating from 1 to 5
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-800 shadow-sm">
                      {RATING_LABELS[rating]}
                    </span>
                  </div>
                  <div className="mt-3 flex w-full max-w-full gap-1 sm:gap-2" role="group" aria-label="Choose a star rating">
                    {Array.from({ length: 5 }, (_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-label={`${value} star${value === 1 ? "" : "s"}`}
                          aria-pressed={rating === value}
                          onClick={() => setRating(value)}
                          className="rounded-lg p-1 text-amber-400 transition hover:scale-110 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 sm:p-1.5"
                        >
                          <Star
                            size={24}
                            strokeWidth={1.8}
                            className={`h-6 w-6 sm:h-8 sm:w-8 ${value <= rating ? "fill-current" : "text-amber-200"}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="block rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 max-[621px]:p-4">
                  <span className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                    <MessageSquareText size={17} className="text-stone-500" />
                    Tell us about your experience
                  </span>
                  <span className="mt-1 block text-xs text-stone-500">
                    What did you like? How did the product work for you?
                  </span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={2000}
                    required
                    rows={5}
                    className="mt-4 w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                    placeholder="Share the details that might help another customer..."
                  />
                  <span className="mt-2 block text-right text-xs text-stone-500">
                    {comment.length}/2000 characters
                  </span>
                </label>

                <section
                  aria-labelledby="review-media-heading"
                  className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 p-5 sm:p-6 max-[621px]:p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 id="review-media-heading" className="text-sm font-semibold text-stone-900">
                        Add photos or a video
                      </h2>
                      <p className="mt-1 text-xs text-stone-500">
                        Optional · Up to 3 files · 10 MB each
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
                      {media.length}/{MAX_FILES} selected
                    </span>
                  </div>
                  <label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-5 text-center transition hover:border-amber-400 hover:bg-amber-50/50 focus-within:ring-2 focus-within:ring-amber-400">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                      <ImagePlus size={20} />
                    </span>
                    <span className="mt-2 text-sm font-semibold text-stone-800">
                      Choose photos or videos
                    </span>
                    <span className="mt-1 text-xs text-stone-500">
                      JPG, PNG, GIF or video files
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaChange}
                      disabled={media.length >= MAX_FILES}
                      className="sr-only"
                    />
                  </label>
                  {media.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {media.map((file, index) => (
                        <li
                          key={`${file.name}-${file.lastModified}`}
                          className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 shadow-sm"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                            {file.type.startsWith("video/") ? <Video size={16} /> : <ImagePlus size={16} />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{file.name}</span>
                          <span className="shrink-0 text-xs text-stone-400">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${file.name}`}
                            onClick={() => setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            className="rounded-full p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full cursor-pointer rounded-xl bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-48"
                >
                  {submitting ? "Submitting..." : "Submit review"}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
