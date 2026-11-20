import { useState, useEffect } from "react";

const MediaSection = ({ existingImage, setMainImage, fieldErrors = {}, onRequiredFieldChange = () => {} }) => {

  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image.");
      return;
    }

    const previewURL = URL.createObjectURL(file);

    setImageError("");
    setMainImage(file);
    onRequiredFieldChange("mainImage", file);
    setImagePreview(previewURL);
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">

      <div className="flex items-center justify-between border-b border-gray-200 pb-3">

        <h2 className="text-sm font-bold text-gray-600">
          Media Assets
        </h2>

        <label
          htmlFor="product-image"
          className="bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer shadow-md hover:bg-gray-800 transition"
        >
          + Add Image
        </label>

        <input
          id="product-image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

      </div>

      <div className="space-y-2">

        <p className="text-xs text-gray-500">
          Primary Showcase Image <span className="text-red-400">*</span>
        </p>

        <div className={`w-full h-52 bg-gray-100 border ${fieldErrors.mainImage || imageError ? "border-red-500" : "border-gray-300"} rounded-xl overflow-hidden flex items-center justify-center`}>

          {imagePreview || existingImage ? (
            <img
              src={imagePreview || existingImage}
              alt="Product Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-sm text-gray-400">
              No image selected
            </span>
          )}

        </div>
        {fieldErrors.mainImage && (
          <p className="text-xs text-red-500" role="alert">This field is required</p>
        )}
        {imageError && (
          <p className="text-xs text-red-500" role="alert">{imageError}</p>
        )}

      </div>

    </div>
  );
};

export default MediaSection;