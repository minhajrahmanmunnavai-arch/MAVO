
import CartSection from "../components/Main/Cart-section/CartSection";
import CartItem from "../components/Main/Cart-section/CartItem";
import { useWishlist } from "../Hooks/useWishlist.js";
import { useCart } from "../Hooks/useCart.js";
import { getProductById } from "../services/productupload.api.js";
import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const Cart = () => {
  const { wishlist, loading, loadError, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [actionError, setActionError] = useState("");

  const handleRemoveFromWishlist = async (productId) => {
    try {
      setActionError("");
      await removeFromWishlist(productId);
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          error.message ||
          "Unable to remove this item from your wishlist."
      );
    }
  };

  const handleMoveToCart = async (item) => {
    try {
      setActionError("");
      const product = await getProductById(item.id);
      await addToCart(product);
      await removeFromWishlist(item.id);
    } catch (error) {
      setActionError(
        error.response?.data?.message || error.message || "Unable to add item to cart."
      );
    }
  };

  return (
    <main className="min-h-[70vh] bg-[#faf9f7] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <CartSection count={wishlist.length} />

        <section aria-label="Wishlist items" className="mt-8">
          {(loadError || actionError) && (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {actionError || loadError}
            </p>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
                  aria-hidden="true"
                >
                  <div className="aspect-[4/3] animate-pulse bg-stone-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-stone-200" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
                    <div className="h-10 animate-pulse rounded-xl bg-stone-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : wishlist.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-stone-500">
                {wishlist.length === 1
                  ? "One lovely find saved for later."
                  : `Here are your ${wishlist.length} saved finds.`}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {wishlist.map((elem) => (
                  <CartItem
                    key={elem.id}
                    id={elem.id}
                    img={elem.img}
                    shopName={elem.shopName}
                    productTitle={elem.productTitle}
                    price={elem.price}
                    onRemove={handleRemoveFromWishlist}
                    onMoveToBag={handleMoveToCart}
                  />
                ))}
              </div>
            </>
          ) : !loadError ? (
            <div className="rounded-3xl border border-stone-200 bg-white px-6 py-14 text-center shadow-sm sm:py-20">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Heart size={29} />
              </span>
              <h2 className="mt-5 font-serif text-2xl font-semibold text-stone-900">
                Your wishlist is waiting
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
                Save the products you love and they&apos;ll be right here when you&apos;re ready.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                <ShoppingBag size={16} />
                Explore products
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default Cart;