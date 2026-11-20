
import React from 'react';
import ConfirmModal from '../../common/ConfirmModal.jsx';

export default function CouponDeleteModal({
  coupon,
  onClose,
  onConfirm
}) {
  return (
    <ConfirmModal
      isOpen={Boolean(coupon)}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Coupon"
      message={`Are you sure you want to remove promotion code "${coupon?.code}"? Customers will no longer be able to apply it.`}
      confirmText="Delete Coupon"
      isDanger={true}
    />
  );
}
