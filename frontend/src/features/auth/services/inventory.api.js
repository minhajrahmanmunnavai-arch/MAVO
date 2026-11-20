import { api } from "./auth.api.js";

function normalizeInventoryProduct(product) {
    return {
        id: String(product._id || product.id),
        name: product.productName || product.title || "",
        sku: product.sku || "",
        category: product.category || "",
        stock: product.stock,
        lowStockThreshold: product.lowStock ?? 10,
        reserved: product.reserved ?? 0,
        image: product.mainImage || "",
    };
}

export async function getInventory() {
    const response = await api.get("/api/inventory");
    const products = response.data?.data;

    if (!Array.isArray(products)) {
        throw new Error("Unable to load inventory: invalid server response.");
    }

    return products.map(normalizeInventoryProduct);
}

export async function updateInventoryStock(productId, stock) {
    if (!productId) {
        throw new Error("A product ID is required.");
    }

    const response = await api.patch(
        `/api/inventory/${encodeURIComponent(productId)}/stock`,
        { stock }
    );
    const product = response.data?.data;

    if (!product) {
        throw new Error("Stock update failed: invalid server response.");
    }

    return normalizeInventoryProduct(product);
}
