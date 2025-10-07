import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    method: {
      type: String,
      enum: ["manual", "card", "bank", "other"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["pending", "captured", "refunded", "failed"],
      default: "captured",
    },
    reference: {
      type: String,
      index: true,
    },
    paymentGateway: {
      type: String,
      default: "StayPay",
    },
    cardBrand: {
      type: String,
    },
    cardLast4: {
      type: String,
    },
    billingName: {
      type: String,
    },
    billingEmail: {
      type: String,
    },
    notes: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ hotel: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });

export default mongoose.model("Transaction", TransactionSchema);
