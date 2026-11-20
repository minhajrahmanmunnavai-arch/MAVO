import { Menu } from "lucide-react";

const LeftSection = ({ setIsMobileSidebarOpen, navigateTo }) => {
  return (
    <div className="flex items-center gap-4">

      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white transition-colors"
        aria-label="Open mobile menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => navigateTo("dashboard")}
        className="text-xs font-semibold text-black"
      >
        MAVO Store
      </button>

    </div>
  );
};

export default LeftSection;