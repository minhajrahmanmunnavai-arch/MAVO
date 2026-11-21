import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Heart,
  MessageCircle,
  Minus,
  Pencil,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import Footer from "../components/Main/Footer/Footer.jsx";
import { getProductById } from "../services/productupload.api.js";
import { subscribeToLiveUpdates } from "../services/liveUpdates.api.js";
import { useWishlist } from "../Hooks/useWishlist.js";
import { useCart } from "../Hooks/useCart.js";
import {
  getProductReviews,
  deleteProductReview,
  deleteProductReviewReply,
  replyToProductReview,
  updateProductReview,
  updateProductReviewReply,
  voteOnProductReview,
} from "../services/review.api.js";
import { useAuth } from "../Hooks/useAuth.js";
import "./ProductDetails.responsive.css";

const formatPrice = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? `৳${number.toFixed(2)}`
    : "Price unavailable";
};

const formatReviewAge = (value, now) => {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return "";

  const elapsedMinutes = Math.max(
    0,
    Math.floor((now - createdAt.getTime()) / (60 * 1000))
  );
  if (elapsedMinutes < 2) return "Just now";
  if (elapsedMinutes < 60) return `${Math.floor(elapsedMinutes / 2) * 2}min`;
  if (elapsedMinutes < 24 * 60) return `${Math.floor(elapsedMinutes / 60)}hr`;

  return createdAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: createdAt.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
};

const getReviewInitials = (name) =>
  String(name || "Customer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const appendReplyToThread = (replies, parentReplyId, newReply) =>
  replies.map((reply) =>
    reply.id === parentReplyId
      ? { ...reply, replies: [...(reply.replies || []), newReply] }
      : {
          ...reply,
          replies: appendReplyToThread(reply.replies || [], parentReplyId, newReply),
        }
  );

const updateReplyInThread = (replies, replyId, update) =>
  replies.map((reply) =>
    reply.id === replyId
      ? { ...reply, ...update }
      : { ...reply, replies: updateReplyInThread(reply.replies || [], replyId, update) }
  );

const removeReplyFromThread = (replies, replyId) =>
  replies
    .filter((reply) => reply.id !== replyId)
    .map((reply) => ({
      ...reply,
      replies: removeReplyFromThread(reply.replies || [], replyId),
    }));

const findReplyInThread = (replies, replyId) => {
  for (const reply of replies) {
    if (reply.id === replyId) return reply;
    const nestedReply = findReplyInThread(reply.replies || [], replyId);
    if (nestedReply) return nestedReply;
  }
  return null;
};

const PRODUCT_META_SELECTORS = [
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:image"]',
  'meta[property="og:url"]',
  'meta[property="og:type"]',
  'meta[name="twitter:card"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
  'meta[name="twitter:image"]',
];

const setMetaTagContent = (attribute, key, content) => {
  const selector = `meta[${attribute}="${key}"]`;
  const matches = Array.from(document.head.querySelectorAll(selector));
  let meta = matches.shift();

  matches.forEach((duplicate) => duplicate.remove());
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
};

const setMetaContent = (name, content) =>
  setMetaTagContent("name", name, content);

const setMetaProperty = (property, content) =>
  setMetaTagContent("property", property, content);

const removeMetaTag = (attribute, key) => {
  document.head
    .querySelectorAll(`meta[${attribute}="${key}"]`)
    .forEach((meta) => meta.remove());
};

const setCanonicalUrl = (href) => {
  const matches = Array.from(
    document.head.querySelectorAll('link[rel="canonical"]')
  );
  let canonical = matches.shift();
  matches.forEach((duplicate) => duplicate.remove());
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", href);
};

const getAbsoluteHttpUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim(), window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
};

const getStructuredProductPrice = (product) => {
  const regularPrice = Number(product.price);
  const discountPrice = Number(product.discountPrice);
  const hasValidDiscount =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice !== "" &&
    Number.isFinite(regularPrice) &&
    regularPrice > 0 &&
    Number.isFinite(discountPrice) &&
    discountPrice >= 0 &&
    discountPrice < regularPrice;

  if (!Number.isFinite(regularPrice) || regularPrice < 0) return null;
  return hasValidDiscount ? discountPrice : regularPrice;
};

const removeProductStructuredData = () => {
  document.head
    .querySelectorAll('script[data-product-json-ld="true"]')
    .forEach((script) => script.remove());
};

