import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import authRoute from "./routes/auth.routes.js";
import usersRoute from "./routes/users.routes.js";
import hotelsRoute from "./routes/hotels.routes.js";
import roomsRoute from "./routes/rooms.routes.js";
import uploadRoute from "./routes/uploads.routes.js";
import bookingsRoute from "./routes/bookings.routes.js";
import transactionsRoute from "./routes/transactions.routes.js";
import analyticsRoute from "./routes/analytics.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.set("trust proxy", 1);

// Environment validation
const requiredEnvVars = ["MONGO", "JWT"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    "Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  process.exit(1);
}

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to mongoDB.");
  } catch (error) {
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("mongoDB disconnected!");
});

//middlewares

// CORS configuration
const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/hotels", hotelsRoute);
app.use("/api/rooms", roomsRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/bookings", bookingsRoute);
app.use("/api/transactions", transactionsRoute);
app.use("/api/analytics", analyticsRoute);

// Global error handler
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", err);
  }

  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 8800;

app.listen(PORT, () => {
  connect();
  console.log(
    `🍀Server running on port ${PORT} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
});
