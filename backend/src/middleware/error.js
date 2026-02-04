export const notFound = (req, res, next) => {
    res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err, req, res, next) => {
    // Handle rate limit errors gracefully
    if (err.code === "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR") {
        console.warn("⚠️ Rate limit proxy error (harmless):", err.message);
        // Don't fail the request, just log it
        return next();
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Server error";

    console.error(`❌ Error [${status}]:`, message);
    res.status(status).json({ message });
};
