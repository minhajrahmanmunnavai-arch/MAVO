
import React, { useState } from 'react';
import { useAdmin } from '../../contex/AdminContext.jsx';

// Components
import CouponsHeader from './components/CouponsHeader';
import CouponsTable from './components/CouponsTable';
import CouponFormModal from './components/CouponFormModal';
import CouponDeleteModal from './components/CouponDeleteModal';

export default function CouponsPage() {
  const {
    coupons,
    couponsLoading,
    couponsError,
    addCoupon,
    deleteCoupon,
    addToast
  } = useAdmin();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [actionError, setActionError] = useState('');

  // Generate Random Coupon Code
  const generateRandomCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const num = Math.floor(10 + Math.random() * 90);

    let randStr = 'MOX';

    for (let i = 0; i < 4; i++) {
      randStr += letters.charAt(
        Math.floor(Math.random() * letters.length)
      );
    }

    return `${randStr}${num}`;
  };

  // Open Add Coupon Modal
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  // Create Coupon
  const handleCreateCoupon = async (couponData) => {
    setActionError('');
    try {
      await addCoupon({
        ...couponData,
        code: couponData.code.toUpperCase().trim(),
        discountValue: Number(couponData.discountValue),
        minPurchase: Number(couponData.minPurchase),
        maxDiscount: Number(couponData.maxDiscount),
        usageLimit: Number.parseInt(couponData.usageLimit, 10),
        status: 'Active'
      });
      setIsAddModalOpen(false);
    } catch (error) {
      setActionError(
        error.response?.data?.message || error.message || 'Unable to create coupon.'
      );
    }
  };

  // Copy Coupon Code
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);

    addToast({
      title: 'Copied',
      message: `Code ${code} copied.`,
      type: 'info'
    });
  };

  // Delete Coupon
  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;

    setActionError('');
    try {
      await deleteCoupon(couponToDelete.id);
      setCouponToDelete(null);
    } catch (error) {
      setActionError(
        error.response?.data?.message || error.message || 'Unable to delete coupon.'
      );
    }
  };

  return (
    <div className="space-y-6">

      <CouponsHeader
        onCreateCoupon={handleOpenAddModal}
      />

      {(couponsError || actionError) && (
        <p className="text-sm text-red-600" role="alert">
          {actionError || couponsError}
        </p>
      )}

      <CouponsTable
        coupons={coupons}
        loading={couponsLoading}
        onCopyCode={handleCopyCode}
        onDeleteCoupon={setCouponToDelete}
      />

      <CouponFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateCoupon}
        generateRandomCode={generateRandomCode}
      />

      <CouponDeleteModal
        coupon={couponToDelete}
        onClose={() => setCouponToDelete(null)}
        onConfirm={handleDeleteCoupon}
      />

    </div>
  );
}
