
import React from "react";
import ConfirmModal from "../../common/ConfirmModal.jsx";

export default function CategoryDeleteModal({
  catToDelete,
  onClose,
  onConfirm,
  error = "",
}) {
  return (
    <ConfirmModal
      isOpen={Boolean(catToDelete)}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Category"
      message={`Are you sure you want to remove "${catToDelete?.name}"? Categories assigned to products cannot be deleted.`}
      confirmText="Delete"
      isDanger={true}
      error={error}
    />
  );
}
