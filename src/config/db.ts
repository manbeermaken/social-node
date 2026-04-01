import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_DATABASE_URL ?? "mongodb://127.0.0.1/blog")
        console.log("Connected to MongoDB")
    }catch (err) {
        console.error(err)
        process.exit(1)
    }
}

export default connectDB