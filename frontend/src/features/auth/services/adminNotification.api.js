import { api } from "./auth.api.js";

export async function getAdminNotifications() {
    const response = await api.get("/api/admin/notifications");
    const notifications = response.data?.data;

    if (!Array.isArray(notifications)) {
        throw new Error("Unable to load notifications: invalid server response.");
    }

    return notifications;
}

export async function markAdminNotificationRead(id) {
    await api.patch(`/api/admin/notifications/${encodeURIComponent(id)}/read`);
}

export async function deleteAdminNotification(id) {
    const response = await api.delete(`/api/admin/notifications/${encodeURIComponent(id)}`);
    if (response.data?.id !== id) {
        throw new Error("Unable to delete notification: invalid server response.");
    }
}

export async function markAllAdminNotificationsRead() {
    await api.patch("/api/admin/notifications/read-all");
}
