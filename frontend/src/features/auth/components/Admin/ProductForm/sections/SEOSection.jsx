
import React from "react";
import { Link2, Search, Copy, Check } from "lucide-react";
import TagInput from "../../common/TagInput.jsx";

const SEOSection = ({
  title = "",
  description = "",
  slug = "",
  setSlug,
  onSlugBlur,
  seoTitle = "",
  setSeoTitle,
  seoDescription = "",
  setSeoDescription,
  seoKeywords = "",
  setSeoKeywords,
}) => {
  // Convert keywords string to array for TagInput
  const keywordTags = seoKeywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  // SEO fallback
  const previewTitle = seoTitle.trim() || title;
  const previewDescription = seoDescription.trim() || description;

  // URL preview
  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/product/${slug}`
      : `/product/${slug}`;

  // Handle copy URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <Search size={16} className="text-gray-500" />

        <h2 className="text-sm font-bold text-gray-700">
          SEO & Search Optimization
        </h2>
      </div>

      {/* URL Slug */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-600">
          Product URL Slug
        </label>

        <div className="flex items-center gap-2">
          <Link2 size={15} className="text-gray-400 shrink-0" />

          <input
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            onBlur={onSlugBlur}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            placeholder="product-name"
          />
        </div>

        <p className="text-[11px] text-gray-400">
          Editable URL slug generated from product title.
        </p>

        {/* URL Preview */}
        <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <p className="text-xs text-green-700 break-all">
            {productUrl}
          </p>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 shrink-0"
            title="Copy Product URL"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* SEO Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-600">
            SEO Title
          </label>

          <span
            className={`text-[10px] font-mono ${
              seoTitle.length > 60 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {seoTitle.length}/60
          </span>
        </div>

        <input
          type="text"
          maxLength={60}
          value={seoTitle}
          onChange={(event) => setSeoTitle(event.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          placeholder={title || "Enter SEO title"}
        />

        <p className="text-[11px] text-gray-400">
          Leave empty to use product title.
        </p>
      </div>

      {/* SEO Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-600">
            SEO Description
          </label>

          <span
            className={`text-[10px] font-mono ${
              seoDescription.length > 160 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {seoDescription.length}/160
          </span>
        </div>

        <textarea
          rows={3}
          maxLength={160}
          value={seoDescription}
          onChange={(event) => setSeoDescription(event.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          placeholder={description || "Enter SEO description"}
        />

        <p className="text-[11px] text-gray-400">
          Leave empty to use product description.
        </p>
      </div>

      {/* SEO Keywords */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-600">
          SEO Keywords / Tags
        </label>

        <TagInput
          value={keywordTags}
          onChange={(nextKeywords) =>
            setSeoKeywords(nextKeywords.join(", "))
          }
        />

        <p className="text-[11px] text-gray-400">
          Keywords are useful for internal search and organization.
          Google does not use meta keywords for ranking.
        </p>
      </div>

      {/* Google Search Preview */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-600">
          Google Search Preview
        </h3>

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Search size={13} className="text-gray-500" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-gray-700 truncate">
                Temox
              </p>

              <p className="text-[11px] text-green-700 break-all">
                {productUrl}
              </p>
            </div>
          </div>

          <p className="text-lg text-blue-700 leading-snug line-clamp-2 hover:underline cursor-pointer">
            {previewTitle || "Product Title"}
          </p>

          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
            {previewDescription || "Product description will appear here."}
          </p>
        </div>

        <p className="text-[11px] text-gray-400">
          Preview only. Google may display a different title or description.
        </p>
      </div>

    </div>
  );
};

export default SEOSection;
