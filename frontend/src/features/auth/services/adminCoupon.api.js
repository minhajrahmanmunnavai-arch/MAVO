import { api } from "./auth.api.js";

function normalizeCoupon(coupon) {
    const formatDate = (value) => {
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) {
            throw new Error("Unable to load coupon: invalid date in server response.");
        }
        return date.toISOString().slice(0, 10);
    };

    return {
        ...coupon,
        id: String(coupon._id || coupon.id),
        startDate: formatDate(coupon.startDate),
        expiryDate: formatDate(coupon.expiryDate),
        discountValue: Number(coupon.discountValue),
        minPurchase: Number(coupon.minPurchase),
        maxDiscount: Number(coupon.maxDiscount),
        usageCount: Number(coupon.usageCount) || 0,
        usageLimit: Number(coupon.usageLimit),
    };
}

export async function getAdminCoupons() {
    const response = await api.get("/api/admin/coupons");
    if (!Array.isArray(response.data?.data)) {
        throw new Error("Unable to load coupons: invalid server response.");
    }
    return response.data.data.map(normalizeCoupon);
}

export async function createAdminCoupon(couponData) {
    const response = await api.post("/api/admin/coupons", couponData);
    if (!response.data?.data) {
        throw new Error("Coupon creation failed: invalid server response.");
    }
    return normalizeCoupon(response.data.data);
}

export async function deleteAdminCoupon(couponId) {
    if (!couponId) {
        throw new Error("A coupon ID is required.");
    }

    const response = await api.delete(
        `/api/admin/coupons/${encodeURIComponent(couponId)}`
    );
    if (response.data?.success !== true) {
        throw new Error(response.data?.message || "Unable to delete coupon.");
    }
    return response.data;
}
