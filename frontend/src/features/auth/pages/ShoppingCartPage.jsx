import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCart } from "../Hooks/useCart.js";
import { useAuth } from "../Hooks/useAuth.js";
import { createOrder } from "../services/order.api.js";

export default function ShoppingCartPage() {
  const { user, showToast } = useAuth();
  const {
    cartItems,
    cartCount,
    loading,
    loadError,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const [actionError, setActionError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("address");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [paymentMethod] = useState("cash_on_delivery");
  const [address, setAddress] = useState({
    fullName: user?.username || "",
    phoneNumber: "",
    email: user?.email || "",
    region: "",
    address: "",
  });

  useEffect(() => {
    if (!isCheckoutOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmittingOrder) {
        setIsCheckoutOpen(false);
        setCheckoutStep("address");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCheckoutOpen, isSubmittingOrder]);

  const selectedItems = selectedIds === null
    ? cartItems
    : cartItems.filter((item) => selectedIds.includes(item.id));
  const allSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  const handleCartAction = async (id, action) => {
    setPendingId(id);
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.response?.data?.message || error.message);
    } finally {
      setPendingId(null);
    }
  };

  const total = selectedItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const handleAddressSubmit = (event) => {
    event.preventDefault();
    setActionError("");
    setCheckoutStep("payment");
  };

  const handleBackToShipping = (event) => {
    event.preventDefault();
    setActionError("");
    setCheckoutStep("address");
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (selectedItems.length === 0) {
      setActionError("Select at least one product to order.");
      return;
    }

    setIsSubmittingOrder(true);
    setActionError("");
    try {
      const order = await createOrder({
        products: selectedItems.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        totalAmount: total,
        address,
        paymentMethod,
      });

      for (const item of selectedItems) {
        await removeFromCart(item.id, { silent: true });
      }

      setSelectedIds([]);
      setIsCheckoutOpen(false);
      showToast(`Order placed successfully. Order #${order._id}`, "success");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to place your order. Please try again.";
      setActionError(message);
      showToast(message, "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf9f7] px-5 py-8 sm:px-8 sm:py-12 max-[520px]:px-3 max-[520px]:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-8 shadow-sm sm:px-9 sm:py-10 max-[520px]:rounded-2xl max-[520px]:px-4 max-[520px]:py-6">
          <div aria-hidden="true" className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-rose-100/60 blur-2xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between max-[520px]:gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 max-[520px]:text-[0.625rem]">
                <Sparkles size={14} />
                Ready when you are
              </span>
              <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl max-[520px]:mt-3 max-[520px]:text-[clamp(1.25rem,5vw,1.5rem)] max-[520px]:leading-tight">
                Shopping cart
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600 sm:text-base max-[520px]:text-[0.8125rem] max-[520px]:leading-5">
                Review your picks, adjust quantities, and get everything ready for checkout.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 max-[520px]:gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white/85 px-4 py-3 text-sm font-medium text-stone-700 shadow-sm max-[520px]:px-3 max-[520px]:py-2 max-[520px]:text-[0.8125rem]">
                <ShoppingBag size={17} className="text-rose-600" />
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
              <Link
                to="/"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 max-[520px]:px-3 max-[520px]:py-2 max-[520px]:text-[0.6875rem]"
              >
                <ArrowLeft size={16} />
                Continue shopping
              </Link>
            </div>
          </div>
        </header>

        {(loadError || actionError) && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 max-[520px]:text-[0.8125rem]" role="alert">
            {actionError || loadError}
          </p>
        )}

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="h-24 w-24 animate-pulse rounded-xl bg-stone-200" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-3 w-1/4 animate-pulse rounded bg-stone-200" />
                    <div className="h-5 w-2/3 animate-pulse rounded bg-stone-200" />
                    <div className="h-8 w-28 animate-pulse rounded-full bg-stone-200" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-stone-200 bg-white px-6 py-14 text-center shadow-sm sm:py-20 max-[520px]:rounded-2xl max-[520px]:px-4 max-[520px]:py-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShoppingBag size={28} />
            </span>
            <h2 className="mt-5 font-serif text-2xl font-semibold text-stone-900 max-[520px]:text-[clamp(1rem,4.3vw,1.125rem)]">
              Your cart is waiting
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600 max-[520px]:text-[0.8125rem]">
              Browse the collection and add something you love to get started.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 max-[520px]:text-[0.6875rem]"
            >
              Explore products
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
            <section aria-label="Cart items" className="space-y-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-800 shadow-sm max-[520px]:gap-2 max-[520px]:px-3 max-[520px]:py-3 max-[520px]:text-[0.8125rem]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => setSelectedIds(allSelected ? [] : null)}
                  className="h-4 w-4 cursor-pointer rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                Select all items to order
                <span className="ml-auto text-xs font-medium text-stone-500 max-[520px]:text-[0.6875rem]">
                  {selectedItems.length} selected
                </span>
              </label>
              {cartItems.map((item) => (
                <article
                  key={item.id}
                  className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5 max-[520px]:gap-3 max-[520px]:rounded-xl max-[520px]:p-3 ${
                    selectedItems.some((selectedItem) => selectedItem.id === item.id)
                      ? "border-rose-200"
                      : "border-stone-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.some(
                      (selectedItem) => selectedItem.id === item.id
                    )}
                    onChange={() =>
                      setSelectedIds((currentIds) => {
                        const selected = currentIds === null
                          ? cartItems.map((cartItem) => cartItem.id)
                          : currentIds;
                        return selected.includes(item.id)
                          ? selected.filter((selectedId) => selectedId !== item.id)
                          : [...selected, item.id];
                      })
                    }
                    aria-label={`Select ${item.productTitle} to order`}
                    className="h-4 w-4 cursor-pointer rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <img
                    src={item.img}
                    alt={item.productTitle}
                    className="h-24 w-24 shrink-0 rounded-xl bg-stone-100 object-cover max-[520px]:h-20 max-[520px]:w-20"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 max-[520px]:text-[0.625rem]">
                      {item.shopName || "MAVO collection"}
                    </p>
                    <h2 className="mt-1 break-words font-semibold text-stone-900 max-[520px]:text-[0.9375rem]">
                      {item.productTitle}
                    </h2>
                    <p className="mt-2 text-base font-semibold text-stone-900 max-[520px]:text-[0.8125rem]">
                      ৳{Number(item.price).toFixed(2)}
                      <span className="ml-1 text-xs font-normal text-stone-500 max-[520px]:text-[0.625rem]">each</span>
                    </p>
                  </div>
                  <div className="ml-auto flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end max-[520px]:gap-2">
                    <div className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 p-1">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.productTitle} quantity`}
                        disabled={pendingId === item.id || item.quantity <= 1}
                        onClick={() =>
                          handleCartAction(item.id, () =>
                            updateQuantity(item.id, item.quantity - 1)
                          )
                        }
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold text-stone-900" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.productTitle} quantity`}
                        disabled={pendingId === item.id || item.quantity >= item.stock}
                        onClick={() =>
                          handleCartAction(item.id, () =>
                            updateQuantity(item.id, item.quantity + 1)
                          )
                        }
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={pendingId === item.id}
                      onClick={() =>
                        handleCartAction(item.id, () => removeFromCart(item.id))
                      }
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-stone-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 max-[520px]:text-[0.6875rem]"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 sm:p-6 max-[520px]:rounded-xl max-[520px]:p-4">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                  <PackageCheck size={19} />
                </span>
                <div>
                  <h2 className="font-semibold text-stone-900 max-[520px]:text-[0.9375rem]">Order summary</h2>
                  <p className="mt-0.5 text-xs text-stone-500 max-[520px]:text-[0.6875rem]">Your selected items</p>
                </div>
              </div>
              <div className="mt-5 flex justify-between text-sm text-stone-600 max-[520px]:text-[0.8125rem]">
                <span>Selected items</span>
                <span className="font-medium text-stone-900">
                  {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="mt-4 flex justify-between text-sm text-stone-600 max-[520px]:text-[0.8125rem]">
                <span>Subtotal</span>
                <span className="font-medium text-stone-900">৳{total.toFixed(2)}</span>
              </div>
              <div className="mt-5 flex justify-between border-t border-stone-100 pt-4 text-base font-semibold text-stone-900 max-[520px]:text-[0.9375rem]">
                <span>Total</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
              <button
                type="button"
                disabled={selectedItems.length === 0 || isSubmittingOrder}
                onClick={() => {
                  setCheckoutStep("address");
                  setIsCheckoutOpen(true);
                }}
                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 max-[520px]:text-[0.6875rem]"
              >
                Continue to checkout
                <ArrowRight size={16} />
              </button>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-stone-500 max-[520px]:text-[0.625rem]">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Secure checkout · Cash on delivery
              </p>
            </aside>
          </div>
        )}
      </div>
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmittingOrder) {
              setIsCheckoutOpen(false);
              setCheckoutStep("address");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-dialog-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8 max-[520px]:rounded-2xl max-[520px]:p-4"
          >
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                  {checkoutStep === "address" ? <PackageCheck size={20} /> : <CheckCircle2 size={20} />}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                    Checkout
                  </p>
                  <h2 id="checkout-dialog-title" className="mt-1 text-xl font-semibold text-stone-900 max-[520px]:text-base">
                    {checkoutStep === "address" ? "Shipping details" : "Payment method"}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close checkout"
                disabled={isSubmittingOrder}
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setCheckoutStep("address");
                }}
                className="cursor-pointer rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>
            {actionError && (
              <p className="mb-4 text-sm text-red-600 max-[520px]:text-[0.8125rem]" role="alert">
                {actionError}
              </p>
            )}
            {checkoutStep === "payment" && (
              <button
                type="button"
                onClick={handleBackToShipping}
                className="mb-3 w-full cursor-pointer rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 max-[520px]:text-[0.8125rem]"
              >
                Back to Shipping Details
              </button>
            )}
            <form
              key={checkoutStep}
              onSubmit={checkoutStep === "address" ? handleAddressSubmit : handlePlaceOrder}
              className="space-y-4"
            >
              {checkoutStep === "address" ? (
                <>
                  {[
                    ["fullName", "Full name", "text", "Enter your full name"],
                    ["email", "Email", "email", "Enter your email"],
                    ["phoneNumber", "Phone number", "tel", "Enter your phone number"],
                    ["region", "Region/City/District", "text", "Please input Region/City/District"],
                    ["address", "Address", "text", "House number/building/road/area"],
                  ].map(([field, label, type, placeholder]) => (
                    <label key={field} className="block text-xs font-semibold text-stone-600 max-[520px]:text-[0.6875rem]">
                      {label}
                      <input
                        type={type}
                        required
                        autoComplete={field === "fullName" ? "name" : field === "email" ? "email" : field === "phoneNumber" ? "tel" : field === "region" ? "address-level2" : "street-address"}
                        placeholder={placeholder}
                        value={address[field]}
                        onChange={(event) =>
                          setAddress((currentAddress) => ({
                            ...currentAddress,
                            [field]: event.target.value,
                          }))
                        }
                        className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100 max-[520px]:px-3 max-[520px]:py-2.5 max-[520px]:text-[0.8125rem]"
                      />
                    </label>
                  ))}
                  <button
                    type="submit"
                    disabled={selectedItems.length === 0}
                    className="w-full cursor-pointer rounded-xl bg-stone-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 max-[520px]:text-[0.8125rem]"
                  >
                    Continue to Payment
                  </button>
                </>
              ) : (
                <>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-rose-50/40 p-4">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={paymentMethod === "cash_on_delivery"}
                      readOnly
                      className="mt-0.5 h-4 w-4 cursor-pointer"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900 max-[520px]:text-[0.8125rem]">
                        Cash on Delivery
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 max-[520px]:text-[0.6875rem]">
                        Pay when your order is delivered.
                      </span>
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmittingOrder || selectedItems.length === 0}
                    className="w-full cursor-pointer rounded-xl bg-stone-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 max-[520px]:text-[0.8125rem]"
                  >
                    {isSubmittingOrder ? "Placing Order..." : "Place Order"}
                  </button>
                </>
              )}
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
