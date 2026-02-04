const env = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/we_call",
    jwtSecret: process.env.JWT_SECRET || "change_this_secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173" 
};

export default env;
