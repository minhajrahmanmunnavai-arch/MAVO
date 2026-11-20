
import React, { useState } from "react";
import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Cart = (props) => {
  const [cartFeedback, setCartFeedback] = useState("");
  const ratingScore = Number(props.ratingScore) || 0;
  const unitsSold = Number(props.unitsSold) || 0;
  // প্রোডাক্টটি Wishlist-এ থাকলে হার্ট লাল হবে
  const isFavorite = (props.wishlist ?? []).some(
    (item) => item.id === props.id
  );



  return (
    <div className="group relative mt-10 w-80 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-xl">

      {/* Image Container */}
      <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gray-100">
        <Link to={`/product/${props.id}`} aria-label={`View ${props.title}`}>
          <img
            src={props.mainImage}
            alt={props.title}
            className="h-64 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Discount Badge */}
        <span className="absolute top-3 left-3 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white tracking-wider uppercase shadow-sm z-10">
          {props.discountPercentage}% OFF
        </span>

        {/* Favorite / Wishlist Button */}
        <button
          type="button"
          onClick={props.onToggleWishlist}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite ? "Remove from Wishlist" : "Add to Wishlist"
          }
          className={`cursor-pointer absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 shadow-sm z-10 active:scale-90 ${isFavorite
            ? "bg-white text-red-500 scale-110"
            : "bg-white/80 text-gray-700 hover:bg-white hover:text-red-500"
            }`}
        >
          <Heart
            className={`h-5 w-5 transition-transform duration-200 ${isFavorite
              ? "fill-red-500 text-red-500 scale-110"
              : ""
              }`}
          />
        </button>

        {/* Hover Animation Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/40 via-black/10 to-transparent translate-y-full transition-transform duration-300 ease-in-out group-hover:translate-y-0">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Link to={`/product/${props.id}`} className="cursor-pointer flex w-full items-center justify-center rounded-lg bg-white/95 backdrop-blur-md py-2.5 text-sm font-semibold text-gray-900 shadow-lg transition-colors hover:bg-white active:scale-[0.98]">
              Quick View
            </Link>

            <button
              type="button"
              onClick={async () => {
                setCartFeedback("");
                try {
                  await props.onAddToCart?.();
                  setCartFeedback("Added to cart");
                } catch (error) {
                  setCartFeedback(error.message || "Unable to add to cart.");
                }
              }}
              aria-label={`Add ${props.title} to cart`}
              className="cursor-pointer flex h-10 w-12 items-center justify-center rounded-lg bg-gray-900 text-white shadow-lg transition-colors hover:bg-black active:scale-[0.98]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                <path d="M15 7V1" />
                <path d="m12 4 3-3 3 3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <Link to={`/product/${props.id}`} className="mt-3 block space-y-1.5 px-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {props.shopName}
          <span className="mx-1">•</span>
          {props.productName}
        </p>

        <h3 className="text-base font-bold text-gray-900 leading-snug">
          {props.title}
        </h3>

        <div className="flex items-center gap-1">
          <div className="flex text-amber-400" aria-hidden="true">
            <Star className="h-4 w-4 fill-current" />
          </div>

          <span
            className="text-xs text-gray-500 font-medium"
            aria-label={`${ratingScore.toFixed(1)} out of 5 stars, ${unitsSold} units sold`}
          >
            {ratingScore.toFixed(1)} ({unitsSold} sold)
          </span>
        </div>

        <div className="pt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">
            ৳{props.discountPrice}.00
          </span>

          <span className="text-sm text-gray-400 line-through">
            ৳{props.price}.00
          </span>
        </div>
      </Link>
      {cartFeedback && (
        <p className="px-1 pt-2 text-xs text-gray-600" role="status">
          {cartFeedback}
        </p>
      )}
    </div>
  );
};

export default Cart;
