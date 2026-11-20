import { useContext } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, register, logout } from "../services/auth.api.js";
import { pauseLiveUpdates, resumeLiveUpdates } from "../services/liveUpdates.api.js";

export const useAuth = () => {
    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading, showToast } = context;

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            if (!data || !data.user) {
                throw new Error("There is no user with this email address or the password is incorrect.");
            }
            setUser(data.user);
            resumeLiveUpdates();
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });

            if (!data || !data.user) {
                throw new Error("A user already exists with this email address.");
            }
            setUser(data.user);
            resumeLiveUpdates();
        } catch (error) {
            throw error; // Rethrow the error to be handled by the caller
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
            pauseLiveUpdates();
        } catch (error) {
            throw error; // Rethrow the error to be handled by the caller
        } finally {
            setLoading(false);
        }
    }

    return {
        user,
        loading,
        showToast,
        handleLogin,
        handleRegister,
        handleLogout
    }
}