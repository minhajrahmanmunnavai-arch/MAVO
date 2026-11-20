import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "../../contex/AdminContext.jsx";
import {
  deleteProductById,
  getAllProducts,
} from "../../../services/productupload.api.js";
import { subscribeToLiveUpdates } from "../../../services/liveUpdates.api.js";
import ProductsHeader from "./components/ProductsHeader.jsx";
import ProductFilters from "./components/ProductFilters.jsx";
import BulkActionBar from "./components/BulkActionBar.jsx";
import ProductsTable from "./components/ProductsTable.jsx";
import ProductPagination from "./components/ProductPagination.jsx";
import ProductDeleteModals from "./components/ProductDeleteModals.jsx";

const normalizeProduct = (product) => {
  const stock = Number(product.stock) || 0;
  const lowStockThreshold = Number(product.lowStock) || 0;

  return {
    ...product,
    id: String(product._id),
    name: product.title || product.productName || "",
    brand: product.brandName || "",
    price: Number(product.price) || 0,
    salePrice: Number(product.discountPrice) || 0,
    stock,
    lowStockThreshold,
    status:
      stock === 0
        ? "Out of Stock"
        : stock <= lowStockThreshold
          ? "Low Stock"
          : "Active",
    image: product.mainImage || "",
    reserved: 0,
  };
};

export default function ProductsPage({ navigateTo }) {
  const { setNotifications } = useAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStockStatus, setSelectedStockStatus] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 6;

  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getAllProducts();
        if (active) {
          setProducts(fetchedProducts.map(normalizeProduct));
          setLoadError("");
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load products."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "products:changed") fetchProducts();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category).filter(Boolean))]
        .sort()
        .map((name) => ({ id: name, name })),
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(search) ||
          product.sku?.toLowerCase().includes(search) ||
          product.brand.toLowerCase().includes(search);

        const matchesCategory =
          selectedCategory === "All" ||
          product.category === selectedCategory;
        const matchesStatus =
          selectedStatus === "All" || product.status === selectedStatus;
        const matchesStock =
          selectedStockStatus === "All" ||
          (selectedStockStatus === "In Stock" &&
            product.stock > product.lowStockThreshold) ||
          (selectedStockStatus === "Low Stock" &&
            product.stock > 0 &&
            product.stock <= product.lowStockThreshold) ||
          (selectedStockStatus === "Out of Stock" && product.stock === 0);

        return matchesSearch && matchesCategory && matchesStatus && matchesStock;
      }),
    [products, searchTerm, selectedCategory, selectedStatus, selectedStockStatus]
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    const currentPageIds = paginatedProducts.map((product) => product.id);
    const allSelected = currentPageIds.every((id) => selectedIds.includes(id));

    setSelectedIds((currentIds) =>
      allSelected
        ? currentIds.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...currentIds, ...currentPageIds])]
    );
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((item) => item !== id)
        : [...currentIds, id]
    );
  };

  const deleteProduct = async (id) => {
    setDeleting(true);
    setDeleteError("");

    try {
      const productToRemove = products.find((product) => product.id === id);
      await deleteProductById(id);
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );
      setSelectedIds((currentIds) => currentIds.filter((item) => item !== id));
      if (productToRemove) {
        setNotifications((currentNotifications) => [
          {
            id: `PRODUCT-DELETED-${id}-${Date.now()}`,
            title: "Product Deleted",
            message: `"${productToRemove.name}" (${productToRemove.sku}) was deleted.`,
            type: "product",
            timestamp: "Just now",
            read: false,
            route: "products",
          },
          ...currentNotifications,
        ]);
      }
      setMessage("Product deleted successfully.");
      return true;
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || error.message || "Unable to delete product."
      );
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const duplicateProduct = (id) => {
    const product = products.find((item) => item.id === id);
    if (!product) {
      return;
    }

    const copy = {
      ...product,
      id: `${product.id}-copy-${Date.now()}`,
      sku: `${product.sku}-COPY`,
      name: `${product.name} (Copy)`,
    };
    setProducts((currentProducts) => [copy, ...currentProducts]);
    setMessage("Product duplicated in this catalog view.");
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    setDeleteError("");

    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => deleteProductById(id))
      );
      const deletedIds = selectedIds.filter(
        (_, index) => results[index].status === "fulfilled"
      );
      const failedResults = results.filter((result) => result.status === "rejected");
      const deletedProducts = products.filter((product) =>
        deletedIds.includes(product.id)
      );

      setProducts((currentProducts) =>
        currentProducts.filter((product) => !deletedIds.includes(product.id))
      );
      setSelectedIds((currentIds) =>
        currentIds.filter((id) => !deletedIds.includes(id))
      );
      if (deletedProducts.length > 0) {
        const deletedAt = Date.now();
        setNotifications((currentNotifications) => [
          ...deletedProducts.map((product, index) => ({
            id: `PRODUCT-DELETED-${product.id}-${deletedAt}-${index}`,
            title: "Product Deleted",
            message: `"${product.name}" (${product.sku}) was deleted.`,
            type: "product",
            timestamp: "Just now",
            read: false,
            route: "products",
          })),
          ...currentNotifications,
        ]);
      }

      if (failedResults.length === 0) {
        setIsBulkDeleteModalOpen(false);
        setMessage(`${deletedIds.length} products deleted successfully.`);
      } else {
        setDeleteError(
          `${deletedIds.length} product(s) deleted; ${failedResults.length} could not be deleted. ${
            failedResults[0].reason.response?.data?.message ||
            failedResults[0].reason.message ||
            ""
          }`.trim()
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductsHeader navigateTo={navigateTo} />

      {message && (
        <p className="text-sm text-gray-600" role="status">
          {message}
        </p>
      )}

      <div className="space-y-3">
        <ProductFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedStockStatus={selectedStockStatus}
          setSelectedStockStatus={setSelectedStockStatus}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          categories={categories}
        />
        <BulkActionBar
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onDelete={() => setIsBulkDeleteModalOpen(true)}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          Loading products...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center text-sm text-red-600" role="alert">
          {loadError}
        </div>
      ) : (
        <>
          <ProductsTable
            products={paginatedProducts}
            selectedIds={selectedIds}
            toggleSelectAll={toggleSelectAll}
            toggleSelectOne={toggleSelectOne}
            navigateTo={navigateTo}
            duplicateProduct={duplicateProduct}
            onDelete={setProductToDelete}
          />

          <ProductPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalProducts={filteredProducts.length}
          />
        </>
      )}

      <ProductDeleteModals
        productToDelete={productToDelete}
        setProductToDelete={setProductToDelete}
        isBulkDeleteModalOpen={isBulkDeleteModalOpen}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        selectedCount={selectedIds.length}
        deleteProduct={deleteProduct}
        handleBulkDelete={handleBulkDelete}
        deleteError={deleteError}
        deleting={deleting}
      />
    </div>
  );
}
