import { useState } from "react";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  Ticket,
  Image as ImageIcon,
  Star,
  BarChart3,
  Bell,
  SlidersHorizontal,
  UserCheck,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

const SidebarNavigation = ({
  currentRoute,
  navigateTo,
  isSidebarCollapsed,
  unreadCount,
  orderCount,
  chatConversationCount,
  reviewCount,
}) => {

  const [isCatalogOpen, setIsCatalogOpen] = useState(true);

  const navGroups = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          route: "dashboard",
          icon: LayoutDashboard,
        },
      ],
    },

    {
      title: "Catalog",
      isGroup: true,
      label: "Products",
      icon: Package,
      isOpen: isCatalogOpen,
      toggle: () => setIsCatalogOpen((prev) => !prev),

      children: [
        { label: "All Products", route: "products" },
        { label: "Add Product", route: "add-product" },
        { label: "Categories", route: "categories" },
        { label: "Inventory", route: "inventory" },
      ],
    },

    {
      title: "Sales & Partners",
      items: [
        {
          label: "Orders",
          route: "orders",
          icon: ShoppingCart,
          badge: orderCount > 0 ? String(orderCount > 99 ? "99+" : orderCount) : null,
          badgeColor: "bg-red-50 text-red-600",
        },
        {
          label: "Order Chats",
          route: "messages",
          icon: MessageCircle,
          badge: chatConversationCount > 0
            ? String(chatConversationCount > 99 ? "99+" : chatConversationCount)
            : null,
          badgeColor: "bg-blue-50 text-blue-600",
        },
        {
          label: "Customers",
          route: "customers",
          icon: Users,
        },
        {
          label: "Sellers",
          route: "sellers",
          icon: Store,
          badge: "3",
          badgeColor: "bg-amber-50 text-amber-600",
        },
      ],
    },

    {
      title: "Marketing & Content",
      items: [
        { label: "Coupons", route: "coupons", icon: Ticket },
        { label: "Banners", route: "banners", icon: ImageIcon },
        {
          label: "Reviews",
          route: "reviews",
          icon: Star,
          badge: reviewCount > 0 ? String(reviewCount > 99 ? "99+" : reviewCount) : null,
          badgeColor: "bg-amber-50 text-amber-600",
        },
      ],
    },

    {
      title: "Administration",
      items: [
        { label: "Analytics", route: "analytics", icon: BarChart3 },
        {
          label: "Notifications",
          route: "notifications",
          icon: Bell,
          badge: unreadCount > 0 ? String(unreadCount) : null,
          badgeColor: "bg-blue-50 text-blue-600",
        },
        {
          label: "Store Settings",
          route: "settings",
          icon: SlidersHorizontal,
        },
        {
          label: "Admin Profile",
          route: "profile",
          icon: UserCheck,
        },
      ],
    },
  ];

  const catalogRoutes = [
    "products",
    "add-product",
    "edit-product",
    "categories",
    "inventory",
  ];

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

      {navGroups.map((group, gIdx) => (
        <div key={gIdx} className="space-y-1">

          {!isSidebarCollapsed && (
            <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              {group.title}
            </div>
          )}

          {/* Catalog Group */}
          {group.isGroup ? (
            <div>

              <button
                type="button"
                onClick={group.toggle}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  catalogRoutes.includes(currentRoute)
                    ? "bg-blue-50 text-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                title={isSidebarCollapsed ? group.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <group.icon className="w-4 h-4 shrink-0" />

                  {!isSidebarCollapsed && (
                    <span>{group.label}</span>
                  )}
                </div>

                {!isSidebarCollapsed && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      group.isOpen
                        ? "rotate-90 text-black"
                        : "text-gray-400"
                    }`}
                  />
                )}
              </button>

              {!isSidebarCollapsed && group.isOpen && (
                <div className="ml-7 pl-3 border-l border-gray-200 mt-1 space-y-1">

                  {group.children.map((child) => (
                    <button
                      key={child.route}
                      type="button"
                      onClick={() => navigateTo(child.route)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        currentRoute === child.route
                          ? "text-gray-700 font-semibold bg-blue-50"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {child.label}
                    </button>
                  ))}

                </div>
              )}
            </div>

          ) : (

            /* Normal Navigation Items */
            group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route ||
                (item.route === "reviews" && currentRoute === "review-details");

              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => navigateTo(item.route)}
                  className={`w-full flex items-center cursor-pointer justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-black text-white shadow-sm shadow-blue-600/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-white" : "text-gray-500"
                      }`}
                    />

                    {!isSidebarCollapsed && (
                      <span>{item.label}</span>
                    )}
                  </div>

                  {!isSidebarCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        item.badgeColor || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })
          )}

        </div>
      ))}

    </nav>
  );
};

export default SidebarNavigation;