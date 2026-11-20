import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Left from "./Left"
import Middle from "./Middle"
import AccountMenuItems from "./AccountMenuItems.jsx"
import Searchbar from "./Searchbar"
import Right from "./Right"
import "./Bottom.css"

const Bottom = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="relative z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-3 px-4 py-2 sm:px-6 lg:flex-nowrap lg:gap-8 lg:px-10 xl:px-16">
        <Left />
        <Middle className="hidden lg:flex" />
        <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:order-last lg:ml-auto">
          <Searchbar />
          <Right />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-primary-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-700 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-700 lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X aria-hidden="true" className="navbar-menu-icon" />
            ) : (
              <Menu aria-hidden="true" className="navbar-menu-icon" />
            )}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay lg:hidden">
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            id="mobile-primary-navigation"
            className="mobile-menu-drawer"
            aria-label="Navigation menu"
          >
            <div className="mobile-menu-header">
              <span className="font-serif text-lg text-stone-900">Menu</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-700 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-700"
              >
                <X aria-hidden="true" className="navbar-menu-icon" />
              </button>
            </div>
            <Middle
              mobile
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
            <section className="mobile-account-menu">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Account
              </h2>
              <AccountMenuItems
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

export default Bottom