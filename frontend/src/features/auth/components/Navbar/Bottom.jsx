import { useState } from "react";
import { Menu, X } from "lucide-react";
import Left from "./Left"
import Middle from "./Middle"
import Searchbar from "./Searchbar"
import Right from "./Right"

const Bottom = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-8 lg:px-10 xl:px-16">
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
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div
          id="mobile-primary-navigation"
          className="border-t border-stone-100 bg-white px-4 py-3 shadow-lg sm:px-6 lg:hidden"
        >
          <Middle
            mobile
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

export default Bottom