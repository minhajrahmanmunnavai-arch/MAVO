import { useAdmin } from "../../contex/AdminContext.jsx";

import LeftSection from "./LeftSection.jsx";
import MiddleSection from "./MiddleSection.jsx";
import RightSection from "./RightSection.jsx";

const Header = () => {
  const {
    currentRoute,
    navigateTo,
    setIsMobileSidebarOpen,
    setIsSearchModalOpen,
  } = useAdmin();

  return (
    <header className="h-16 bg-white backdrop-blur-md border-b border-gray-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">

      <LeftSection
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        navigateTo={navigateTo}
      />

      <MiddleSection
        currentRoute={currentRoute}
        navigateTo={navigateTo}
        setIsSearchModalOpen={setIsSearchModalOpen}
      />

      <RightSection />

    </header>
  );
};

export default Header;