import { ChevronRight, ChevronLeft } from "lucide-react";

const SidebarHeader = ({
  isSidebarCollapsed,
  toggleSidebar,
  navigateTo,
}) => {
  return (
    <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between shrink-0">

      {/* Brand */}
      <div
        className="flex items-center gap-3 cursor-pointer overflow-hidden"
        onClick={() => navigateTo("dashboard")}
      >
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-black to-black flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0">
          M
        </div>

        {!isSidebarCollapsed && (
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">
              MAVO
            </span>

            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
              Admin
            </span>
          </div>
        )}
      </div>

      {/* Desktop Toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

    </div>
  );
};

export default SidebarHeader;