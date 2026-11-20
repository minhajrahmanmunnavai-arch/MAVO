
import React from "react";
import ConfirmModal from "../../common/ConfirmModal.jsx";

export default function OrderStatusModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  selectedNewStatus,
}) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Update Order Status"
      message={`Are you sure you want to transition Order #${orderId} to "${selectedNewStatus}"? Automated dispatch alerts will be dispatched to the buyer.`}
      confirmText={`Change to ${selectedNewStatus}`}
      isDanger={selectedNewStatus === "Cancelled"}
    />
  );
}
