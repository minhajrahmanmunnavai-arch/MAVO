
import axios from 'axios';

const apiBaseURL = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? 'https://mavo-hzbl.onrender.com' : '')
).replace(/\/+$/, '');

export const api = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true,
    timeout: 60000
});

// Refresh API-এর জন্য আলাদা Axios instance
const refreshApi = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true,
    timeout: 60000
});

const USER_FACING_API_ERROR = "Something went wrong. Please try again.";
const TECHNICAL_ERROR_PATTERN =
    /AxiosError|Network Error|API connection failed|Could not connect|ECONN|ETIMEDOUT|Request failed with status code|timeout/i;

const normalizeApiError = (error) => {
    const isTimeout =
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        /timeout/i.test(error.message || "");
    const isNetworkError = !error.response;

    const responseMessage = error.response?.data?.message;
    const containsTechnicalDetails =
        TECHNICAL_ERROR_PATTERN.test(error.message || "") ||
        TECHNICAL_ERROR_PATTERN.test(
            typeof responseMessage === "string" ? responseMessage : ""
        );

    if (
        isTimeout ||
        isNetworkError ||
        error.response?.status >= 500 ||
        containsTechnicalDetails
    ) {
        error.message = USER_FACING_API_ERROR;
        error.name = "Error";

        if (
            (error.response?.status >= 500 || containsTechnicalDetails) &&
            error.response?.data &&
            typeof error.response.data === "object"
        ) {
            error.response.data = {
                ...error.response.data,
                message: USER_FACING_API_ERROR,
            };
        }
    }

    return error;
};

refreshApi.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(normalizeApiError(error))
);

// Refresh request একসঙ্গে একাধিকবার হওয়া আটকাবে
let isRefreshing = false;
let failedQueue = [];

export function refreshAuthSession() {
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
        return navigator.locks.request('mavo-auth-refresh', () =>
            refreshApi.post('/api/auth/refresh')
        );
    }

    return refreshApi.post('/api/auth/refresh');
}

const processQueue = (error) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve();
        }
    });

    failedQueue = [];
};

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        normalizeApiError(error);

        const originalRequest = error.config;

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            originalRequest.url?.includes('/api/auth/refresh') ||
            originalRequest.url?.includes('/api/auth/login') ||
            originalRequest.url?.includes('/api/auth/register')
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => {
                return api(originalRequest);
            });
        }

        isRefreshing = true;

        try {
            await refreshAuthSession();

            processQueue(null);

            return api(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError);

            return Promise.reject(refreshError);

        } finally {
            isRefreshing = false;
        }
    }
);


export async function register({ username, email, password }) {
    const response = await api.post('/api/auth/register', {
        username,
        email,
        password
    });
    return response.data;
}

export async function login({ email, password }) {
    const response = await api.post('/api/auth/login', {
        email,
        password
    });
    return response.data;
}


export async function logout() {
    const response = await api.post('/api/auth/logout');
    return response.data;
}

export async function getMe() {
    const response = await api.get('/api/auth/get-me');
    return response.data;
}
