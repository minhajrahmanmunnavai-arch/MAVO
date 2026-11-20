import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Hooks/useAuth.js";

const AccountMenuItems = ({ onClose }) => {
    const navigate = useNavigate();
    const { user, loading, handleLogout, showToast } = useAuth();

    const handleUserLogout = async () => {
        try {
            await handleLogout();
            onClose?.();
            showToast("Logout successful! See you next time.", "success");
            setTimeout(() => navigate("/"), 1500);
        } catch (error) {
            console.error("Logout failed:", error);
            showToast(
                error.response?.data?.message || "Logout failed. Please try again.",
                "error"
            );
        }
    };

    if (loading) {
        return (
            <p className="px-3 py-3 text-sm text-gray-500" role="status">
                Loading account...
            </p>
        );
    }

    return (
        <div className="account-menu-items">
            <div className="space-y-1">
                <Link
                    to="/account"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                    <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <rect x="5" y="3" width="14" height="18" rx="3" ry="3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 3v2a2 2 0 0 0 4 0V3" />
                        <circle cx="12" cy="11" r="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 16c0-1.7 1.3-3 3-3s3 1.3 3 3" />
                    </svg>
                    <span>My Account</span>
                </Link>

                <Link
                    to="/orders"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                    <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Order History</span>
                </Link>

                <Link
                    to="/wishlist"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                    <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    <span>Wishlist</span>
                </Link>
            </div>

            <hr className="my-2 border-gray-100" />

            <div className="space-y-1">
                {user ? (
                    <>
                        <div className="px-3 py-2 text-sm font-medium text-gray-700">
                            Welcome, {user.username}
                        </div>
                        <button
                            type="button"
                            onClick={handleUserLogout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                            <span>Logout</span>
                        </button>
                        {user.role === "admin" && (
                            <Link
                                to="/admin"
                                onClick={onClose}
                                className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                Admin
                            </Link>
                        )}
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            onClick={onClose}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                            <span>Sign In</span>
                        </Link>

                        <Link
                            to="/register"
                            onClick={onClose}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            <span>Create Account</span>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccountMenuItems;
