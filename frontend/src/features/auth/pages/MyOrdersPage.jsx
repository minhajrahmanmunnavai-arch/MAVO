import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { cancelMyOrder, getMyOrders } from "../services/order.api.js";
import { subscribeToLiveUpdates } from "../services/liveUpdates.api.js";

const formatDate = (date) => {
  if (!date) return "Date unavailable";
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? "Date unavailable"
    : parsedDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
};

const formatDateTime = (date) => {
      if (!date) return "Time unavailable";
      const parsedDate = new Date(date);
      return Number.isNaN(parsedDate.getTime())
        ? "Time unavailable"
        : parsedDate.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
};

const formatStatus = (status) => {
      const normalizedStatus = String(status || "pending").toLowerCase();
      return normalizedStatus
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getOrderTimeline = (order) => {
      const timeline = Array.isArray(order.timeline) ? order.timeline : [];
      if (timeline.length > 0) return timeline;

      return [{
        status: order.status || "pending",
        changedAt: order.createdAt,
      }];
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-800",
  processing: "bg-blue-50 text-blue-800",
  shipped: "bg-indigo-50 text-indigo-800",
  delivered: "bg-green-50 text-green-800",
  cancelled: "bg-red-50 text-red-800",
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelNotice, setCancelNotice] = useState("");
  const [cancelEmailFailed, setCancelEmailFailed] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadOrders = async () => {
      try {
        const customerOrders = await getMyOrders();
        if (isActive) setOrders(customerOrders);
      } catch (error) {
        if (isActive) {
          setLoadError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load your orders. Please try again."
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadOrders();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "order:changed") loadOrders();
    });
    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    setIsCancelling(true);
    setCancelError("");
    try {
      const cancellationResult = await cancelMyOrder(String(orderToCancel._id));
      setOrders((currentOrders) =>
        currentOrders.filter((order) => order._id !== orderToCancel._id)
      );
      setExpandedOrderId((currentId) =>
        currentId === orderToCancel._id ? null : currentId
      );
      setCancelNotice(cancellationResult.warning || cancellationResult.message);
      setCancelEmailFailed(cancellationResult.emailSent === false);
      setOrderToCancel(null);
    } catch (error) {
      setCancelError(
        error.response?.data?.message ||
          error.message ||
          "Unable to cancel this order. Please try again."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-4 py-8 text-gray-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="relative mb-8 overflow-hidden rounded-3xl bg-white px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
                Your account
              </p>
              <h1 className="mt-3 text-3xl text-gray-900 font-semibold tracking-tight sm:text-4xl">
                My orders
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-gray-600 sm:text-base">
                All your purchases, together in one place. Keep an eye on what's
                on its way.
              </p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-200/10 text-emerald-500">
                <PackageCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-2xl text-gray-800 font-semibold leading-none">
                  {orders.length}
                </span>
                <span className="mt-1 block text-xs text-gray-900">
                  {orders.length === 1 ? "order placed" : "orders placed"}
                </span>
              </span>
            </div>
          </div>
        </header>

        {cancelNotice && (
          <p
            className={`mb-5 rounded-2xl border p-4 text-sm shadow-sm ${
              cancelEmailFailed
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
            role="status"
          >
            {cancelNotice}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200/80 bg-white p-10 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <ShoppingBag aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-gray-700">
              Loading your orders...
            </p>
            <p className="mt-1 text-xs text-gray-500">Just a moment</p>
          </div>
        ) : loadError ? (
          <p className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-600 shadow-sm" role="alert">
            {loadError}
          </p>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-gray-200/80 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f3ed] text-[#506b55]">
              <ShoppingBag aria-hidden="true" className="h-7 w-7" />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              A little room for something lovely
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              No orders just yet
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
              Once you find something you love, your order details and delivery
              updates will appear here.
            </p>
            <Link
              to="/category"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#26372c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#354a3c]"
            >
              Explore the collection
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const status = String(order.status || "pending").toLowerCase();
              const items = Array.isArray(order.products) ? order.products : [];
              const isDetailsOpen = expandedOrderId === order._id;
              const shippingAddress = order.address || {};
              const shippingAddressLine =
                shippingAddress.address || shippingAddress.street;
              const shippingRegion =
                shippingAddress.region ||
                [shippingAddress.city, shippingAddress.state]
                  .filter(Boolean)
                  .join(", ");
              const timeline = getOrderTimeline(order);

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_30px_-24px_rgba(27,39,31,0.5)] transition-shadow hover:shadow-[0_14px_38px_-24px_rgba(27,39,31,0.45)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-[#fbfbf9] px-5 py-4 sm:px-7">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-7 gap-y-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#617762] shadow-sm ring-1 ring-gray-100">
                          <CalendarDays aria-hidden="true" className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                            Order placed
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-gray-800">
                            {formatDate(order.createdAt)}
                          </span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                          Order number
                        </p>
                        <p className="mt-1 max-w-55 truncate text-sm font-medium text-gray-700">
                          #{order._id}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                        statusStyles[status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 px-5 sm:px-7">
                    {items.map((item, index) => {
                      const product =
                        item.product && typeof item.product === "object"
                          ? item.product
                          : {};
                      const name = product.title || product.productName || "Product";

                      return (
                        <div
                          key={item._id || `${order._id}-${index}`}
                          className="flex items-center gap-4 py-5"
                        >
                          {product.mainImage ? (
                            <img
                              src={product.mainImage}
                              alt=""
                              className="h-18 w-18 shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover"
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="flex h-18 w-18 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f0] text-xs font-medium text-gray-400"
                            >
                              Item
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                              {name}
                            </h2>
                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-gray-800">
                            ৳{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-[#fbfbf9] px-5 py-4 sm:px-7">
                    <p className="text-sm text-gray-600">
                      Payment:{" "}
                      <span className="font-medium text-gray-900">
                        {order.paymentMethod === "cash_on_delivery"
                          ? "Cash on Delivery"
                          : order.paymentMethod || "Not specified"}
                      </span>
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      Total: ৳{Number(order.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 px-5 py-4 sm:px-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        aria-expanded={isDetailsOpen}
                        aria-controls={`order-details-${order._id}`}
                        onClick={() =>
                          setExpandedOrderId(isDetailsOpen ? null : order._id)
                        }
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#405744] transition hover:text-[#26372c]"
                      >
                        {isDetailsOpen ? "Hide Order Details" : "View Order Details"}
                        <ChevronDown
                          aria-hidden="true"
                          className={`h-4 w-4 transition-transform ${isDetailsOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <Link
                        to={`/my-orders/${order._id}/chat`}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#9eae9f] hover:bg-[#f7f8f5]"
                      >
                        <MessageCircle aria-hidden="true" className="h-4 w-4" />
                        Chat With Seller
                      </Link>
                      {status === "pending" && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelError("");
                            setOrderToCancel(order);
                          }}
                          className="cursor-pointer rounded-xl border border-red-100 px-3.5 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-50"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                  {isDetailsOpen && (
                    <section
                      id={`order-details-${order._id}`}
                      aria-label={`Order details for ${order._id}`}
                      className="border-t border-gray-100 bg-[#f8f9f6] px-5 py-6 sm:px-7"
                    >
                      <h2 className="text-lg font-semibold text-gray-900">
                        Order Details
                      </h2>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
                          <h3 className="text-sm font-semibold text-gray-900">
                            Delivery status
                          </h3>
                          <p className="mt-2 text-sm text-gray-600">
                            Your order is{" "}
                            <span className="font-semibold text-gray-900">
                              {formatStatus(status)}
                            </span>
                            .
                          </p>
                          <h3 className="mt-5 text-sm font-semibold text-gray-900">
                            Order tracking
                          </h3>
                          <ol className="mt-3 space-y-4">
                            {timeline.map((event, index) => (
                              <li
                                key={`${event.status || "status"}-${event.changedAt || index}`}
                                className="flex gap-3"
                              >
                                <span
                                  aria-hidden="true"
                                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#66816a] ring-4 ring-[#e8eee6]"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatStatus(event.status)}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {formatDateTime(event.changedAt)}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ol>
                          <p className="mt-4 text-xs text-gray-500">
                            Tracking updates appear here as your order status changes.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
                            <h3 className="text-sm font-semibold text-gray-900">
                              Delivery address
                            </h3>
                            <address className="mt-2 space-y-1 text-sm not-italic text-gray-600">
                              {shippingAddress.fullName && (
                                <p>{shippingAddress.fullName}</p>
                              )}
                              {shippingAddressLine && <p>{shippingAddressLine}</p>}
                              {shippingRegion && <p>{shippingRegion}</p>}
                              {shippingAddress.phoneNumber && (
                                <p>{shippingAddress.phoneNumber}</p>
                              )}
                              {shippingAddress.email && <p>{shippingAddress.email}</p>}
                              {!shippingAddress.fullName &&
                                !shippingAddressLine &&
                                !shippingRegion &&
                                !shippingAddress.phoneNumber &&
                                !shippingAddress.email && <p>Address unavailable</p>}
                            </address>
                          </div>

                          <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
                            <h3 className="text-sm font-semibold text-gray-900">
                              Payment and order summary
                            </h3>
                            <dl className="mt-3 space-y-2 text-sm">
                              <div className="flex justify-between gap-4">
                                <dt className="text-gray-500">Payment method</dt>
                                <dd className="text-right font-medium text-gray-900">
                                  {order.paymentMethod === "cash_on_delivery"
                                    ? "Cash on Delivery"
                                    : order.paymentMethod || "Not specified"}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4">
                                <dt className="text-gray-500">Products</dt>
                                <dd className="text-right font-medium text-gray-900">
                                  {items.reduce(
                                    (count, item) => count + Number(item.quantity || 0),
                                    0
                                  )}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
                                <dt className="font-semibold text-gray-900">Total</dt>
                                <dd className="font-semibold text-gray-900">
                                  ৳{Number(order.totalAmount || 0).toFixed(2)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
      {orderToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#152019]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isCancelling) {
              setOrderToCancel(null);
              setCancelError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="cancel-order-title" className="text-lg font-semibold text-gray-900">
              Cancel this order?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Pending order #{orderToCancel._id} will be permanently removed from
              your orders.
            </p>
            {cancelError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {cancelError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelError("");
                }}
                className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
