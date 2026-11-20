
import { useContext } from "react";

import Sidebar from "./Sitebar/Sidebar";
import Header from "./Header/Header.jsx";

import Dashboard from "../../pages/Dasboard.jsx";
import AddProductPage from "../../pages/AddProductPage.jsx";
import EditProductPage from "../../pages/EditProductPage.jsx";
import AllProducts from "../../pages/AllProducts.jsx";
import CategoryPage from "../../pages/CategoryPage.jsx";
import InventoryPage from "./InventoryPage/index.jsx";
import OrdersPage from "./OrdersPage/index.jsx";
import OrderDetailsPage from "./OrderDetailsPage/index.jsx";
import ChatsPage from "./ChatsPage/index.jsx";
import CustomersPage from "./CustomersPage/index.jsx";
import CustomerDetailsPage from "./CustomerDetailsPage/index.jsx";
import CouponsPage from "./CouponsPage/index.jsx";
import ReviewsPage from "./ReviewsPage/index.jsx";
import ReviewDetailsPage from "./ReviewDetailsPage/index.jsx";

import { AdminContext } from "../contex/AdminContext.jsx";

const AdminPanel = () => {
  const { isSidebarCollapsed, currentRoute, navigateTo } = useContext(AdminContext);

  const renderActivePage = () => {
    switch (currentRoute) {
      case "dashboard":
        return <Dashboard />;

      case "add-product":
        return <AddProductPage />;

      case "products":
        return <AllProducts navigateTo={navigateTo} />;

      case "edit-product":
        return <EditProductPage />;

      case "categories":
        return <CategoryPage />;

      case "inventory":
        return <InventoryPage />;

      case "orders":
        return <OrdersPage />;

      case "order-details":
        return <OrderDetailsPage />;

      case "messages":
        return <ChatsPage />;

      case "customers":
        return <CustomersPage />;

      case "customer-details":
        return <CustomerDetailsPage />;

      case "coupons":
        return <CouponsPage />;

      case "reviews":
        return <ReviewsPage />;

      case "review-details":
        return <ReviewDetailsPage />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <Sidebar />

      <div
        className={`
          min-h-screen flex flex-col
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
        `}
      >

        <Header />

        <main className="flex-1 min-w-0 p-6">
          {renderActivePage()}
        </main>

      </div>

    </div>
  );
};

export default AdminPanel;
