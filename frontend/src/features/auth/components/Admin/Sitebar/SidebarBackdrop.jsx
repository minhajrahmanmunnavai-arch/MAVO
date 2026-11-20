const SidebarBackdrop = ({
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}) => {
  if (!isMobileSidebarOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm lg:hidden transition-opacity"
      onClick={() => setIsMobileSidebarOpen(false)}
    />
  );
};

export default SidebarBackdrop;