const setProductStructuredData = (product, canonicalUrl) => {
  const scripts = Array.from(
    document.head.querySelectorAll('script[data-product-json-ld="true"]')
  );
  let script = scripts.shift();
  scripts.forEach((duplicate) => duplicate.remove());

  const imageUrl = getAbsoluteHttpUrl(product.mainImage);
  const price = getStructuredProductPrice(product);
  const stock = Number(product.stock);
  const name = typeof product.title === "string" ? product.title.trim() : "";
  const sku = typeof product.sku === "string" ? product.sku.trim() : "";

  if (
    !name ||
    !sku ||
    !imageUrl ||
    price === null ||
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    script?.remove();
    return;
  }

  const description =
    product.seoDescription?.trim() || product.description?.trim() || "";
  const brandName =
    typeof product.brandName === "string" ? product.brandName.trim() : "";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: [imageUrl],
    url: canonicalUrl,
    sku,
    ...(brandName
      ? { brand: { "@type": "Brand", name: brandName } }
      : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      price,
      priceCurrency: "BDT",
      availability:
        stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  if (!script) {
    script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.setAttribute("data-product-json-ld", "true");
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData).replace(/</g, "\\u003c");
};

const restoreHeadElement = (selector, originalElement) => {
  document.head.querySelectorAll(selector).forEach((element) => element.remove());
  if (originalElement) document.head.appendChild(originalElement);
};

const ProductDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart: addProductToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [reviews, setReviews] = useState([]);
  const reviewsRequestId = useRef(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewTimestampNow, setReviewTimestampNow] = useState(() => Date.now());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [reviewActionError, setReviewActionError] = useState("");
  const [pendingReviewAction, setPendingReviewAction] = useState("");
  const [focusedReviewId, setFocusedReviewId] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [reviewDeleteConfirmation, setReviewDeleteConfirmation] = useState(null);
  const [outOfStockPopupOpen, setOutOfStockPopupOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewComment, setEditReviewComment] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyComment, setEditReplyComment] = useState("");
  const activeUserId = String(user?._id || user?.id || "");
  const productPath = product
    ? `/product/${encodeURIComponent(product.slug || product._id)}`
    : `/product/${encodeURIComponent(id)}`;
  const isWishlisted = wishlist.some(
    (item) => String(item.id) === String(product?._id)
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReviewTimestampNow(Date.now());
    }, 2 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchProduct = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError("");
      if (showLoading) setProduct(null);

      try {
        const fetchedProduct = await getProductById(id);
        if (active) {
          setProduct(fetchedProduct);
          setQuantity(1);
        }
      } catch (fetchError) {
        if (active) {
          setError(
            fetchError.response?.status === 404
              ? "Product not found."
              : fetchError.response?.data?.message ||
                  fetchError.message ||
                  "Unable to load this product. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProduct();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "products:changed") fetchProduct(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    const originalTitle = document.title;
    const originalMetaTags = PRODUCT_META_SELECTORS.map((selector) => [
      selector,
      Array.from(
        document.head.querySelectorAll(selector),
        (meta) => meta.cloneNode(true)
      ),
    ]);
    const originalCanonical =
      document.head.querySelector('link[rel="canonical"]')?.cloneNode(true) || null;
    const originalStructuredData =
      document.head
        .querySelector('script[data-product-json-ld="true"]')
        ?.cloneNode(true) || null;

    return () => {
      document.title = originalTitle;
      originalMetaTags.forEach(([selector, originalTags]) => {
        document.head.querySelectorAll(selector).forEach((meta) => meta.remove());
        originalTags.forEach((meta) => document.head.appendChild(meta));
      });
      restoreHeadElement('link[rel="canonical"]', originalCanonical);
      restoreHeadElement(
        'script[data-product-json-ld="true"]',
        originalStructuredData
      );
    };
  }, []);

  useEffect(() => {
    const isPublished =
      product &&
      (String(product._id) === String(id) || product.slug === id) &&
      product.published !== false &&
      product.isPublished !== false &&
      product.status !== "draft" &&
      product.status !== "unpublished";
    const shouldIndex = Boolean(!loading && !error && isPublished);

    if (!shouldIndex) {
      document.title = error ? "Product unavailable | MAVO" : "Loading product | MAVO";
      setMetaContent("robots", "noindex, nofollow");
      PRODUCT_META_SELECTORS
        .filter((selector) => !selector.includes('name="robots"'))
        .forEach((selector) => {
          document.head.querySelectorAll(selector).forEach((meta) => meta.remove());
        });
      document.head.querySelector('link[rel="canonical"]')?.remove();
      removeProductStructuredData();
      return;
    }

    const title = product.seoTitle?.trim() || product.title;
    const description =
      product.seoDescription?.trim() || product.description || "";
    const canonicalSlug = product.slug || product._id;
    const canonicalUrl =
      `${window.location.origin}/product/${encodeURIComponent(canonicalSlug)}`;

    document.title = title;
    setMetaContent("description", description);
    setMetaContent("robots", "index, follow");

    setCanonicalUrl(canonicalUrl);
    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);
    setMetaProperty("og:url", canonicalUrl);
    setMetaProperty("og:type", "product");
    setMetaContent("twitter:card", "summary_large_image");
    setMetaContent("twitter:title", title);
    setMetaContent("twitter:description", description);

    const imageUrl = getAbsoluteHttpUrl(product.mainImage);
    if (imageUrl) {
      setMetaProperty("og:image", imageUrl);
      setMetaContent("twitter:image", imageUrl);
    } else {
      removeMetaTag("property", "og:image");
      removeMetaTag("name", "twitter:image");
    }
    setProductStructuredData(product, canonicalUrl);
  }, [error, id, loading, product]);

  useEffect(() => {
    const productId = product?._id;
    if (!productId) {
      setReviews([]);
      setReviewsError("");
      setReviewsLoading(false);
      return undefined;
    }

    setReviews([]);
    setReviewsError("");
    setReviewsLoading(true);

    const loadReviews = async () => {
      const currentRequestId = ++reviewsRequestId.current;
      try {
        const loadedReviews = await getProductReviews(productId);
        if (currentRequestId === reviewsRequestId.current) {
          setReviews(loadedReviews);
          setReviewsError("");
        }
      } catch (reviewError) {
        if (currentRequestId === reviewsRequestId.current) {
          setReviewsError(
            reviewError.response?.data?.message ||
              reviewError.message ||
              "Unable to load reviews."
          );
        }
      } finally {
        if (currentRequestId === reviewsRequestId.current) setReviewsLoading(false);
      }
    };

    loadReviews();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "reviews:changed") loadReviews();
    });

    return () => {
      reviewsRequestId.current += 1;
      unsubscribe();
    };
  }, [product?._id]);

  useEffect(() => {
    if (!location.hash || loading || reviewsLoading) return undefined;

    const anchorId = location.hash.slice(1);
    const reviewId = anchorId.startsWith("review-")
      ? anchorId.slice("review-".length)
      : "";
    const frameId = window.requestAnimationFrame(() => {
      const target = document.getElementById(anchorId) ||
        document.getElementById("reviews");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusedReviewId(reviewId);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash, loading, reviewsLoading]);

  useEffect(() => {
    if (!contextMenu) return undefined;
    const closeMenu = () => setContextMenu(null);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!reviewDeleteConfirmation || pendingReviewAction) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setReviewDeleteConfirmation(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingReviewAction, reviewDeleteConfirmation]);

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const handleReviewVote = async (reviewId, vote) => {
    if (!user || pendingReviewAction) return;

    setPendingReviewAction(`${reviewId}:${vote}`);
    setReviewActionError("");
    try {
      const result = await voteOnProductReview(reviewId, vote);
      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId ? { ...review, ...result } : review
        )
      );
    } catch (actionError) {
      setReviewActionError(
        actionError.response?.data?.message ||
          actionError.message ||
          "Unable to update your reaction."
      );
    } finally {
      setPendingReviewAction("");
    }
  };

  const handleReplySubmit = async (event, reviewId, parentReplyId = null) => {
    event.preventDefault();
    const comment = replyText.trim();
    if (!comment || !user || pendingReviewAction) return;

    setPendingReviewAction(`${reviewId}:reply`);
    setReviewActionError("");
    try {
      const reply = await replyToProductReview(reviewId, comment, parentReplyId);
      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                replies: parentReplyId
                  ? appendReplyToThread(review.replies || [], parentReplyId, reply)
                  : [...(review.replies || []), reply],
              }
            : review
        )
      );
      setReplyText("");
      setReplyingTo(null);
    } catch (actionError) {
      setReviewActionError(
        actionError.response?.data?.message ||
          actionError.message ||
          "Unable to submit your reply."
      );
    } finally {
      setPendingReviewAction("");
    }
  };

  const handleReviewUpdate = async (event, review) => {
    event.preventDefault();
    if (!editReviewComment.trim() || pendingReviewAction) return;

    setPendingReviewAction(`${review.id}:edit`);
    setReviewActionError("");
    try {
      const updatedReview = await updateProductReview(review.id, {
        rating: editReviewRating,
        comment: editReviewComment,
      });
      setReviews((current) =>
        current.map((item) =>
          item.id === review.id ? { ...item, ...updatedReview } : item
        )
      );
      setEditingReviewId(null);
    } catch (actionError) {
      setReviewActionError(
        actionError.response?.data?.message ||
          actionError.message ||
          "Unable to update your review."
      );
    } finally {
      setPendingReviewAction("");
    }
  };

  const handleReviewDelete = async (reviewId) => {
    setPendingReviewAction(`${reviewId}:delete`);
    setReviewActionError("");
    try {
      await deleteProductReview(reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setReviewDeleteConfirmation(null);
    } catch (actionError) {
      setReviewActionError(
        actionError.response?.data?.message ||
          actionError.message ||
          "Unable to delete your review."
      );
    } finally {
      setPendingReviewAction("");
    }
  };

  const handleReplyUpdate = async (event, reviewId, replyId) => {
    event.preventDefault();
    if (!editReplyComment.trim() || pendingReviewAction) return;
    setPendingReviewAction(`${replyId}:edit`);
    setReviewActionError("");
    try {
      const updatedReply = await updateProductReviewReply(
        reviewId,
        replyId,
        editReplyComment
      );
      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                replies: updateReplyInThread(review.replies || [], replyId, updatedReply),
              }
            : review
        )
      );
      setEditingReplyId(null);
    } catch (actionError) {
      setReviewActionError(
        actionError.response?.data?.message ||
          actionError.message ||
          "Unable to update your reply."
      );
    } finally {
      setPendingReviewAction("");
    }
  };

  const handleReplyDelete = async (reviewId, replyId) => {
    if (!window.confirm("Delete this reply and its nested replies?")) return;
    setPendingReviewAction(`${replyId}:delete`);
    setReviewActionError("");
    try {
      await deleteProductReviewReply(reviewId, replyId);
      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                replies: removeReplyFromThread(review.replies || [], replyId),
              }
            : review
        )
      );
    } catch (actionError) {
      setReviewActionError(
        actionError.response?.data?.message ||
          actionError.message ||
          "Unable to delete your reply."
      );
    } finally {
      setPendingReviewAction("");
    }
  };

  const regularPrice = Number(product?.price);
  const salePrice = Number(product?.discountPrice);
  const hasSalePrice =
    product?.discountPrice !== null &&
    product?.discountPrice !== undefined &&
    product?.discountPrice !== "" &&
    Number.isFinite(regularPrice) &&
    regularPrice > 0 &&
    Number.isFinite(salePrice) &&
    salePrice >= 0 &&
    salePrice < regularPrice;
  const discountPercentage =
    hasSalePrice &&
    Number.isFinite(regularPrice) &&
    regularPrice > 0 &&
    salePrice < regularPrice
      ? (((regularPrice - salePrice) / regularPrice) * 100).toFixed(2)
      : null;
  const stock = Number(product?.stock);
  const availableStock = Number.isFinite(stock) ? Math.max(0, stock) : 0;

  const toggleWishlist = async () => {
    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product);
      }
      setFeedback(
        isWishlisted ? "Removed from your wishlist." : "Added to your wishlist."
      );
    } catch (storageError) {
      console.error("Wishlist update error:", storageError);
      setFeedback("Unable to update your wishlist. Please try again.");
    }
  };

  const addToCart = async () => {
    if (availableStock === 0) {
      setOutOfStockPopupOpen(true);
      return;
    }

    try {
      await addProductToCart(product, quantity);
      setFeedback("Added to your shopping cart.");
    } catch (cartError) {
      console.error("Shopping cart update error:", cartError);
      setFeedback(cartError.message || "Unable to update your shopping cart. Please try again.");
    }
  };

  const renderReplyForm = (reviewId, parentReplyId, targetName) => (
    <form
      onSubmit={(event) => handleReplySubmit(event, reviewId, parentReplyId)}
      className="mt-2 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2"
    >
      <label className="sr-only" htmlFor={`review-reply-${reviewId}-${parentReplyId || "root"}`}>
        Reply to {targetName}
      </label>
      <input
        id={`review-reply-${reviewId}-${parentReplyId || "root"}`}
        value={replyText}
        onChange={(event) => setReplyText(event.target.value)}
        maxLength={1000}
        required
        placeholder={`Reply to ${targetName}...`}
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500 max-[421px]:text-[0.8125rem]"
      />
      <button
        type="submit"
        disabled={!replyText.trim() || Boolean(pendingReviewAction)}
        className="shrink-0 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 max-[421px]:text-[0.6875rem]"
      >
        {pendingReviewAction === `${reviewId}:reply` ? "Sending..." : "Send"}
      </button>
    </form>
  );

  const renderReply = (reply, reviewId) => (
    <div key={reply.id} className="min-w-0">
      <div className="flex items-start gap-2">
        <div
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700"
        >
          {getReviewInitials(reply.userName)}
        </div>
        <div className="min-w-0 flex-1">
          <div
            data-review-reply
            onContextMenu={(event) => {
              if (String(reply.userId) !== activeUserId) return;
              event.preventDefault();
              event.stopPropagation();
              setContextMenu({
                type: "reply",
                reviewId,
                replyId: reply.id,
                x: Math.min(event.clientX, window.innerWidth - 180),
                y: Math.min(event.clientY, window.innerHeight - 110),
              });
            }}
            className="rounded-xl bg-gray-50 px-3 py-2"
          >
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="text-xs font-semibold text-gray-900 max-[421px]:text-[0.8125rem]">{reply.userName}</span>
              <time
                className="text-[11px] text-gray-500"
                dateTime={reply.createdAt}
                title={new Date(reply.createdAt).toLocaleString()}
              >
                {formatReviewAge(reply.createdAt, reviewTimestampNow)}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 max-[421px]:text-[0.8125rem]">{reply.comment}</p>
          </div>
          {editingReplyId === reply.id ? (
            <form
              onSubmit={(event) => handleReplyUpdate(event, reviewId, reply.id)}
              className="mt-2 space-y-2"
            >
              <textarea
                value={editReplyComment}
                onChange={(event) => setEditReplyComment(event.target.value)}
                maxLength={1000}
                required
                rows={2}
                aria-label="Edit reply"
                className="w-full rounded-lg border border-gray-300 p-2 text-sm max-[421px]:text-[0.8125rem]"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!editReplyComment.trim() || Boolean(pendingReviewAction)}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 max-[421px]:text-[0.6875rem]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReplyId(null)}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold text-gray-600 max-[421px]:text-[0.6875rem]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3">
          {user && (
            <button
              type="button"
              onClick={() => {
                setReplyingTo((current) =>
                  current?.parentReplyId === reply.id && current?.reviewId === reviewId
                    ? null
                    : { reviewId, parentReplyId: reply.id, userName: reply.userName }
                );
                setReplyText("");
                setReviewActionError("");
              }}
              className="mt-1 cursor-pointer px-2 text-xs font-medium text-gray-500 hover:text-gray-900 max-[421px]:text-[0.6875rem]"
            >
              Reply
            </button>
          )}
            </div>
          )}
          {replyingTo?.reviewId === reviewId &&
            replyingTo.parentReplyId === reply.id &&
            renderReplyForm(reviewId, reply.id, reply.userName)}
          {reply.replies?.length > 0 && (
            <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
              {reply.replies.map((childReply) => renderReply(childReply, reviewId))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <main className="flex min-h-[50vh] items-center justify-center px-5">
          <div className="text-center" role="status">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
            <p className="mt-4 text-sm text-gray-500 max-[421px]:text-[0.8125rem]">Loading product details...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <main className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
          <h1 className="font-serif text-3xl font-semibold text-gray-900 max-[421px]:text-[clamp(1.25rem,5vw,1.5rem)]">
            {error || "Product not found."}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-gray-500 max-[421px]:text-[0.8125rem]">
            We couldn&apos;t load this product. It may have been removed or the
            connection may have failed.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black max-[421px]:text-[0.6875rem]"
          >
            <ArrowLeft size={16} />
            Back to shop
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="product-details-page bg-[#f8f7f4] px-5 py-10 text-gray-900 sm:px-8 sm:py-14 max-[421px]:px-3 max-[421px]:py-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/"
            className="mb-7 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900 max-[421px]:text-[0.6875rem]"
          >
            <ArrowLeft size={16} />
            Continue shopping
          </Link>

          <div className="product-overview-card grid gap-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-2 lg:gap-12 max-[421px]:gap-6 max-[421px]:rounded-xl max-[421px]:p-4">
            <div className="product-image-frame flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:min-h-96 max-[421px]:min-h-60">
              <img
                src={product.mainImage}
                alt={product.title}
                className="h-full max-h-136 w-full object-contain"
              />
            </div>

            <section className="product-info-panel flex min-w-0 flex-col py-1">
              <p className="break-words text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 max-[421px]:text-[0.625rem]">
                {product.brandName || product.shopName || product.category}
              </p>
              <h1 className="product-title mt-3 break-words font-serif text-3xl font-semibold tracking-tight sm:text-4xl max-[421px]:text-[clamp(1.25rem,5vw,1.5rem)] max-[421px]:leading-[1.1]">
                {product.title}
              </h1>

              <div className="product-metadata mt-5 space-y-1 text-sm text-gray-500 max-[421px]:text-[0.8125rem]">
                <p>Brand: <span className="text-gray-800">{product.brandName || "—"}</span></p>
                <p>Shop: <span className="text-gray-800">{product.shopName || "—"}</span></p>
                <p>Category: <span className="capitalize text-gray-800">{product.category || "—"}</span></p>
              </div>

              <div className="product-prices mt-6 flex flex-wrap items-baseline gap-3">
                <span className="text-base font-semibold max-[421px]:text-lg">
                  Regular Price: {formatPrice(product.price)}
                </span>
                {hasSalePrice && (
                  <span className="text-base font-semibold text-gray-500 max-[421px]:text-[0.8125rem]">
                    Discount Price: {formatPrice(product.discountPrice)}
                  </span>
                )}
                {discountPercentage !== null && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 max-[421px]:text-[0.6875rem]">
                    {discountPercentage}% off
                  </span>
                )}
              </div>

              <div className="product-description mt-5">
                <p className="text-sm font-semibold text-gray-800 max-[421px]:text-[clamp(1rem,4.3vw,1.125rem)]">
                  Description
                </p>
                <p className="mt-2 break-words whitespace-pre-line text-sm leading-7 text-gray-600 max-[421px]:text-[0.6875rem]">
                  {product.description || "No description available."}
                </p>
              </div>

              <p
                className={`product-stock mt-5 text-sm font-medium max-[421px]:text-[0.8125rem] ${
                  availableStock > 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {availableStock > 0
                  ? `${availableStock} available in stock`
                  : "Out of stock"}
              </p>

              <div className="product-actions mt-6 flex flex-wrap items-center gap-3 max-[421px]:grid max-[421px]:grid-cols-[auto_minmax(0,1fr)] max-[421px]:gap-2">
                <div className="inline-flex items-center rounded-lg border border-gray-200">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="p-3 text-gray-600 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-10 text-center text-sm font-semibold max-[421px]:text-[0.6875rem]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= availableStock}
                    onClick={() =>
                      setQuantity((current) => Math.min(availableStock, current + 1))
                    }
                    className="p-3 text-gray-600 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  className="inline-flex min-w-48 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black sm:flex-none max-[421px]:min-w-0 max-[421px]:px-2 max-[421px]:text-[0.6875rem]"
                >
                  <ShoppingBag size={17} />
                  Add to Cart
                </button>

                <div className="product-wishlist-row col-span-2 flex w-full justify-center">
                  <button
                    type="button"
                    onClick={toggleWishlist}
                    aria-pressed={isWishlisted}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition max-[421px]:w-full max-[421px]:text-[0.6875rem] ${
                      isWishlisted
                        ? "border-red-200 bg-red-50 text-red-600"
                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <Heart size={17} className={isWishlisted ? "fill-current" : ""} />
                    {isWishlisted ? "Saved" : "Wishlist"}
                  </button>
                </div>
              </div>

              {feedback && (
                <p className="mt-4 text-sm text-gray-600 max-[421px]:text-[0.8125rem]" role="status">
                  {feedback}
                </p>
              )}
            </section>
          </div>
          <section
            id="reviews"
            aria-labelledby="product-reviews-heading"
            className="product-reviews mt-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-5">
              <div>
                <h2 id="product-reviews-heading" className="font-serif text-2xl font-semibold text-gray-900 max-[421px]:text-[clamp(1rem,4.3vw,1.125rem)]">
                  Product reviews
                </h2>
                <p className="mt-1 text-sm text-gray-500 max-[421px]:text-[0.8125rem]">
                  Feedback from customers who received this product
                </p>
              </div>
              {reviews.length > 0 && (
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 max-[421px]:text-[0.8125rem]">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    {averageRating.toFixed(1)}
                    <span className="font-normal text-gray-500">
                      · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                    </span>
                  </p>
                </div>
              )}
            </div>
            {reviewsError ? (
              <p role="alert" className="pt-5 text-sm text-red-700 max-[421px]:text-[0.8125rem]">{reviewsError}</p>
            ) : reviews.length === 0 ? (
              <p className="pt-5 text-sm text-gray-500 max-[421px]:text-[0.8125rem]">No reviews yet. Be the first to share your experience.</p>
            ) : (
              <div className="space-y-5 pt-5">
                {reviewActionError && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 max-[421px]:text-[0.8125rem]">
                    {reviewActionError}
                  </p>
                )}
                {reviews.map((review) => {
                  const age = formatReviewAge(review.createdAt, reviewTimestampNow);
                  return (
                    <article
                      id={`review-${review.id}`}
                      key={review.id}
                      tabIndex={-1}
                      onContextMenu={(event) => {
                        if (
                          String(review.userId) !== activeUserId ||
                          event.target.closest("[data-review-reply]")
                        ) return;
                        event.preventDefault();
                        setContextMenu({
                          type: "review",
                          reviewId: review.id,
                          x: Math.min(event.clientX, window.innerWidth - 180),
                          y: Math.min(event.clientY, window.innerHeight - 110),
                        });
                      }}
                      className={`flex items-start gap-3 rounded-xl transition-colors ${
                        focusedReviewId === review.id
                          ? "bg-amber-50/70 ring-2 ring-amber-300 ring-offset-4"
                          : ""
                      }`}
                    >
                      <div
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700 max-[421px]:text-[0.625rem]"
                      >
                        {getReviewInitials(review.userName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingReviewId === review.id ? (
                          <form
                            onSubmit={(event) => handleReviewUpdate(event, review)}
                            className="max-w-2xl space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
                          >
                            <fieldset>
                              <legend className="text-sm font-semibold text-gray-800 max-[421px]:text-[0.8125rem]">
                                Update your rating
                              </legend>
                              <div className="mt-2 flex gap-1">
                                {Array.from({ length: 5 }, (_, index) => {
                                  const rating = index + 1;
                                  return (
                                    <button
                                      key={rating}
                                      type="button"
                                      aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                                      aria-pressed={editReviewRating === rating}
                                      onClick={() => setEditReviewRating(rating)}
                                      className="rounded p-1 focus-visible:outline-2 focus-visible:outline-amber-500"
                                    >
                                      <Star
                                        size={20}
                                        className={
                                          rating <= editReviewRating
                                            ? "fill-amber-400 text-amber-500"
                                            : "text-gray-300"
                                        }
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </fieldset>
                            <label className="block text-sm font-semibold text-gray-800 max-[421px]:text-[0.8125rem]">
                              Comment
                              <textarea
                                value={editReviewComment}
                                onChange={(event) => setEditReviewComment(event.target.value)}
                                maxLength={2000}
                                required
                                rows={4}
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm font-normal max-[421px]:text-[0.8125rem]"
                              />
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={!editReviewComment.trim() || Boolean(pendingReviewAction)}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 max-[421px]:text-[0.6875rem]"
                              >
                                {pendingReviewAction === `${review.id}:edit` ? "Saving..." : "Save changes"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingReviewId(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 max-[421px]:text-[0.6875rem]"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                        <div className="inline-block max-w-full rounded-2xl bg-gray-100 px-4 py-3">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="text-sm font-semibold text-gray-900 max-[421px]:text-[0.9375rem]">
                              {review.userName}
                            </p>
                            {age && (
                              <>
                                <span aria-hidden="true" className="text-xs text-gray-400">·</span>
                                <time
                                  className="text-xs text-gray-500 max-[421px]:text-[0.6875rem]"
                                  dateTime={review.createdAt}
                                  title={new Date(review.createdAt).toLocaleString()}
                                >
                                  {age}
                                </time>
                              </>
                            )}
                          </div>
                          <div
                            className="mt-1 flex items-center gap-0.5"
                            aria-label={`${review.rating} out of 5 stars`}
                          >
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star
                                key={index}
                                size={13}
                                className={index < review.rating ? "fill-amber-400 text-amber-500" : "text-gray-300"}
                              />
                            ))}
                            <span className="ml-1 text-xs font-medium text-gray-600 max-[421px]:text-[0.6875rem]">
                              {review.rating}.0
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800 max-[421px]:text-[0.8125rem]">
                            {review.comment}
                          </p>
                        </div>
                        )}
                        {review.media?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {review.media.map((item, index) => item.type === "video" ? (
                              <video
                                key={`${item.url}-${index}`}
                                src={item.url}
                                controls
                                className="max-h-80 max-w-full rounded-xl border border-gray-200 bg-gray-50"
                              />
                            ) : (
                              <img
                                key={`${item.url}-${index}`}
                                src={item.url}
                                alt={`Review attachment ${index + 1}`}
                                className="max-h-80 max-w-full rounded-xl border border-gray-200 bg-gray-50 object-contain"
                              />
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-2 text-xs font-medium text-gray-500 max-[421px]:text-[0.6875rem]">
                          {user ? (
                            <>
                              <button
                                type="button"
                                disabled={Boolean(pendingReviewAction)}
                                aria-pressed={review.userVote === "like"}
                                onClick={() => handleReviewVote(review.id, "like")}
                                className={`inline-flex cursor-pointer items-center gap-1.5 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${
                                  review.userVote === "like" ? "text-blue-700" : ""
                                }`}
                              >
                                <ThumbsUp size={15} />
                                Like{review.likes ? ` ${review.likes}` : ""}
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(pendingReviewAction)}
                                aria-pressed={review.userVote === "dislike"}
                                onClick={() => handleReviewVote(review.id, "dislike")}
                                className={`inline-flex cursor-pointer items-center gap-1.5 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${
                                  review.userVote === "dislike" ? "text-blue-700" : ""
                                }`}
                              >
                                <ThumbsDown size={15} />
                                Dislike{review.dislikes ? ` ${review.dislikes}` : ""}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo((current) =>
                                    current?.reviewId === review.id &&
                                    current?.parentReplyId === null
                                      ? null
                                      : {
                                          reviewId: review.id,
                                          parentReplyId: null,
                                          userName: review.userName,
                                        }
                                  );
                                  setReplyText("");
                                  setReviewActionError("");
                                }}
                                className="inline-flex cursor-pointer items-center gap-1.5 hover:text-gray-900"
                              >
                                <MessageCircle size={15} />
                                Reply
                              </button>
                            </>
                          ) : (
                            <Link
                              to="/login"
                              state={{ from: { pathname: productPath } }}
                              className="text-sm hover:text-blue-700 max-[421px]:text-[0.875rem]"
                            >
                              Sign in to like, dislike, or reply
                            </Link>
                          )}
                        </div>
                        {replyingTo?.reviewId === review.id &&
                          replyingTo.parentReplyId === null &&
                          user &&
                          renderReplyForm(review.id, null, replyingTo.userName)
                        }
                        {review.replies?.length > 0 && (
                          <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-3 sm:pl-4">
                            {review.replies.map((reply) => renderReply(reply, review.id))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {contextMenu && (
              <div
                role="menu"
                aria-label={contextMenu.type === "review" ? "Review options" : "Reply options"}
                onClick={(event) => event.stopPropagation()}
                style={{ left: contextMenu.x, top: contextMenu.y }}
                className="fixed z-50 min-w-36 rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    if (contextMenu.type === "review") {
                      const review = reviews.find((item) => item.id === contextMenu.reviewId);
                      if (review) {
                        setEditingReviewId(review.id);
                        setEditReviewRating(review.rating);
                        setEditReviewComment(review.comment);
                      }
                    } else {
                      const review = reviews.find((item) => item.id === contextMenu.reviewId);
                      const reply = findReplyInThread(review?.replies || [], contextMenu.replyId);
                      if (reply) {
                        setEditingReplyId(reply.id);
                        setEditReplyComment(reply.comment);
                      }
                    }
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 max-[421px]:text-[0.6875rem]"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={Boolean(pendingReviewAction)}
                  onClick={() => {
                    const { type, reviewId, replyId } = contextMenu;
                    setContextMenu(null);
                    if (type === "review") {
                      setReviewActionError("");
                      setReviewDeleteConfirmation({ reviewId });
                    }
                    else handleReplyDelete(reviewId, replyId);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 max-[421px]:text-[0.6875rem]"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
      {reviewDeleteConfirmation && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pendingReviewAction) {
              setReviewDeleteConfirmation(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-review-title"
            aria-describedby="delete-review-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="delete-review-title" className="text-lg font-semibold text-gray-900 max-[421px]:text-[clamp(1rem,4.3vw,1.125rem)]">
              Delete this review?
            </h2>
            <p id="delete-review-description" className="mt-2 text-sm leading-6 text-gray-600 max-[421px]:text-[0.8125rem]">
              This will permanently delete your review and all replies to it. This action cannot be undone.
            </p>
            {reviewActionError && (
              <p role="alert"               className="mt-3 text-sm text-red-700 max-[421px]:text-[0.8125rem]">
                {reviewActionError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(pendingReviewAction)}
                onClick={() => setReviewDeleteConfirmation(null)}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 max-[421px]:text-[0.6875rem]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(pendingReviewAction)}
                onClick={() => handleReviewDelete(reviewDeleteConfirmation.reviewId)}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 max-[421px]:text-[0.6875rem]"
              >
                {pendingReviewAction === `${reviewDeleteConfirmation.reviewId}:delete`
                  ? "Deleting..."
                  : "Delete review"}
              </button>
            </div>
          </section>
        </div>
      )}
      {outOfStockPopupOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOutOfStockPopupOpen(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="out-of-stock-title"
            aria-describedby="out-of-stock-description"
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close out-of-stock message"
              onClick={() => setOutOfStockPopupOpen(false)}
              className="absolute right-3 top-3 cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={18} />
            </button>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <AlertCircle size={25} />
            </span>
            <h2 id="out-of-stock-title" className="mt-4 text-lg font-semibold text-gray-900 max-[421px]:text-[clamp(1rem,4.3vw,1.125rem)]">
              Out of stock
            </h2>
            <p id="out-of-stock-description" className="mt-2 text-sm leading-6 text-gray-600 max-[421px]:text-[0.8125rem]">
              This product is currently unavailable because it is out of stock.
            </p>
            <button
              type="button"
              onClick={() => setOutOfStockPopupOpen(false)}
              className="mt-5 w-full cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black max-[421px]:text-[0.6875rem]"
            >
              Got it
            </button>
          </section>
        </div>
      )}
      <Footer />
    </>
  );
};

export default ProductDetails;
