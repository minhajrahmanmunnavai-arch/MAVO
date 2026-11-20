
import React, { useState } from "react";
import { useAdmin } from "../../contex/AdminContext.jsx";

// Components
import CategoriesHeader from "./components/CategoriesHeader";
import CategorySearch from "./components/CategorySearch";
import CategoriesTable from "./components/CategoriesTable";
import CategoryFormModal from "./components/CategoryFormModal";
import CategoryDeleteModal from "./components/CategoryDeleteModal";

export default function CategoriesPage() {
  const {
    categories,
    categoriesLoading: loadingCategories,
    categoriesError,
    addCategory,
    deleteCategory,
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState(null);

  // Form States
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("None");
  const [status, setStatus] = useState("Active");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  // Generate Slug
  const handleNameChange = (value) => {
    setName(value);

    setSlug(
      value
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
    );
  };

  // Reset Form
  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setParent("None");
    setStatus("Active");
    setFormError("");
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }

    const categorySlug =
      slug.trim() ||
      trimmedName
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

    try {
      await addCategory({
        name: trimmedName,
        slug: categorySlug,
        description: description.trim(),
        parent,
        status,
      });
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      setFormError(
        error.response?.data?.message || error.message || "Unable to create category."
      );
    }
  };

  // Filter Categories
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!catToDelete) return;

    setDeleteError("");
    try {
      await deleteCategory(catToDelete.id);
      setCatToDelete(null);
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || error.message || "Unable to delete category."
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <CategoriesHeader
        onAddCategory={() => {
          setFormError("");
          setIsAddModalOpen(true);
        }}
      />

      {/* Search */}
      <CategorySearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Categories Table */}
      {categoriesError && (
        <p className="text-sm text-red-600" role="alert">{categoriesError}</p>
      )}
      <CategoriesTable
        categories={filteredCategories}
        loading={loadingCategories}
        onDelete={setCatToDelete}
      />

      {/* Add Category Modal */}
      <CategoryFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        name={name}
        slug={slug}
        description={description}
        parent={parent}
        status={status}
        setSlug={setSlug}
        setDescription={setDescription}
        setParent={setParent}
        setStatus={setStatus}
        handleNameChange={handleNameChange}
        handleCreateCategory={handleCreateCategory}
        error={formError}
      />

      {/* Delete Category Modal */}
      <CategoryDeleteModal
        catToDelete={catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={handleDeleteCategory}
        error={deleteError}
      />

    </div>
  );
}
