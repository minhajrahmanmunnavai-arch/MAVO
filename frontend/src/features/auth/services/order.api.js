import { api } from "./auth.api.js";

export async function createOrder({
    products,
    totalAmount,
    address,
    paymentMethod,
    idempotencyKey,
}) {
    const response = await api.post("/api/orders", {
        products,
        totalAmount,
        address,
        paymentMethod,
    }, {
        headers: {
            "Idempotency-Key": idempotencyKey,
        },
    });

    if (!response.data?.order?._id) {
        throw new Error("Order creation failed: invalid server response.");
    }

    return response.data.order;
}

export async function getMyOrders() {
    const response = await api.get("/api/orders/myorders");
    if (!Array.isArray(response.data?.order)) {
        throw new Error("Unable to load orders: invalid server response.");
    }

    return response.data.order;
}

export async function cancelMyOrder(orderId) {
    const response = await api.delete(`/api/orders/${encodeURIComponent(orderId)}`);
    if (response.data?.orderId !== orderId) {
        throw new Error("Order cancellation failed: invalid server response.");
    }

    return response.data;
}
