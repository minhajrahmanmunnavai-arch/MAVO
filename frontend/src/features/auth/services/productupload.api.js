import { api } from "./auth.api.js";

export async function uploadProduct({
    title,
    sku,
    brandName,
    category,
    section,
    shopName,
    productName,
    description,
    keywords,
    slug,
    seoTitle,
    seoDescription,
    seoKeywords,
    price,
    discountPrice,
    tax,
    stock,
    lowStock,
    mainImage, 
}) { 
    if (!(mainImage instanceof Blob)) {
        throw new Error("Please select a product image file.");
    }

    const formData = new FormData();
    const productFields = {
        title,
        sku,
        brandName,
        category,
        section,
        shopName,
        productName,
        description,
        keywords,
        slug,
        seoTitle,
        seoDescription,
        seoKeywords,
        price,
        discountPrice,
        tax,
        stock,
        lowStock,
    };

    for (const [key, value] of Object.entries(productFields)) {
        if (value !== undefined && value !== null && value !== "") {
            formData.append(key, String(value));
        }
    }
    formData.append("mainImage", mainImage);

    try {
        const response = await api.post("/api/products/upload", formData);
        return response.data;
    } catch (error) {
        console.error("Error uploading product:", error);
        throw error;
    }
}

export async function updateProductById(id, {
    title,
    sku,
    brandName,
    category,
    section,
    shopName,
    productName,
    description,
    keywords,
    slug,
    seoTitle,
    seoDescription,
    seoKeywords,
    price,
    discountPrice,
    tax,
    stock,
    lowStock,
    mainImage,
}) {
    if (!id) {
        throw new Error("A product ID is required.");
    }

    const formData = new FormData();
    const productFields = {
        title,
        sku,
        brandName,
        category,
        section,
        shopName,
        productName,
        description,
        keywords,
        slug,
        seoTitle,
        seoDescription,
        seoKeywords,
        price,
        discountPrice,
        tax,
        stock,
        lowStock,
    };

    for (const [key, value] of Object.entries(productFields)) {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    }

    if (mainImage instanceof Blob) {
        formData.append("mainImage", mainImage);
    }

    try {
        const response = await api.put(
            `/api/products/${encodeURIComponent(id)}`,
            formData
        );
        const product = response.data?.data;

        if (!product) {
            throw new Error("Product update failed: the server returned no product.");
        }

        return product;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
}

export async function getAllProducts() {
    try {
        const response = await api.get("/api/products");
        const products = response.data?.data;

        if (!Array.isArray(products)) {
            throw new Error("Unable to load products: the server returned an invalid response.");
        }

        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
}

export async function getProductById(id) {
    if (!id) {
        throw new Error("A product ID is required.");
    }

    try {
        const response = await api.get(`/api/products/${encodeURIComponent(id)}`);
        const product = response.data?.data;

        if (
            !product ||
            (String(product._id) !== String(id) && String(product.slug || "") !== String(id))
        ) {
            throw new Error("Product not found.");
        }

        return product;
    } catch (error) {
        console.error("Error fetching product:", error);
        throw error;
    }
}

export async function deleteProductById(id) {
    if (!id) {
        throw new Error("A product ID is required.");
    }

    try {
        const response = await api.delete(
            `/api/products/${encodeURIComponent(id)}`
        );

        if (response.data?.success === false) {
            throw new Error(response.data.message || "Unable to delete product.");
        }

        return response.data;
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
}