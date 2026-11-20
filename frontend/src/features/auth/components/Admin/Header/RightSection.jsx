import { useState, useRef, useEffect, useContext } from "react";

import {AdminContext} from "../../contex/AdminContext";

import {
  Bell,
  Plus,
  ChevronDown,
  User,
  SlidersHorizontal,
  LogOut,
  Check,
  ExternalLink,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

const RightSection = () => {

  const {
    navigateTo,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    adminProfile,
    setIsAuthenticated,
  } = useContext(AdminContext);

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [openNotificationMenuId, setOpenNotificationMenuId] = useState(null);
  const [deletingNotificationId, setDeletingNotificationId] = useState(null);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifDropdownOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center gap-2.5 sm:gap-4">

      {/* Notifications */}
      <div className="relative" ref={notifRef}>

        <button
          type="button"
          onClick={() => setIsNotifDropdownOpen((prev) => !prev)}
          className="relative p-2 ml-6 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className="w-4 h-4" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isNotifDropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">

            <div className="p-4 border-b border-gray-200 flex items-center justify-between">

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Notifications
                </span>

                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}

            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">

              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    markNotificationAsRead(item.id);
                    setIsNotifDropdownOpen(false);

                    if (item.route) {
                      if (item.route === "order-details") {
                        navigateTo("order-details", { orderId: item.param });
                      } else if (item.route === "seller-details") {
                        navigateTo("seller-details", { sellerId: item.param });
                      } else {
                        navigateTo(item.route);
                      }
                    }
                  }}
                  className={`p-3.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3 ${!item.read ? "bg-blue-50/50" : ""
                    }`}
                >

                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-500"
                    style={{ opacity: item.read ? 0.2 : 1 }}
                  />

                  <div className="flex-1 min-w-0">

                    <div className="text-xs font-semibold text-gray-900">
                      {item.title}
                    </div>

                    <div className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                      {item.message}
                    </div>

                    <div className="text-[10px] text-gray-400 mt-1 font-mono">
                      {item.timestamp}
                    </div>

                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={`More options for ${item.title}`}
                      aria-haspopup="menu"
                      aria-expanded={openNotificationMenuId === item.id}
                      disabled={deletingNotificationId === item.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenNotificationMenuId((currentId) =>
                          currentId === item.id ? null : item.id
                        );
                      }}
                      className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openNotificationMenuId === item.id && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-[60] mt-1 min-w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          disabled={deletingNotificationId === item.id}
                          onClick={async (event) => {
                            event.stopPropagation();
                            setDeletingNotificationId(item.id);
                            const deleted = await deleteNotification(item.id);
                            setDeletingNotificationId(null);
                            if (deleted) setOpenNotificationMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}

            </div>

            <div className="p-2.5 border-t border-gray-200 text-center bg-gray-50">

              <button
                type="button"
                onClick={() => {
                  setIsNotifDropdownOpen(false);
                  navigateTo("notifications");
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1.5 w-full"
              >
                Open Notification Center
                <ExternalLink className="w-3 h-3" />
              </button>

            </div>

          </div>
        )}

      </div>

      {/* Add Product */}
      <button
        type="button"
        onClick={() => navigateTo("add-product")}
        className="px-5 py-2 cursor-pointer bg-black hover:bg-gray-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Product</span>
      </button>

      {/* Profile Dropdown */}
      <div className="relative" ref={profileRef}>

        <button
          type="button"
          onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 p-1 pl-1.5 rounded-lg cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
          aria-label="User profile menu"
        >

          <div className="relative">
            <img
              src={adminProfile.avatar}
              alt={adminProfile.name}
              className="w-7 h-7 rounded-full object-cover border border-gray-200"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/64x64/e5e7eb/374151?text=A";
              }}
            />

            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <span className="hidden md:inline text-xs font-semibold text-gray-800">
            {adminProfile.name.split(" ")[0]}
          </span>

          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />

        </button>

        {isProfileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">

            <div className="px-3 py-2 border-b border-gray-200 mb-1">
              <div className="text-xs font-bold text-gray-900">
                {adminProfile.name}
              </div>

              <div className="text-[10px] text-gray-500 truncate">
                {adminProfile.email}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsProfileDropdownOpen(false);
                navigateTo("profile");
              }}
              className="w-full text-left px-3 py-2 cursor-pointer rounded-lg text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2.5 transition-colors"
            >
              <User className="w-4 h-4 text-gray-500" />
              My Profile
            </button>

            <button
              type="button"
              onClick={() => {
                setIsProfileDropdownOpen(false);
                navigateTo("settings");
              }}
              className="w-full text-left px-3 py-2 cursor-pointer rounded-lg text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2.5 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              Store Settings
            </button>

            <div className="my-1 border-t border-gray-200" />

            <button
              type="button"
              onClick={() => {
                setIsProfileDropdownOpen(false);
                setIsAuthenticated(false);
              }}
              className="w-full text-left px-3 py-2 cursor-pointer rounded-lg text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>

          </div>
        )}

      </div>

    </div>
  );
};

export default RightSection;