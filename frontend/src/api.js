import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000"
});

// Callback to be set by App.jsx for handling logout
let logoutCallback = null;

export const setLogoutCallback = (callback) => {
    logoutCallback = callback;
};

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
};

// Response interceptor to handle authentication errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check if error is 401 or 403 (Unauthorized/Forbidden)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Clear token and trigger logout
            localStorage.removeItem("wecall_token");
            delete api.defaults.headers.common.Authorization;

            // Call the logout callback if it's set
            if (logoutCallback) {
                logoutCallback();
            }
        }

        return Promise.reject(error);
    }
);

export default api;
