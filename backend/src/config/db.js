import mongoose from "mongoose";
import env from "./env.js";

const connectDb = async () => {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri, {
        autoIndex: env.nodeEnv !== "production"
    });
    console.log("MongoDB connected");
};

export default connectDb;
