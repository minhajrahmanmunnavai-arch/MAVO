import React from "react";
import ConfirmModal from "../../common/ConfirmModal.jsx";

const ProductDeleteModals = ({
  productToDelete,
  setProductToDelete,
  isBulkDeleteModalOpen,
  setIsBulkDeleteModalOpen,
  selectedCount,
  deleteProduct,
  handleBulkDelete,
  deleteError,
  deleting,
}) => {
  return (
    <>
      {/* Single Product Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={async () => {
          if (productToDelete) {
            const deleted = await deleteProduct(productToDelete.id);
            if (deleted) {
              setProductToDelete(null);
            }
          }
        }}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${productToDelete?.name}"? All inventory listings and SKUs will be removed.`}
        confirmText="Delete Product"
        isDanger={true}
        error={deleteError}
        isLoading={deleting}
      />

      {/* Bulk Delete Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Bulk Delete Products"
        message={`Are you sure you want to delete ${selectedCount} selected products? This action cannot be reversed.`}
        confirmText={`Delete ${selectedCount} Items`}
        isDanger={true}
        error={deleteError}
        isLoading={deleting}
      />
    </>
  );
};

export default ProductDeleteModals;