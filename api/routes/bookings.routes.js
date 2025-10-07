import express from "express";
import {
  createBooking,
  getBooking,
  listBookings,
  updateBookingStatus,
  deleteBooking,
} from "../controllers/booking.controller.js";
import { verifyToken, verifyAdmin, verifyUser } from "../utils/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createBooking);
router.get("/:id", verifyToken, getBooking);
router.get("/", verifyToken, listBookings);
router.put("/:id/status", verifyAdmin, updateBookingStatus);
router.delete("/:id", verifyAdmin, deleteBooking);

export default router;
