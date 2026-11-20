import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth.js";
import { useCart } from "../Hooks/useCart.js";
import { useWishlist } from "../Hooks/useWishlist.js";
import { getAllProducts } from "../services/productupload.api.js";
import { subscribeToLiveUpdates } from "../services/liveUpdates.api.js";
import { matchesProductSearch } from "../utils/productSearch.js";
import Footer from "../components/Main/Footer/Footer.jsx";

const formatPrice = (value) => {
  const price = Number(value);
  return Number.isFinite(price)
    ? `৳${new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price)}`
    : "Price unavailable";
};

const getSalePrice = (product) => {
  const salePrice = Number(product.discountPrice);
  const regularPrice = Number(product.price);
  return product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice !== "" &&
    Number.isFinite(salePrice) &&
    salePrice >= 0 &&
    salePrice < regularPrice
    ? salePrice
    : null;
};

export default function ShopCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useAuth();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const search = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [collection, setCollection] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const loadedProducts = await getAllProducts();
        if (active) {
          setProducts(loadedProducts);
          setLoadError("");
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load the catalog. Please try again."
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadProducts();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "products:changed") loadProducts();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second)),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch = matchesProductSearch(product, normalizedSearch);
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesCollection =
        collection === "all" ||
        (collection === "best-deals" && product.section === "best-deals") ||
        (collection === "free-delivery" && product.section === "free-delivery");
      const matchesStock = !inStockOnly || Number(product.stock) > 0;
      const effectivePrice = getSalePrice(product) ?? Number(product.price);
      const matchesPrice =
        priceRange === "all" ||
        (priceRange === "under-50" && effectivePrice < 50) ||
        (priceRange === "50-150" && effectivePrice >= 50 && effectivePrice <= 150) ||
        (priceRange === "over-150" && effectivePrice > 150);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCollection &&
        matchesStock &&
        matchesPrice
      );
    });

    return filtered.sort((first, second) => {
      if (sortBy === "price-low") {
        return (getSalePrice(first) ?? Number(first.price)) -
          (getSalePrice(second) ?? Number(second.price));
      }
      if (sortBy === "price-high") {
        return (getSalePrice(second) ?? Number(second.price)) -
          (getSalePrice(first) ?? Number(first.price));
      }
      if (sortBy === "name") {
        return String(first.title).localeCompare(String(second.title));
      }
      if (sortBy === "newest") {
        return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
      }
      return 0;
    });
  }, [collection, inStockOnly, priceRange, products, search, selectedCategory, sortBy]);

  const resetFilters = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("search");
    setSearchParams(nextSearchParams, { replace: true });
    setSelectedCategory("all");
    setCollection("all");
    setSortBy("featured");
    setPriceRange("all");
    setInStockOnly(false);
  };

  const handleWishlist = async (product) => {
    const productId = String(product._id);
    const isSaved = wishlist.some((item) => String(item.id) === productId);
    try {
      if (isSaved) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      showToast(
        error.message || "Unable to update your wishlist.",
        "error"
      );
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
    } catch (error) {
      showToast(error.message || "Unable to add this item to your cart.", "error");
    }
  };

  return (
    <>
      <main className="min-h-screen bg-[#faf9f6]">
        <section className="relative overflow-hidden bg-stone-900 px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
          <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -right-4 -top-16 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative mx-auto max-w-7xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              The MAVO collection
            </p>
            <h1 className="mt-5 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Thoughtful finds for everyday living.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-stone-300 sm:text-base">
              Explore considered essentials, distinctive pieces, and new
              favorites selected for your home and lifestyle.
            </p>
            <a
              href="#catalog"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-100"
            >
              Explore the catalog
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Find your next favorite
              </p>
              <h2 className="mt-2 font-serif text-3xl text-stone-900">
                Shop the catalog
              </h2>
            </div>
            <p className="text-sm text-stone-500" aria-live="polite">
              {isLoading
                ? "Loading products..."
                : `${visibleProducts.length} ${
                    visibleProducts.length === 1 ? "piece" : "pieces"
                  }`}
            </p>
          </header>

          <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(150px,1fr))]">
              <label className="relative block">
                <span className="sr-only">Search the catalog</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    const nextSearchParams = new URLSearchParams(searchParams);
                    if (event.target.value) {
                      nextSearchParams.set("search", event.target.value);
                    } else {
                      nextSearchParams.delete("search");
                    }
                    setSearchParams(nextSearchParams, { replace: true });
                  }}
                  placeholder="Search products, brands..."
                  className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 pl-11 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white"
                />
              </label>

              <label className="relative">
                <span className="sr-only">Filter by category</span>
                <SlidersHorizontal
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                />
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 pl-11 pr-4 text-sm text-stone-700 outline-none focus:border-stone-500"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="relative">
                <span className="sr-only">Filter by collection</span>
                <select
                  value={collection}
                  onChange={(event) => setCollection(event.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 outline-none focus:border-stone-500"
                >
                  <option value="all">All collections</option>
                  <option value="best-deals">Best deals</option>
                  <option value="free-delivery">Free delivery</option>
                </select>
              </label>

              <label className="relative">
                <span className="sr-only">Sort products</span>
                <ArrowDownWideNarrow
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 pl-11 pr-4 text-sm text-stone-700 outline-none focus:border-stone-500"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Price
                </span>
                {[
                  ["all", "Any price"],
                  ["under-50", "Under ৳50"],
                  ["50-150", "৳50–৳150"],
                  ["over-150", "৳150+"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriceRange(value)}
                    aria-pressed={priceRange === value}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      priceRange === value
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 text-stone-600 hover:border-stone-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(event) => setInStockOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                  />
                  In stock
                </label>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-semibold text-stone-600 underline-offset-2 hover:text-stone-950 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-stone-200 bg-white">
              <div className="text-center" role="status">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800" />
                <p className="mt-4 text-sm text-stone-500">Curating your collection...</p>
              </div>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="text-sm text-red-700" role="alert">{loadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Try again
              </button>
            </div>
          ) : visibleProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => {
                const productId = String(product._id);
                const salePrice = getSalePrice(product);
                const isSaved = wishlist.some(
                  (item) => String(item.id) === productId
                );
                const availableStock = Number(product.stock) > 0;

                return (
                  <article
                    key={productId}
                    className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg"
                  >
                    <div className="relative aspect-4/4.5 overflow-hidden bg-stone-100">
                      <Link
                        to={`/product/${productId}`}
                        aria-label={`View ${product.title}`}
                        className="block h-full w-full"
                      >
                        {product.mainImage ? (
                          <img
                            src={product.mainImage}
                            alt={product.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-sm text-stone-400">
                            Image unavailable
                          </div>
                        )}
                      </Link>
                      {salePrice !== null && (
                        <span className="absolute left-3 top-3 rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white">
                          {Number(product.discountPercentage) > 0
                            ? `${Math.round(Number(product.discountPercentage))}% off`
                            : "Special price"}
                        </span>
                      )}
                      {product.section === "free-delivery" && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 shadow-sm">
                          Free delivery
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleWishlist(product)}
                        aria-pressed={isSaved}
                        aria-label={
                          isSaved
                            ? `Remove ${product.title} from wishlist`
                            : `Add ${product.title} to wishlist`
                        }
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm transition hover:bg-white hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
                      >
                        <Heart
                          aria-hidden="true"
                          className={`h-5 w-5 ${isSaved ? "fill-red-600 text-red-600" : ""}`}
                        />
                      </button>
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
                        {product.brandName || product.shopName || product.category || "MAVO"}
                      </p>
                      <Link to={`/product/${productId}`} className="mt-2 block">
                        <h3 className="line-clamp-2 min-h-12 font-serif text-lg leading-6 text-stone-900 group-hover:text-stone-600">
                          {product.title}
                        </h3>
                      </Link>
                      {product.category && (
                        <p className="mt-1 text-xs text-stone-500">{product.category}</p>
                      )}
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="font-semibold text-stone-900">
                            {formatPrice(salePrice ?? product.price)}
                          </p>
                          {salePrice !== null && (
                            <p className="mt-0.5 text-xs text-stone-400 line-through">
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={!availableStock}
                          className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                          <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                          {availableStock ? "Add" : "Sold out"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center">
              <h3 className="font-serif text-2xl text-stone-900">No pieces found</h3>
              <p className="mt-2 text-sm text-stone-500">
                Try another search or clear your filters to explore the full collection.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
