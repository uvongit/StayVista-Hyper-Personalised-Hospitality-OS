import mongoose from "mongoose";

const BookingRoomSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    roomNumberId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    roomNumberLabel: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    rooms: {
      type: [BookingRoomSchema],
      default: [],
      validate: (value) => Array.isArray(value) && value.length > 0,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    guests: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ hotel: 1, createdAt: -1 });

export default mongoose.model("Booking", BookingSchema);
