import Transaction from "../models/transaction.model.js";
import Booking from "../models/booking.model.js";
import { createError } from "../utils/error.js";

const generateTransactionReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `STAY-${timestamp}-${random}`;
};

export const createTransaction = async (req, res, next) => {
  try {
    const {
      bookingId,
      amount,
      currency,
      method,
      status = "captured",
      notes,
      metadata,
      reference,
      paymentGateway = "StayPay",
      cardBrand,
      cardLast4,
      billingName,
      billingEmail,
    } = req.body;

    if (!bookingId || amount === undefined) {
      return next(createError(400, "bookingId and amount are required."));
    }

    const booking = await Booking.findById(bookingId).populate("hotel user");
    if (!booking) {
      return next(createError(404, "Booking not found."));
    }

    const txnPayload = {
      booking: booking._id,
      hotel: booking.hotel,
      user: booking.user,
      amount,
      currency,
      method,
      status,
      notes,
      metadata,
      reference: reference || generateTransactionReference(),
      paymentGateway,
      cardBrand,
      cardLast4,
      billingName,
      billingEmail,
    };

    const transaction = await Transaction.create(txnPayload);

    if (status === "captured" && booking.status === "pending") {
      booking.status = "confirmed";
      await booking.save();
    }

    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
};

export const createUserTransaction = async (req, res, next) => {
  try {
    const {
      bookingId,
      method = "card",
      currency = "INR",
      cardBrand = "VISA",
      cardNumber,
      billingName,
      billingEmail,
      metadata,
    } = req.body;

    if (!bookingId) {
      return next(createError(400, "bookingId is required."));
    }

    const booking = await Booking.findById(bookingId).populate("hotel user");
    if (!booking) {
      return next(createError(404, "Booking not found."));
    }

    const isOwner = booking.user?._id?.toString() === req.user.id;
    const isPrivileged = req.user.superAdmin || req.user.isAdmin;
    if (!isOwner && !isPrivileged) {
      return next(
        createError(403, "You are not authorized to pay for this booking.")
      );
    }

    const chargeAmount = booking.totalAmount;
    const reference = generateTransactionReference();

    const transaction = await Transaction.create({
      booking: booking._id,
      hotel: booking.hotel,
      user: booking.user,
      amount: chargeAmount,
      currency,
      method,
      status: "captured",
      paymentGateway: "StayPay",
      reference,
      cardBrand,
      cardLast4: cardNumber ? cardNumber.slice(-4) : undefined,
      billingName: billingName || booking.user?.username,
      billingEmail: billingEmail || booking.user?.email,
      metadata,
    });

    if (booking.status === "pending") {
      booking.status = "confirmed";
      await booking.save();
    }

    res.status(201).json({
      transaction,
      redirectUrl: `/transactions/${transaction._id}`,
    });
  } catch (err) {
    next(err);
  }
};

export const listTransactions = async (req, res, next) => {
  try {
    const { hotelId, userId, status, from, to } = req.query;
    const filter = {};

    if (hotelId) filter.hotel = hotelId;
    if (userId) filter.user = userId;
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (req.user.isAdmin && !req.user.superAdmin) {
      if (!req.user.managedHotel) {
        return next(
          createError(403, "Hotel admins must be assigned to a hotel.")
        );
      }
      filter.hotel = req.user.managedHotel;
    } else if (!req.user.isAdmin) {
      filter.user = req.user.id;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .populate("booking", "status checkIn checkOut totalAmount")
      .populate("hotel", "name city")
      .populate("user", "username email");

    res.status(200).json(transactions);
  } catch (err) {
    next(err);
  }
};

export const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("booking", "status checkIn checkOut totalAmount hotel")
      .populate("hotel", "name city")
      .populate("user", "username email");

    if (!transaction) {
      return next(createError(404, "Transaction not found."));
    }

    const bookingHotelId =
      transaction.booking?.hotel?.toString() ||
      transaction.hotel?._id?.toString();

    if (!req.user.isAdmin) {
      if (transaction.user?._id?.toString() !== req.user.id) {
        return next(
          createError(403, "You are not authorized to view this transaction.")
        );
      }
    } else if (!req.user.superAdmin) {
      if (
        !req.user.managedHotel ||
        req.user.managedHotel.toString() !== bookingHotelId
      ) {
        return next(
          createError(403, "You are not authorized to view this transaction.")
        );
      }
    }

    res.status(200).json(transaction);
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "booking",
      "hotel"
    );

    if (!transaction) {
      return next(createError(404, "Transaction not found."));
    }

    const bookingHotelId =
      transaction.booking?.hotel?.toString() || transaction.hotel?.toString();

    if (req.user.isAdmin) {
      if (!req.user.superAdmin) {
        if (!req.user.managedHotel) {
          return next(
            createError(403, "Hotel admins must be assigned to a hotel.")
          );
        }

        if (req.user.managedHotel.toString() !== bookingHotelId) {
          return next(
            createError(403, "You are not authorized to delete this transaction.")
          );
        }
      }
    } else {
      if (transaction.user?.toString() !== req.user.id) {
        return next(
          createError(403, "You are not authorized to delete this transaction.")
        );
      }
    }

    await transaction.deleteOne();

    res.status(200).json({ message: "Transaction deleted." });
  } catch (err) {
    next(err);
  }
};
