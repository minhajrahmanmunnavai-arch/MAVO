import { Plus, Trash2 } from 'lucide-react';

const TechnicalSpecifications = () => {

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">

      <div className="flex items-center justify-between border-b border-gray-200 pb-3">

        <div>
          <h2 className="text-sm font-bold text-gray-500">
            3. Technical Specifications
          </h2>

          <p className="text-[11px] text-slate-400">
            Dynamic name and value attributes
          </p>
        </div>

        <button
          type="button"
          className="px-5 py-2 cursor-pointer bg-black hover:bg-gray-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Attribute
        </button>

      </div>

      <div className="space-y-2.5">

        <div className="flex items-center gap-2">

          <input
            type="text"
            placeholder="Specification (e.g. RAM, Driver)"
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 outline-0"
          />

          <input
            type="text"
            placeholder="Value (e.g. 16GB, 40mm Titanium)"
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 outline-0"
          />

          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
            title="Remove Specification"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

        </div>

        <div className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-800 rounded-lg">
          No technical specifications listed. Click "Add Attribute" to specify hardware details.
        </div>

      </div>

    </div>
  );
};

export default TechnicalSpecifications;