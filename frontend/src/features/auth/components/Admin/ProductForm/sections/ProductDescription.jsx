import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading
} from 'lucide-react';

const ProductDescription = ({ description, setDescription }) => {

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">

      <h2 className="text-sm font-bold text-white border-b border-gray-200 pb-3">
        2. Product Description
      </h2>

      {/* Rich Editor Toolbar */}

      <div className="flex items-center gap-1 bg-white border border-gray-300 p-1.5 rounded-lg flex-wrap">

        <button
          type="button"
          className="p-1.5 cursor-pointer text-gray-500 hover:text-gray-700 rounded hover:bg-gray-300"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          className="p-1.5 cursor-pointer text-gray-500 hover:text-gray-700 rounded hover:bg-gray-300"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          className="p-1.5 cursor-pointer text-gray-500 hover:text-gray-700 rounded hover:bg-gray-300"
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <button
          type="button"
          className="p-1.5 cursor-pointer text-gray-500 hover:text-gray-700 rounded hover:bg-gray-300"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          className="p-1.5 cursor-pointer text-gray-500 hover:text-gray-700 rounded hover:bg-gray-300"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          className="p-1.5 cursor-pointer text-gray-500 hover:text-gray-700 rounded hover:bg-gray-300"
          title="Heading"
        >
          <Heading className="w-3.5 h-3.5" />
        </button>

      </div>

      <textarea
        rows="5"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-500 outline-0 leading-relaxed font-sans"
        placeholder="Provide a detailed, editorial description highlighting materials, architecture, and ergonomics..."
      />

    </div>
  );
};

export default ProductDescription;