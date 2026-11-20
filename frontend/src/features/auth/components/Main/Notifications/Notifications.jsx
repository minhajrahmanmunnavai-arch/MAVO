import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  Ellipsis,
  MessageCircle,
  PackageCheck,
  Star,
  Tag,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../Hooks/useAuth.js";
import {
  deleteNotification,
  getCustomerNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../../services/notification.api.js";
import { subscribeToLiveUpdates } from "../../../services/liveUpdates.api.js";

function formatDate(date) {
  if (!date) return "";
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
}

export default function Notifications({
  panel = false,
  onNotificationClick,
  onCountChange,
  onClose,
}) {
  const { user, loading: authLoading } = useAuth();
  const [notificationData, setNotificationData] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actionError, setActionError] = useState("");
  const requestKey = authLoading
    ? null
    : user
      ? `user-${user._id || user.id || user.email}`
      : "guest";
  const isLoading =
    authLoading || notificationData?.requestKey !== requestKey;
  const notifications =
    notificationData?.requestKey === requestKey
      ? notificationData.notifications
      : [];
  const loadError =
    notificationData?.requestKey === requestKey
      ? notificationData.loadError
      : "";
  const unreadCount =
    notificationData?.requestKey === requestKey
      ? notificationData.unreadCount
      : 0;

  useEffect(() => {
    if (!isLoading && notificationData?.requestKey === requestKey) {
      onCountChange?.(notificationData.unreadCount);
    }
  }, [isLoading, notificationData, onCountChange, requestKey]);

  useEffect(() => {
    if (requestKey === null) return undefined;

    let active = true;

    const loadNotifications = async () => {
      if (!user) {
        if (active) {
          setNotificationData({
            requestKey,
            notifications: [],
            count: 0,
            unreadCount: 0,
            loadError: "",
          });
        }
        return;
      }

      try {
        const { notifications, count, unreadCount: unreadNotifications } =
          await getCustomerNotifications();
        if (active) {
          setNotificationData({
            requestKey,
            notifications,
            count,
            unreadCount: unreadNotifications,
            loadError: "",
          });
        }
      } catch (error) {
        if (active) {
          setNotificationData({
            requestKey,
            notifications: [],
            count: 0,
            unreadCount: 0,
            loadError:
              error.response?.data?.message ||
              error.message ||
              "Unable to load notifications.",
          });
        }
      }
    };

    loadNotifications();
    const unsubscribe = user
      ? subscribeToLiveUpdates((update) => {
          if (
            update.type === "order:changed" ||
            update.type === "customer-notifications:changed" ||
            update.type === "products:changed"
          ) {
            loadNotifications();
          }
        })
      : undefined;
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [authLoading, requestKey, user]);

  const handleMarkRead = async (notification) => {
    if (!user || notification.isRead) return;

    setActionError("");
    setNotificationData((current) => {
      if (current?.requestKey !== requestKey) return current;
      return {
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        ),
        unreadCount: Math.max(0, current.unreadCount - 1),
      };
    });

    try {
      await markNotificationRead(notification.id);
    } catch (error) {
      setNotificationData((current) => {
        if (current?.requestKey !== requestKey) return current;
        return {
          ...current,
          notifications: current.notifications.map((item) =>
            item.id === notification.id ? { ...item, isRead: false } : item
          ),
          unreadCount: current.unreadCount + 1,
        };
      });
      setActionError(
        error.response?.data?.message || "Unable to mark this notification as read."
      );
    }
  };

  const handleMarkAllRead = async () => {
    setActionError("");
    try {
      await markAllNotificationsRead();
      setNotificationData((current) => {
        if (current?.requestKey !== requestKey) return current;
        return {
          ...current,
          notifications: current.notifications.map((item) => ({
            ...item,
            isRead: true,
          })),
          unreadCount: 0,
        };
      });
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Unable to mark notifications as read."
      );
    }
  };

  const handleDelete = async (notification) => {
    setActionError("");
    setOpenMenuId(null);
    try {
      await deleteNotification(notification.id);
      setNotificationData((current) => {
        if (current?.requestKey !== requestKey) return current;
        return {
          ...current,
          notifications: current.notifications.filter(
            (item) => item.id !== notification.id
          ),
          count: Math.max(0, current.count - 1),
          unreadCount: notification.isRead
            ? current.unreadCount
            : Math.max(0, current.unreadCount - 1),
        };
      });
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Unable to delete this notification."
      );
    }
  };

  return (
    <section
      aria-labelledby="home-notifications-heading"
      className={
        panel
          ? "w-full"
          : "mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-12"
      }
    >
      <div
        className={`overflow-hidden bg-white ${
          panel
            ? "rounded-2xl"
            : "rounded-3xl border border-stone-200 shadow-sm"
        }`}
      >
        <header
          className={`flex items-start justify-between gap-4 border-b border-stone-100 ${
            panel ? "bg-stone-50/80 px-5 py-5" : "px-6 py-6 sm:px-8"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
              <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              {!panel && (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Stay in the loop
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="home-notifications-heading"
                  className={`font-serif text-stone-900 ${
                    panel ? "text-xl" : "mt-1 text-2xl"
                  }`}
                >
                  {panel ? "Notifications" : "Your updates"}
                </h2>
                {user && unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {panel
                  ? "Order, review and offer updates"
                  : "Updates about your orders and reviews"}
              </p>
            </div>
          </div>
          {(user || (panel && onClose)) && (
            <div className="flex shrink-0 items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-stone-600 transition hover:bg-white hover:text-stone-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
                  title="Mark all notifications as read"
                >
                  <CheckCheck aria-hidden="true" className="h-4 w-4" />
                  <span className={panel ? "hidden sm:inline" : ""}>
                    Mark all read
                  </span>
                </button>
              )}
              {user && (
                <Link
                  to="/my-orders"
                  onClick={onClose}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-white hover:text-black ${
                    panel ? "hidden sm:inline-flex" : "text-sm"
                  }`}
                >
                  My Orders
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              )}
              {panel && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close notifications"
                  className="rounded-full p-2 text-stone-500 transition hover:bg-white hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </header>

        <div
          className={
            panel
              ? "max-h-[min(68vh,32rem)] overflow-y-auto overscroll-contain p-2"
              : "divide-y divide-stone-100"
          }
        >
          {(loadError || actionError) && (
            <p
              className={`text-sm text-amber-800 ${
                panel
                  ? "m-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
                  : "px-6 py-4 sm:px-8"
              }`}
              role="alert"
            >
              {actionError || loadError}
            </p>
          )}

          {isLoading ? (
            panel ? (
              <div className="space-y-2 p-1" role="status" aria-label="Loading notifications">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex animate-pulse gap-3 rounded-xl border border-stone-100 p-3"
                  >
                    <span className="h-10 w-10 shrink-0 rounded-xl bg-stone-100" />
                    <span className="flex-1 space-y-2 py-1">
                      <span className="block h-3 w-2/3 rounded bg-stone-100" />
                      <span className="block h-3 w-full rounded bg-stone-100" />
                      <span className="block h-3 w-1/2 rounded bg-stone-100" />
                    </span>
                  </div>
                ))}
                <span className="sr-only">Loading your updates...</span>
              </div>
            ) : (
              <p className="px-6 py-8 text-sm text-stone-500 sm:px-8" role="status">
                Loading your updates...
              </p>
            )
          ) : notifications.length > 0 ? (
            <div className={panel ? "space-y-1.5" : "divide-y divide-stone-100"}>
              {notifications.map((notification) => {
                const Icon =
                  notification.kind === "review-activity"
                    ? MessageCircle
                    : notification.kind === "review"
                      ? Star
                      : notification.kind === "order"
                        ? PackageCheck
                        : Tag;
                const iconColor =
                  notification.kind === "review-activity"
                    ? "bg-violet-50 text-violet-700"
                    : notification.kind === "review"
                      ? "bg-amber-50 text-amber-700"
                      : notification.kind === "order"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700";
                const kindLabel = {
                  "review-activity": "Review activity",
                  review: "Review reminder",
                  order: "Order update",
                  offer: "Special offer",
                }[notification.kind] || "Update";
                const formattedDate = formatDate(notification.date);

                return (
                  <div
                    key={notification.id}
                    className={
                      panel
                        ? `group flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                            notification.isRead
                              ? "border-transparent hover:bg-stone-50"
                              : "border-stone-100 bg-stone-50/80 hover:bg-stone-100"
                          }`
                        : `group flex items-start gap-3 px-5 py-5 transition ${
                            notification.isRead ? "bg-white" : "bg-stone-50/80"
                          } hover:bg-stone-100`
                    }
                  >
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <Link
                      to={notification.to}
                      onClick={() => {
                        handleMarkRead(notification);
                        onNotificationClick?.();
                      }}
                      className="min-w-0 flex-1"
                    >
                      <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        <span
                          className={`min-w-0 text-sm leading-5 text-stone-900 group-hover:text-black ${
                            notification.isRead ? "font-medium" : "font-semibold"
                          }`}
                        >
                          {notification.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {!notification.isRead && (
                            <span
                              aria-label="Unread"
                              className="h-2 w-2 rounded-full bg-rose-500"
                            />
                          )}
                          {formattedDate && (
                            <time
                              className="text-[11px] font-medium text-stone-400"
                              dateTime={new Date(notification.date).toISOString()}
                            >
                              {formattedDate}
                            </time>
                          )}
                        </span>
                      </span>
                      <span
                        className={`mt-1 block leading-5 text-stone-600 ${
                          panel ? "text-xs" : "text-sm leading-6"
                        }`}
                      >
                        {notification.description}
                      </span>
                      {panel && (
                        <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                          {kindLabel}
                        </span>
                      )}
                      <span className="sr-only">Open notification</span>
                    </Link>
                    {user && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          aria-label={`More options for ${notification.title}`}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === notification.id}
                          onClick={() =>
                            setOpenMenuId((current) =>
                              current === notification.id ? null : notification.id
                            )
                          }
                          className="rounded-full p-2 text-stone-400 transition hover:bg-stone-200 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
                        >
                          <Ellipsis aria-hidden="true" className="h-5 w-5" />
                        </button>
                        {openMenuId === notification.id && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-10 mt-1 min-w-28 rounded-lg border border-stone-200 bg-white p-1 shadow-lg"
                          >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleDelete(notification)}
                                className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                              >
                                Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !loadError && (
              <div
                className={`flex flex-col items-center text-center ${
                  panel ? "px-6 py-10" : "px-6 py-12 sm:px-8"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                  <Bell aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-stone-900">
                  {user ? "You’re all caught up" : "Your updates are waiting"}
                </h3>
                <p className="mt-1 max-w-xs text-xs leading-5 text-stone-500">
                  {user
                    ? "Order updates and review reminders will show up here."
                    : "Sign in to see your order updates and review activity."}
                </p>
                {panel && (
                  <Link
                    to={user ? "/my-orders" : "/login"}
                    onClick={onClose}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
                  >
                    {user ? "View my orders" : "Sign in"}
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
