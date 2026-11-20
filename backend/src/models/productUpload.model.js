const mongoose = require("mongoose");

const productUploadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    brandName: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      required: true,
      enum: ["best-deals", "free-delivery"],
      trim: true,
    },

    shopName: {
      type: String,
      trim: true,
      default: "",
    },

    productName: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    keywords: {
      type: String,
      default: "",
      trim: true,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },

    seoTitle: {
      type: String,
      default: "",
      trim: true,
    },

    seoDescription: {
      type: String,
      default: "",
      trim: true,
    },

    seoKeywords: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    lowStock: {
      type: Number,
      default: 10,
      min: 0,
    },

    mainImage: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

productUploadSchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "unique_product_slug",
    partialFilterExpression: {
      slug: { $type: "string", $gt: "" },
    },
  }
);

productUploadSchema.pre("validate", function calculateDiscountPercentage() {
  const regularPrice = Number(this.price);
  const salePrice = Number(this.discountPrice);
  const hasSalePrice =
    this.discountPrice !== null &&
    this.discountPrice !== undefined &&
    this.discountPrice !== "";

  this.discountPercentage =
    hasSalePrice &&
    Number.isFinite(regularPrice) &&
    regularPrice > 0 &&
    Number.isFinite(salePrice) &&
    salePrice >= 0 &&
    salePrice < regularPrice
      ? Number((((regularPrice - salePrice) / regularPrice) * 100).toFixed(2))
      : 0;
});

const productUploadModel = mongoose.model(
  "Product",
  productUploadSchema
);

module.exports = productUploadModel;