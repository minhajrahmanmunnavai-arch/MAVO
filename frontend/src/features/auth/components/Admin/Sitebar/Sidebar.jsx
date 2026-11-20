import { useContext } from "react";
import { AdminContext } from "../../contex/AdminContext.jsx";

import SidebarHeader from "./SidebarHeader.jsx";
import SidebarNavigation from "./SidebarNavigation.jsx";
import SidebarFooter from "./SidebarFooter.jsx";
import SidebarBackdrop from "./SidebarBackdrop.jsx";

export default function Sidebar() {
  const {
    currentRoute,
    navigateTo,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    unreadCount,
    orders,
    chatConversationCount,
    reviewCount,
    adminProfile,
    setIsAuthenticated,
  } = useContext(AdminContext);

  return (
    <>
      <SidebarBackdrop
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40
          bg-white border-r border-gray-200
          flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "w-20" : "w-64"}
          ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <SidebarHeader
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          navigateTo={navigateTo}
        />

        <SidebarNavigation
          currentRoute={currentRoute}
          navigateTo={navigateTo}
          isSidebarCollapsed={isSidebarCollapsed}
          unreadCount={unreadCount}
          orderCount={orders.length}
          chatConversationCount={chatConversationCount}
          reviewCount={reviewCount}
        />

        <SidebarFooter
          adminProfile={adminProfile}
          isSidebarCollapsed={isSidebarCollapsed}
          navigateTo={navigateTo}
          setIsAuthenticated={setIsAuthenticated}
        />
      </aside>
    </>
  );
}