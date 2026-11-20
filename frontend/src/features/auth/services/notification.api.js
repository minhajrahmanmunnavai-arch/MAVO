import { api } from "./auth.api.js";

async function readNotifications(path) {
  const response = await api.get(path);
  const notifications = response.data?.notifications;
  const count = response.data?.count;
  const unreadCount = response.data?.unreadCount;

  if (
    !Array.isArray(notifications) ||
    !Number.isInteger(count) ||
    count !== notifications.length ||
    !Number.isInteger(unreadCount) ||
    unreadCount < 0 ||
    unreadCount > count
  ) {
    throw new Error("Unable to load notifications: invalid server response.");
  }

  return { notifications, count, unreadCount };
}

export async function getCustomerNotifications() {
  return readNotifications("/api/notifications");
}

export async function getOfferNotifications() {
  return readNotifications("/api/notifications/offers");
}

export async function markNotificationRead(id) {
  await api.patch(`/api/notifications/${encodeURIComponent(id)}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch("/api/notifications/read-all");
}

export async function deleteNotification(id) {
  await api.delete(`/api/notifications/${encodeURIComponent(id)}`);
}
