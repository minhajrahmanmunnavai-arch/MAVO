import { api } from "./auth.api.js";

function normalizeCategory(category) {
    return {
        ...category,
        id: String(category._id || category.id),
    };
}

export async function getCategories() {
    const response = await api.get("/api/categories");
    const categories = response.data?.data;

    if (!Array.isArray(categories)) {
        throw new Error("Unable to load categories: invalid server response.");
    }

    return categories.map(normalizeCategory);
}

export async function createCategory(categoryData) {
    try {
        const response = await api.post("/api/categories", categoryData);
        if (!response.data?.data) {
            throw new Error("Category creation failed: invalid server response.");
        }

        return normalizeCategory(response.data.data);
    } catch (error) {
        console.error("Error creating category:", error);
        throw error;
    }
}

export async function deleteCategoryById(id) {
    if (!id) {
        throw new Error("A category ID is required.");
    }

    try {
        const response = await api.delete(`/api/categories/${encodeURIComponent(id)}`);
        if (response.data?.success === false) {
            throw new Error(response.data.message || "Unable to delete category.");
        }

        return response.data;
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
}
