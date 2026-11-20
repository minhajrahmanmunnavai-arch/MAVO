
import React, { useEffect, useState } from "react";
import { useAdmin } from "../../contex/AdminContext.jsx";
import {
  getInventory,
  updateInventoryStock,
} from "../../../services/inventory.api.js";
import { subscribeToLiveUpdates } from "../../../services/liveUpdates.api.js";

// Components
import InventoryHeader from "./components/InventoryHeader";
import InventoryStats from "./components/InventoryStats";
import InventoryFilters from "./components/InventoryFilters";
import InventoryTable from "./components/InventoryTable";

export default function InventoryPage() {
  const { addToast, setNotifications } = useAdmin();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("All");

  // Inline editing state
  const [editingStock, setEditingStock] = useState({});
  const [savingStockId, setSavingStockId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadInventory = async () => {
      try {
        const inventory = await getInventory();
        if (active) {
          setProducts(inventory);
          setLoadError("");
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error.response?.data?.message || error.message || "Unable to load inventory."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInventory();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "products:changed") loadInventory();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Stock Input Change
  const handleStockInputChange = (id, value) => {
    setEditingStock((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Save Stock
  const handleSaveStock = async (id) => {
    const newVal = editingStock[id];

    if (newVal !== undefined && newVal !== "") {
      const stockValue = Number(newVal);

      if (!Number.isInteger(stockValue) || stockValue < 0) {
        addToast({
          title: "Invalid Stock",
          message: "Stock must be a non-negative integer.",
          type: "error",
        });
        return;
      }

      setSavingStockId(id);
      try {
        const previousProduct = products.find((product) => product.id === id);
        const updatedProduct = await updateInventoryStock(id, stockValue);
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === id ? updatedProduct : product
          )
        );
        setEditingStock((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });

        const previousStatus = previousProduct
          ? previousProduct.stock === 0
            ? "out-of-stock"
            : previousProduct.stock <= previousProduct.lowStockThreshold
              ? "low-stock"
              : "in-stock"
          : "in-stock";
        const updatedStatus =
          updatedProduct.stock === 0
            ? "out-of-stock"
            : updatedProduct.stock <= updatedProduct.lowStockThreshold
              ? "low-stock"
              : "in-stock";

        if (
          updatedStatus !== previousStatus &&
          (updatedStatus === "low-stock" || updatedStatus === "out-of-stock")
        ) {
          const isOutOfStock = updatedStatus === "out-of-stock";
          setNotifications((currentNotifications) => [
            {
              id: `INVENTORY-${id}-${Date.now()}`,
              title: isOutOfStock ? "Product Out of Stock" : "Low Stock Alert",
              message: isOutOfStock
                ? `${updatedProduct.name} (${updatedProduct.sku}) is out of stock.`
                : `${updatedProduct.name} (${updatedProduct.sku}) is low in stock: ${updatedProduct.stock} remaining.`,
              type: "inventory",
              timestamp: "Just now",
              read: false,
              route: "inventory",
              param: id,
            },
            ...currentNotifications,
          ]);
        }

        addToast({
          title: "Stock Adjusted",
          message: "Inventory levels synchronized.",
          type: "success",
        });
      } catch (error) {
        addToast({
          title: "Stock Update Failed",
          message:
            error.response?.data?.message ||
            error.message ||
            "Unable to update inventory stock.",
          type: "error",
        });
      } finally {
        setSavingStockId(null);
      }
    }
  };

  // Filter Products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      stockFilter === "All" ||
      (stockFilter === "In Stock" &&
        product.stock > product.lowStockThreshold) ||
      (stockFilter === "Low Stock" &&
        product.stock > 0 &&
        product.stock <= product.lowStockThreshold) ||
      (stockFilter === "Out of Stock" && product.stock === 0);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <InventoryHeader />

      {/* KPI Cards */}
      <InventoryStats products={products} />

      {/* Search & Filters */}
      <InventoryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
      />

      {/* Inventory Table */}
      {loadError && (
        <p className="text-sm text-red-600" role="alert">{loadError}</p>
      )}
      <InventoryTable
        products={filteredProducts}
        loading={loading}
        editingStock={editingStock}
        onStockInputChange={handleStockInputChange}
        onSaveStock={handleSaveStock}
        savingStockId={savingStockId}
      />

    </div>
  );
}
