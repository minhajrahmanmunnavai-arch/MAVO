import { api } from "./auth.api.js";

function normalizeWishlistProduct(product) {
    return {
        id: String(product._id || product.id),
        img: product.mainImage || product.img || "",
        shopName: product.shopName || "",
        productTitle: product.title || product.productName || product.productTitle || "",
        price: product.price,
    };
}

function readWishlistResponse(response) {
    const products = response.data?.data;
    if (!Array.isArray(products)) {
        throw new Error("Wishlist request failed: invalid server response.");
    }

    return products.map(normalizeWishlistProduct);
}

export async function getWishlist() {
    return readWishlistResponse(await api.get("/api/wishlist"));
}

export async function addWishlistItem(productId) {
    if (!productId) {
        throw new Error("A product ID is required.");
    }

    return readWishlistResponse(
        await api.post(`/api/wishlist/${encodeURIComponent(productId)}`)
    );
}

export async function removeWishlistItem(productId) {
    if (!productId) {
        throw new Error("A product ID is required.");
    }

    return readWishlistResponse(
        await api.delete(`/api/wishlist/${encodeURIComponent(productId)}`)
    );
}
