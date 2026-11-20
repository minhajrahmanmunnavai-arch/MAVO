
import React from 'react';
import { useAdmin } from '../../contex/AdminContext.jsx';

// Components
import CustomerBackButton from './components/CustomerBackButton';
import CustomerDetailsHeader from './components/CustomerDetailsHeader';
import CustomerMetrics from './components/CustomerMetrics';
import CustomerOrderHistory from './components/CustomerOrderHistory';
import CustomerNotFound from './components/CustomerNotFound';

export default function CustomerDetailsPage() {
  const {
    customers,
    orders,
    customersLoading,
    ordersLoading,
    selectedCustomerId,
    navigateTo
  } = useAdmin();

  const customer = customers.find((item) => item.id === selectedCustomerId);

  const customerOrders = customer ? orders.filter(
    (o) =>
      o.customer?.id === customer.id ||
      o.customer?.email === customer.email
  ) : [];

  if (customersLoading) {
    return <p className="text-sm text-gray-500" role="status">Loading customer details...</p>;
  }

  if (!customer) {
    return <CustomerNotFound onBack={() => navigateTo('customers')} />;
  }

  const handleViewOrder = (orderId) => {
    navigateTo('order-details', { orderId });
  };

  return (
    <div className="space-y-6">

      <CustomerBackButton
        onBack={() => navigateTo('customers')}
      />

      <CustomerDetailsHeader customer={customer} />

      <CustomerMetrics customer={customer} />

      <CustomerOrderHistory
        orders={customerOrders}
        onViewOrder={handleViewOrder}
        loading={ordersLoading}
      />

    </div>
  );
}
