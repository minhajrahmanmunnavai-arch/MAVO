
import React from "react";
import { Check } from "lucide-react";

export default function CategoryFormModal({
  isOpen,
  onClose,
  categories,
  name,
  slug,
  description,
  parent,
  status,
  setSlug,
  setDescription,
  setParent,
  setStatus,
  handleNameChange,
  handleCreateCategory,
  error = "",
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
      >
        <h2 id="category-form-title" className="mb-5 text-lg font-semibold text-gray-900">
          Add New Category
        </h2>
        <form onSubmit={handleCreateCategory} className="space-y-5">

        {/* Category Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Electronics"
            required
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Slug
          </label>

          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="electronics"
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-mono outline-none focus:border-blue-500"
          />
        </div>

        {/* Parent Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent Category
          </label>

          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="None">None (Root Category)</option>

            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this category..."
            rows={3}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Check size={16} />
            Create Category
          </button>
        </div>

        </form>
      </section>
    </div>
  );
}
