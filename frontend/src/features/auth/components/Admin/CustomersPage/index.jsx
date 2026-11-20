
import React, { useEffect, useState } from "react";
import { useAdmin } from "../../contex/AdminContext.jsx";
import { getAdminCustomers } from "../../../services/customer.api.js";
import { subscribeToLiveUpdates } from "../../../services/liveUpdates.api.js";

// Components
import CustomersHeader from "./components/CustomersHeader";
import CustomerSearch from "./components/CustomerSearch";
import CustomersTable from "./components/CustomersTable";

export default function CustomersPage() {
  const { navigateTo } = useAdmin();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;

    const loadCustomers = async () => {
      try {
        const loadedCustomers = await getAdminCustomers();
        if (active) {
          setCustomers(loadedCustomers);
          setLoadError("");
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load customers."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCustomers();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "customers:changed" || update.type === "order:changed") {
        loadCustomers();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Filter Customers
  const filteredCustomers = customers.filter((customer) =>
    String(customer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(customer.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(customer.phone || "").includes(searchTerm)
  );

  // View Customer Details
  const handleViewCustomer = (customerId) => {
    navigateTo("customer-details", { customerId });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <CustomersHeader />

      {/* Search */}
      <CustomerSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {loadError && (
        <p className="text-sm text-red-600" role="alert">{loadError}</p>
      )}

      {/* Customers Table */}
      <CustomersTable
        customers={filteredCustomers}
        onViewCustomer={handleViewCustomer}
        loading={loading}
      />

    </div>
  );
}
