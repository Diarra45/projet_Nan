import mongoose from "mongoose";

export const connectdb = async (URI: string) => {
  try {
    mongoose.connection.on("connected", () => {
     console.log("Connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB Error:", err);
    });

    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 1000, 
      maxPoolSize: 10,                
      minPoolSize: 3,                
      socketTimeoutMS: 45000,
    });;
  } catch (err) {
    return console.error("Could not connect to MongoDB:", err);
  }
  return 'ok back start ';
};
