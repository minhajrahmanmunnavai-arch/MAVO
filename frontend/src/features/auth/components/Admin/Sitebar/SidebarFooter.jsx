import { LogOut } from "lucide-react";

const SidebarFooter = ({
  adminProfile,
  isSidebarCollapsed,
  navigateTo,
  setIsAuthenticated,
}) => {
  return (
    <div className="p-3 border-t border-gray-200 shrink-0">

      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200">

        {/* Admin Profile */}
        <div
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
          onClick={() => navigateTo("profile")}
        >
          <img
            src={adminProfile.avatar}
            alt={adminProfile.name}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/64x64/e5e7eb/374151?text=A";
            }}
          />

          {!isSidebarCollapsed && (
            <div className="min-w-0 truncate">
              <div className="text-xs font-bold text-gray-900 truncate">
                {adminProfile.name}
              </div>

              <div className="text-[10px] text-gray-500 truncate">
                {adminProfile.role}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        {!isSidebarCollapsed && (
          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

      </div>

    </div>
  );
};

export default SidebarFooter;