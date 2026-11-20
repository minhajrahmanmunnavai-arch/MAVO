const InventorySection = ({ stock, lowStock, setStock, setLowStock, fieldErrors = {}, onRequiredFieldChange = () => {} }) => {

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">

      <h2 className="text-sm font-bold text-gray-500 border-b border-gray-200 pb-3">
        Stock & Availability
      </h2>

      <div className="space-y-3">

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Physical Stock Available <span className="text-red-400">*</span>
          </label>

          <input
            type="number"
            placeholder="50"
            value={stock}
            min="0"
            aria-invalid={Boolean(fieldErrors.stock)}
            aria-describedby={fieldErrors.stock ? "stock-error" : undefined}
            onChange={(e) => {
              const value = e.target.value;
              if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
                return;
              }

              setStock(value);
              onRequiredFieldChange("stock", value);
            }}
            className={`w-full bg-white cursor-pointer border ${fieldErrors.stock ? "border-red-500" : "border-gray-300"} rounded-lg px-3.5 py-2 text-xs text-gray-500 outline-0`}
          />
          {fieldErrors.stock && <p id="stock-error" className="mt-1 text-xs text-red-500">This field is required</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Low Stock Threshold Alert
          </label>

          <input
            type="number"
            value={lowStock}
            min="0"
            onChange={(e) => {
              const value = e.target.value;
              if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
                return;
              }

              setLowStock(value);
            }}
            placeholder="10"
            className="w-full bg-white border cursor-pointer border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-500 outline-0"
          />
        </div>

      </div>

    </div>
  );
};

export default InventorySection;