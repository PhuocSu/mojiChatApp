import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection error", error);
        process.exit(1);//exit the process with a non-zero status code
    }
}
