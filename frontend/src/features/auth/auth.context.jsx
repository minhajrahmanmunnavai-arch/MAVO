
import { createContext, useState, useEffect, useCallback } from "react";
import { getMe } from "./services/auth.api.js";
import ShowToast from "./components/Showtoast/Showtoast.jsx";
import { resumeLiveUpdates } from "./services/liveUpdates.api.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Toast State
    const [toast, setToast] = useState(null);

    // Show Toast
    const showToast = useCallback((message, type = "info") => {
        setToast({ message, type });
    }, []);

    // Close Toast
    const closeToast = useCallback(() => {
        setToast(null);
    }, []);

    // Check Authentication
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await getMe();

                // User থাকলে সেট করব, না থাকলে null
                setUser(data?.user || null);
                if (data?.user) resumeLiveUpdates();

            } catch (error) {
                setUser(null);

                // 401 হলে Toast দেখানোর প্রয়োজন নেই
                if (error.response?.status !== 401) {
                    showToast(
                        error.response?.data?.message || "Something went wrong!",
                        "error"
                    );
                }

            } finally {
                setLoading(false);
            }
        };

        checkAuth();

    }, [showToast]);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                setLoading,
                showToast,
            }}
        >
            {children}

            {toast && (
                <ShowToast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}
        </AuthContext.Provider>
    );
};
