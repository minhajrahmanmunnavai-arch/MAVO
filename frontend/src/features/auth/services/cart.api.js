import { api } from "./auth.api.js";

function normalizeCart(response) {
    const items = response.data?.data;
    if (!Array.isArray(items)) {
        throw new Error("Cart request failed: invalid server response.");
    }

    return items.map(({ product, quantity }) => ({
        id: String(product._id),
        img: product.mainImage || "",
        shopName: product.shopName || "",
        productTitle: product.title || product.productName || "",
        price:
            product.discountPrice !== null &&
            product.discountPrice !== undefined &&
            product.discountPrice !== ""
                ? product.discountPrice
                : product.price,
        quantity,
        stock: Number(product.stock) || 0,
    }));
}

export async function getCart() {
    return normalizeCart(await api.get("/api/cart"));
}

export async function addCartItem(productId, quantity = 1) {
    if (!productId) throw new Error("A product ID is required.");
    return normalizeCart(
        await api.post(`/api/cart/${encodeURIComponent(productId)}`, { quantity })
    );
}

export async function updateCartItem(productId, quantity) {
    if (!productId) throw new Error("A product ID is required.");
    return normalizeCart(
        await api.patch(`/api/cart/${encodeURIComponent(productId)}`, { quantity })
    );
}

export async function removeCartItem(productId) {
    if (!productId) throw new Error("A product ID is required.");
    return normalizeCart(
        await api.delete(`/api/cart/${encodeURIComponent(productId)}`)
    );
}
