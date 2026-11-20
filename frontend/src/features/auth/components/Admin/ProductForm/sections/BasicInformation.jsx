const BasicInformation = (
  { title, sku, brandName, category, shopName, productName, setTitle, setSku, setBrandName, setCategory, setShopName, setProductName, section, setSection, categories = [], categoriesLoading = false, categoriesError = "", existingCategory, fieldErrors = {}, onRequiredFieldChange = () => {} }
) => {
  const categoryOptions = [...categories];
  if (
    existingCategory &&
    !categoryOptions.some((categoryOption) => categoryOption.name === existingCategory)
  ) {
    categoryOptions.push({ id: existingCategory, name: existingCategory });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">

      <h2 className="text-sm font-bold text-white border-b border-gray-200 pb-3">
        1. Basic Information
      </h2>

      <div className="space-y-3">

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Product Title <span className="text-red-400">*</span>
          </label>

          <input
            type="text"
            value={title}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? "title-error" : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              onRequiredFieldChange("title", e.target.value);
            }}
            placeholder="Enter Product Title"
            className={`w-full bg-white border ${fieldErrors.title ? "border-red-500" : "border-gray-300"} rounded-lg px-3.5 py-2 text-xs text-gray-500 outline-0`}
          />
          {fieldErrors.title && <p id="title-error" className="mt-1 text-xs text-red-500">This field is required</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              SKU Identifier <span className="text-red-400">*</span>
            </label>

            <input
              type="text"
              value={sku}
              aria-invalid={Boolean(fieldErrors.sku)}
              aria-describedby={fieldErrors.sku ? "sku-error" : undefined}
              onChange={(e) => {
                setSku(e.target.value);
                onRequiredFieldChange("sku", e.target.value);
              }}
              placeholder="LUMINA-AUD-101"
              className={`w-full uppercase bg-white border ${fieldErrors.sku ? "border-red-500" : "border-gray-300"} rounded-lg px-3.5 py-2 text-xs text-gray-500 outline-0`}
            />
            {fieldErrors.sku && <p id="sku-error" className="mt-1 text-xs text-red-500">This field is required</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Brand Name
            </label>

            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="ENTER PRODUCT BRAND NAME"
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-500 outline-0"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Category <span className="text-red-400">*</span>
            </label>

            <select
              value={category}
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={fieldErrors.category ? "category-error" : undefined}
              onChange={(e) => {
                setCategory(e.target.value);
                onRequiredFieldChange("category", e.target.value);
              }}
              className={`w-full bg-white border cursor-pointer ${fieldErrors.category ? "border-red-500" : "border-gray-300"} rounded-lg px-3 py-2 text-xs text-gray-500 outline-0`}>
              <option value="">Select Category</option>
              {categoryOptions.map((categoryOption) => (
                <option key={categoryOption.id} value={categoryOption.name}>
                  {categoryOption.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && <p id="category-error" className="mt-1 text-xs text-red-500">This field is required</p>}
            {categoriesError && (
              <p className="mt-1 text-xs text-red-500" role="alert">
                Categories could not be loaded: {categoriesError}
              </p>
            )}
            {categoriesLoading && (
              <p className="mt-1 text-xs text-gray-500" role="status">
                Loading categories...
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Shop Name
            </label>

            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="ENTER YOUR SHOP NAME"
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-500 outline-0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Product Name
            </label>

            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="ENTER PRODUCT NAME"
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-500 outline-0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Select Section <span className="text-red-400">*</span>
            </label>

            <select 
              value={section}
              aria-invalid={Boolean(fieldErrors.section)}
              aria-describedby={fieldErrors.section ? "section-error" : undefined}
              onChange={(e) => {
                setSection(e.target.value);
                onRequiredFieldChange("section", e.target.value);
              }}
              className={`w-full bg-white border cursor-pointer ${fieldErrors.section ? "border-red-500" : "border-gray-300"} rounded-lg px-3 py-2 text-xs text-gray-500 outline-0`}>
              <option value="">Select Section</option>
              <option value="best-deals">Best Deals</option>
              <option value="free-delivery">Free Delivery</option>
            </select>
            {fieldErrors.section && <p id="section-error" className="mt-1 text-xs text-red-500">This field is required</p>}
          </div>

        </div>

      </div>

    </div>
  );
};

export default BasicInformation;