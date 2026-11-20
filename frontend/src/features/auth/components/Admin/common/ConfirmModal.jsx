const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  isDanger = false,
  error = "",
  isLoading = false,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60 ${
              isDanger
                ? "bg-red-600 hover:bg-red-500"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {isLoading ? "Deleting..." : confirmText}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmModal;
