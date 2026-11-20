import { useEffect, useState } from "react";
import { useAdmin } from "../../contex/AdminContext.jsx";
import { useProduct } from "../../../Hooks/useProduct.js";
import ShowToast from "../../Showtoast/Showtoast.jsx";
import Loading from "../../Loading/Loading.jsx";

// Sections
import ProductFormHeader from './sections/ProductFormHeader';
import BasicInformation from './sections/BasicInformation';
import ProductDescription from './sections/ProductDescription';
import TechnicalSpecifications from './sections/TechnicalSpecifications';
import PricingSection from './sections/PricingSection';
import InventorySection from './sections/InventorySection';
import MediaSection from './sections/MediaSection';
import SEOSection from './sections/SEOSection';

const createProductSlug = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");

const normalizeSeoKeywords = (value) =>
  Array.isArray(value) ? value.join(", ") : String(value || "");

export default function ProductForm({
  initialProduct = null,
  isEdit = false,
}) {

  const { loading, handleUploadProduct, handleUpdateProduct } = useProduct();
  const {
    navigateTo,
    categories,
    categoriesLoading,
    categoriesError,
    setNotifications,
  } = useAdmin();

  const [title, setTitle] = useState(initialProduct?.title ?? "");
  const [sku, setSku] = useState(initialProduct?.sku ?? "");
  const [brandName, setBrandName] = useState(initialProduct?.brandName ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? "");
  const [shopName, setShopName] = useState(initialProduct?.shopName ?? "");
  const [productName, setProductName] = useState(initialProduct?.productName ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [seoKeywords, setSeoKeywords] = useState(() =>
    normalizeSeoKeywords(
      initialProduct?.seoKeywords ?? initialProduct?.keywords
    )
  );
  const [slug, setSlug] = useState(
    initialProduct?.slug || createProductSlug(initialProduct?.title)
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initialProduct?.slug)
  );
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialProduct?.seoDescription ?? ""
  );
  const [price, setPrice] = useState(initialProduct?.price ?? "");
  const [discountPrice, setDiscountPrice] = useState(initialProduct?.discountPrice ?? "");
  const [tax, setTax] = useState(initialProduct?.tax ?? "");
  const [stock, setStock] = useState(initialProduct?.stock ?? "");
  const [lowStock, setLowStock] = useState(initialProduct?.lowStock ?? "");
  const [mainImage, setMainImage] = useState(null);
  const [section, setSection] = useState(initialProduct?.section ?? "");

  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(createProductSlug(title));
    }
  }, [slugManuallyEdited, title]);

  const handleSlugChange = (nextSlug) => {
    setSlugManuallyEdited(true);
    setSlug(nextSlug);
  };

  const normalizeSlug = () => {
    setSlugManuallyEdited(true);
    setSlug((currentSlug) => createProductSlug(currentSlug));
  };

  const requiredFields = {
    title,
    sku,
    category,
    section,
    price,
    stock,
    mainImage: mainImage || initialProduct?.mainImage,
  };

  const isRequiredFieldEmpty = (field, value) =>
    field === "mainImage"
      ? !value
      : value === null || value === undefined || String(value).trim() === "";

  const handleRequiredFieldChange = (field, value) => {
    setFieldErrors((currentErrors) => {
      if (!Object.prototype.hasOwnProperty.call(currentErrors, field)) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [field]: isRequiredFieldEmpty(field, value),
      };
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const validationErrors = Object.fromEntries(
      Object.entries(requiredFields).map(([field, value]) => [
        field,
        isRequiredFieldEmpty(field, value),
      ])
    );
    setFieldErrors(validationErrors);

    if (Object.values(validationErrors).some(Boolean)) {
      setToast({ message: "Please fill in all required fields.", type: "error" });
      return;
    }

    try {
      const productData = {
        title,
        sku,
        brandName,
        category,
        section,
        shopName,
        productName,
        description,
        keywords: seoKeywords,
        slug: createProductSlug(slug),
        seoTitle,
        seoDescription,
        seoKeywords,
        price,
        discountPrice,
        tax,
        stock,
        lowStock,
        mainImage,
      };

      let savedProduct;
      if (isEdit) {
        savedProduct = await handleUpdateProduct(initialProduct._id, productData);
      } else {
        savedProduct = await handleUploadProduct(productData);
      }

      const savedProductName =
        savedProduct.productName || savedProduct.title || title;
      setNotifications((currentNotifications) => [
        {
          id: `PRODUCT-${savedProduct._id || savedProduct.id}-${Date.now()}`,
          title: isEdit ? "Product Updated" : "Product Published",
          message: isEdit
            ? `"${savedProductName}" was updated successfully.`
            : `"${savedProductName}" was published successfully.`,
          type: "product",
          timestamp: "Just now",
          read: false,
          route: "products",
        },
        ...currentNotifications,
      ]);

      setToast({
        message: isEdit ? "Product updated successfully." : "Product uploaded successfully.",
        type: "success",
      });

      setTimeout(() => {
        navigateTo(isEdit ? "products" : "dashboard");
      }, 1500);

    } catch (error) {
      setToast({
        message: error.message || (isEdit ? "Error updating product." : "Error uploading product."),
        type: "error",
      });
    }
  };

  // Loading
  if (loading) {
    return <Loading />;
  }

  return (
    <form
      className="space-y-6"
      onSubmit={submitHandler}
    >

      {/* Header */}
      <ProductFormHeader navigateTo={navigateTo} isEdit={isEdit} />
      {toast && (
        <ShowToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Basic Information */}
          <BasicInformation
            title={title}
            sku={sku}
            brandName={brandName}
            category={category}
            shopName={shopName}
            productName={productName}
            setTitle={setTitle}
            setSku={setSku}
            setBrandName={setBrandName}
            setCategory={setCategory}
            setShopName={setShopName}
            setProductName={setProductName}
            section={section}
            setSection={setSection}
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            existingCategory={initialProduct?.category}
            fieldErrors={fieldErrors}
            onRequiredFieldChange={handleRequiredFieldChange}
          />

          {/* 2. Product Description */}
          <ProductDescription
            description={description}
            setDescription={setDescription}
          />

          {/* 3. Technical Specifications */}
          <TechnicalSpecifications />

        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* 4. Pricing */}
          <PricingSection
            price={price}
            discountPrice={discountPrice}
            tax={tax}
            setPrice={setPrice}
            setDiscountPrice={setDiscountPrice}
            setTax={setTax}
            fieldErrors={fieldErrors}
            onRequiredFieldChange={handleRequiredFieldChange}
          />

          {/* 5. Inventory */}
          <InventorySection
            stock={stock}
            lowStock={lowStock}
            setStock={setStock}
            setLowStock={setLowStock}
            fieldErrors={fieldErrors}
            onRequiredFieldChange={handleRequiredFieldChange}
          />

          {/* 6. Media */}
          <MediaSection
            existingImage={initialProduct?.mainImage}
            setMainImage={setMainImage}
            fieldErrors={fieldErrors}
            onRequiredFieldChange={handleRequiredFieldChange}
          />

          {/* 7. SEO */}
          <SEOSection
            title={title}
            description={description}
            slug={slug}
            setSlug={handleSlugChange}
            onSlugBlur={normalizeSlug}
            seoTitle={seoTitle}
            setSeoTitle={setSeoTitle}
            seoDescription={seoDescription}
            setSeoDescription={setSeoDescription}
            seoKeywords={seoKeywords}
            setSeoKeywords={setSeoKeywords}
          />

        </div>

      </div>

    </form>
  );
}