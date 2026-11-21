
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../../Hooks/useAuth.js";
import { useWishlist } from "../../Hooks/useWishlist.js";
import { useCart } from "../../Hooks/useCart.js";
import Loading from "../Loading/Loading.jsx";
import ShowToast from "../Showtoast/Showtoast.jsx";
import Notifications from "../Main/Notifications/Notifications.jsx";
import "./Right.css";

const Right = () => {
    const navigate = useNavigate();

    const { loading, user, handleLogout } = useAuth();
    const { wishlist } = useWishlist();
    const { cartCount } = useCart();

    const [isOpen, setIsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [toast, setToast] = useState(null);
    const notificationsRef = useRef(null);
    const wishlistCount = wishlist.length;
    const handleNotificationCountChange = useCallback((count) => {
        setNotificationCount(count);
    }, []);

    useEffect(() => {
        if (!isNotificationsOpen) return undefined;

        const handlePointerDown = (event) => {
            if (!notificationsRef.current?.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isNotificationsOpen]);

    // Account dropdown open / close
    const toggleDropdown = () => {
        setIsNotificationsOpen(false);
        setIsOpen((prev) => !prev);
    };

    const handleUserLogout = async () => {
        try {
            await handleLogout();
            setIsOpen(false);
            setToast({
                message: "Logout successful! See you next time.",
                type: "success",
            });
            setTimeout(() => navigate("/"), 1500);
        } catch (error) {
            console.error("Logout failed:", error);
            setToast({
                message:
                    error.response?.data?.message ||
                    "Logout failed. Please try again.",
                type: "error",
            });
        }
    };

    // Authentication Loading
    if (loading) {
        return <Loading />;
    }

    return (
        <div className="relative">

            {/* Header Icons */}
            <div className="navbar-actions flex flex-row items-center gap-2 sm:gap-3 md:gap-5">

                {/* Notifications */}
                <div ref={notificationsRef} className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            setIsNotificationsOpen((open) => !open);
                        }}
                        aria-label={`Notifications, ${notificationCount} updates`}
                        aria-expanded={isNotificationsOpen}
                        aria-controls="navbar-notifications-panel"
                        className="relative rounded-full p-2 text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-700"
                    >
                        <Bell aria-hidden="true" className="navbar-action-icon" />
                        {notificationCount > 0 && (
                            <span
                                aria-hidden="true"
                                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white"
                            >
                                {notificationCount > 99 ? "99+" : notificationCount}
                            </span>
                        )}
                    </button>
                    <div
                        id="navbar-notifications-panel"
                        role="dialog"
                        aria-label="Notifications panel"
                        hidden={!isNotificationsOpen}
                        className="absolute right-0 top-full z-60 mt-3 max-h-[min(82vh,42rem)] w-[min(92vw,28rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15"
                    >
                        <Notifications
                            panel
                            onCountChange={handleNotificationCountChange}
                            onNotificationClick={() => setIsNotificationsOpen(false)}
                            onClose={() => setIsNotificationsOpen(false)}
                        />
                    </div>
                </div>

                {/* Wishlist */}
                <Link
                    to="/wishlist"
                    aria-label={`Wishlist, ${wishlist.length} saved`}
                    className="relative rounded-md p-1.5 transition-colors hover:bg-gray-300"
                >
                    <svg
                        className="navbar-action-icon text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                        />
                    </svg>

                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                        {wishlistCount}
                    </span>
                </Link>

                {/* Cart */}
                <Link
                    to="/cart"
                    aria-label={`Shopping cart, ${cartCount} items`}
                    className="relative rounded-md p-1.5 transition-colors hover:bg-gray-300"
                >
                    <svg
                        className="navbar-action-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        <path d="M15 7V1" />
                        <path d="m12 4 3-3 3 3" />
                    </svg>
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                        {cartCount > 99 ? "99+" : cartCount}
                    </span>
                </Link>

                {/* Account Dropdown Toggle */}
                <button
                    type="button"
                    onClick={toggleDropdown}
                    aria-label="Toggle account menu"
                    aria-expanded={isOpen}
                    className="account-menu-toggle cursor-pointer rounded-md p-1.5 transition-colors hover:bg-gray-300 focus:outline-none"
                >
                    <svg
                        className="navbar-action-icon text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
                        />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </button>

            </div>

            {/* Account Dropdown Menu */}
            {isOpen && (
                <div className="account-menu-popup absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-gray-100 bg-white px-2 py-3 shadow-xl">

                    <div className="space-y-1">

                        {/* My Account */}
                        <Link
                            to="/account"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <svg
                                className="h-5 w-5 text-gray-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <rect
                                    x="5"
                                    y="3"
                                    width="14"
                                    height="18"
                                    rx="3"
                                    ry="3"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 3v2a2 2 0 0 0 4 0V3"
                                />
                                <circle cx="12" cy="11" r="2" />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 16c0-1.7 1.3-3 3-3s3 1.3 3 3"
                                />
                            </svg>

                            <span>My Account</span>
                        </Link>

                        {/* Order History */}
                        <Link
                            to="/orders"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <svg
                                className="h-5 w-5 text-gray-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                            </svg>

                            <span>Order History</span>
                        </Link>

                        {/* Wishlist */}
                        <Link
                            to="/wishlist"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <svg
                                className="h-5 w-5 text-gray-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                                />
                            </svg>

                            <span>Wishlist</span>
                        </Link>

                    </div>

                    <hr className="my-2 border-gray-100" />

                    <div className="space-y-1">

                        {user ? (
                            <>
                                {/* Logged In User */}
                                <div className="px-3 py-2 text-sm font-medium text-gray-700">
                                    Welcome, {user.username}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleUserLogout}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                    <svg
                                        className="h-5 w-5 text-gray-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                                        />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line
                                            x1="15"
                                            y1="12"
                                            x2="3"
                                            y2="12"
                                        />
                                    </svg>

                                    <span>Logout</span>
                                </button>

                                {user.role === "admin" && (
                                    <Link to="/admin">Admin</Link>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Sign In */}
                                <Link
                                    to="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                    <svg
                                        className="h-5 w-5 text-gray-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                                        />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line
                                            x1="15"
                                            y1="12"
                                            x2="3"
                                            y2="12"
                                        />
                                    </svg>

                                    <span>Sign In</span>
                                </Link>

                                {/* Create Account */}
                                <Link
                                    to="/register"
                                    onClick={() => setIsOpen(false)}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                    <svg
                                        className="h-5 w-5 text-gray-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                                        />
                                        <circle cx="9" cy="7" r="4" />
                                        <line
                                            x1="19"
                                            y1="8"
                                            x2="19"
                                            y2="14"
                                        />
                                        <line
                                            x1="22"
                                            y1="11"
                                            x2="16"
                                            y2="11"
                                        />
                                    </svg>

                                    <span>Create Account</span>
                                </Link>


                            </>
                        )}

                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <ShowToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                    duration={3000}
                />
            )}

        </div>
    );
};

export default Right;
