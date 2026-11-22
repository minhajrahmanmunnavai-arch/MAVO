import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpLeft, Search, Tag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Hooks/useAuth.js";
import { useProduct } from "../../Hooks/useProduct.js";
import { getProductSearchSuggestions } from "../../utils/productSearch.js";

const SEARCH_HISTORY_LIMIT = 8;

function getHistoryStorageKey(user) {
  const userIdentifier = user?._id || user?.id || user?.email || "guest";
  return `mavo:search-history:${encodeURIComponent(
    String(userIdentifier).toLowerCase()
  )}`;
}

function readSearchHistory(storageKey) {
  const storedHistory = window.localStorage.getItem(storageKey);
  if (!storedHistory) return [];

  const parsedHistory = JSON.parse(storedHistory);
  if (!Array.isArray(parsedHistory)) {
    throw new Error("Saved search history has an invalid format.");
  }

  return parsedHistory
    .filter((entry) => typeof entry === "string" && entry.trim())
    .slice(0, SEARCH_HISTORY_LIMIT);
}

const Searchbar = () => {
  const navigate = useNavigate();
  const { user, showToast } = useAuth();
  const { products } = useProduct();
  const inputRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeSearch, setActiveSearch] = useState(null);
  const [searchHistory, setSearchHistory] = useState({ key: "", entries: [] });
  const historyStorageKey = getHistoryStorageKey(user);
  const historyEntries =
    searchHistory.key === historyStorageKey ? searchHistory.entries : [];
  const suggestions = useMemo(
    () => getProductSearchSuggestions(products, query),
    [products, query]
  );

  const loadSearchHistory = () => {
    try {
      setSearchHistory({
        key: historyStorageKey,
        entries: readSearchHistory(historyStorageKey),
      });
    } catch (error) {
      showToast(
        error.message || "Unable to load your search history.",
        "error"
      );
      setSearchHistory({ key: historyStorageKey, entries: [] });
    }
  };

  useEffect(() => {
    if (!isMobileSearchOpen) return undefined;

    inputRef.current?.focus();
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (!activeSearch && !isMobileSearchOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        !mobileSearchRef.current?.contains(event.target) &&
        !desktopSearchRef.current?.contains(event.target)
      ) {
        setActiveSearch(null);
        setIsMobileSearchOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveSearch(null);
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeSearch, isMobileSearchOpen]);

  const saveSearchHistory = (entries) => {
    setSearchHistory({ key: historyStorageKey, entries });
    try {
      window.localStorage.setItem(historyStorageKey, JSON.stringify(entries));
    } catch (error) {
      showToast(
        error.message || "Unable to save your search history.",
        "error"
      );
    }
  };

  const rememberSearch = (searchTerm) => {
    const entries = [
      searchTerm,
      ...historyEntries.filter(
        (entry) => entry.toLowerCase() !== searchTerm.toLowerCase()
      ),
    ].slice(0, SEARCH_HISTORY_LIMIT);
    saveSearchHistory(entries);
  };

  const executeSearch = (searchTerm) => {
    const normalizedSearch = searchTerm.trim();
    if (normalizedSearch) rememberSearch(normalizedSearch);
    const searchParams = new URLSearchParams();
    if (normalizedSearch) searchParams.set("search", normalizedSearch);
    const queryString = searchParams.toString();
    navigate(`/shop-catalog${queryString ? `?${queryString}` : ""}`);
    setActiveSearch(null);
    setIsMobileSearchOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    executeSearch(query);
  };

  const searchInput = (variant, className, inputRefProp) => {
    const matchingSuggestions = activeSearch === variant && query.trim()
      ? suggestions
      : [];
    const visibleHistory =
      activeSearch === variant && !query.trim() ? historyEntries : [];

    return (
      <div className="relative">
        <form onSubmit={submitSearch} role="search" className={className}>
          <Search
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-stone-500"
          />
          <input
            ref={inputRefProp}
            type="search"
            value={query}
            onFocus={() => {
              setActiveSearch(variant);
              loadSearchHistory();
            }}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search products"
            aria-expanded={
              matchingSuggestions.length > 0 || visibleHistory.length > 0
            }
            placeholder="Search products..."
            className="search min-w-1 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black"
          >
            Search
          </button>
        </form>

        {(matchingSuggestions.length > 0 || visibleHistory.length > 0) && (
          <div
            className="absolute left-0 top-full z-[70] mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white py-2 shadow-xl"
            role={matchingSuggestions.length > 0 ? "listbox" : "list"}
            aria-label={
              matchingSuggestions.length > 0
                ? "Product suggestions"
                : "Recent searches"
            }
          >
            {matchingSuggestions.length > 0 ? (
              <>
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Products
                </p>
                {matchingSuggestions.map((suggestion) => {
                  return (
                    <button
                      key={`${suggestion.product._id || suggestion.productTitle}:${suggestion.text}`}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => executeSearch(suggestion.text)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                    >
                      {suggestion.type === "keyword" ? (
                        <Tag
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-stone-400"
                        />
                      ) : (
                        <Search
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-stone-400"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {suggestion.text}
                      </span>
                      {suggestion.type === "keyword" && (
                        <span className="shrink-0 text-xs text-stone-400">
                          {suggestion.productTitle}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Recent searches
                </p>
                {visibleHistory.map((entry) => (
                  <div
                    key={entry}
                    role="listitem"
                    className="flex items-center gap-2 px-2 py-1"
                  >
                    <button
                      type="button"
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => executeSearch(entry)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                    >
                      <ArrowUpLeft
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-stone-400"
                      />
                      <span className="truncate">{entry}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${entry} from search history`}
                      title={`Delete ${entry}`}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() =>
                        saveSearchHistory(
                          historyEntries.filter(
                            (historyEntry) => historyEntry !== entry
                          )
                        )
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center">
      <div
        ref={mobileSearchRef}
        className="mobile-search-trigger relative lg:hidden"
      >
        <button
          type="button"
          onClick={() => {
            if (isMobileSearchOpen) setActiveSearch(null);
            setIsMobileSearchOpen((open) => !open);
          }}
          aria-label={isMobileSearchOpen ? "Close product search" : "Search products"}
          aria-expanded={isMobileSearchOpen}
          aria-controls="mobile-product-search"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-700 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-700"
        >
          {isMobileSearchOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Search aria-hidden="true" className="h-5 w-5" />
          )}
        </button>

        {isMobileSearchOpen && (
          <div
            id="mobile-product-search"
            className="mobile-search-panel absolute right-0 top-full z-[60] mt-3 w-[min(90vw,24rem)] rounded-xl border border-stone-200 bg-white p-3 shadow-xl"
          >
            {searchInput(
              "mobile",
              "flex h-11 items-center gap-3 rounded-lg bg-stone-100 px-3",
              inputRef
            )}
          </div>
        )}
      </div>

      <div
        ref={desktopSearchRef}
        className="desktop-search-input hidden lg:block"
      >
        {searchInput(
          "desktop",
          "flex h-11 w-full min-w-0 items-center gap-3 rounded-xl bg-[#f5f5f4] px-3 sm:px-4 lg:w-56 xl:w-72",
          null
        )}
      </div>
    </div>
  );
};

export default Searchbar;
