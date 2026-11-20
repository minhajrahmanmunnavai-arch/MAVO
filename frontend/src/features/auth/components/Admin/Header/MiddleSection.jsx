import { Search } from "lucide-react";

const MiddleSection = ({
  currentRoute,
  navigateTo,
  setIsSearchModalOpen,
}) => {

  const getBreadcrumbTitle = (route) => {
    switch (route) {
      case "dashboard": return "Dashboard";
      case "products": return "Catalog / All Products";
      case "add-product": return "Catalog / Add Product";
      case "edit-product": return "Catalog / Edit Product";
      case "categories": return "Catalog / Categories";
      case "inventory": return "Catalog / Inventory";
      case "orders": return "Sales / Orders";
      case "order-details": return "Sales / Order Details";
      case "customers": return "Users / Customers";
      case "customer-details": return "Users / Customer Profile";
      case "sellers": return "Partners / Sellers";
      case "seller-details": return "Partners / Seller Application";
      case "coupons": return "Marketing / Coupons";
      case "banners": return "Marketing / Banners";
      case "reviews": return "Marketing / Reviews";
      case "analytics": return "Administration / Analytics";
      case "notifications": return "Administration / Notifications";
      case "settings": return "Administration / Settings";
      case "profile": return "Administration / Profile";
      default: return "Store Administration";
    }
  };

  return (
    <div className="flex items-center justify-between flex-1 min-w-0 gap-4">

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="hidden sm:flex items-center gap-2 text-xs min-w-0"
      >

        <span className="text-gray-300">/</span>

        <span className="text-gray-900 font-semibold truncate">
          {getBreadcrumbTitle(currentRoute)}
        </span>
      </nav>

      {/* Search */}
      <button
        type="button"
        onClick={() => setIsSearchModalOpen(true)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all text-xs"
      >
        <Search className="w-4 h-4 text-gray-500" />

        <input
          type="text"
          placeholder="Search Catalog, Order..."
          className="w-full min-w-0 bg-white text-gray-700 placeholder:text-gray-400 outline-none cursor-pointer"
        />

        <kbd className="hidden sm:inline-block font-mono cursor-pointer text-[10px] bg-gray-50 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">
          Ctrl K
        </kbd>
      </button>

    </div>
  );
};

export default MiddleSection;