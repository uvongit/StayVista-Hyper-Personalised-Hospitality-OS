import Booking from "../models/booking.model.js";
import Hotel from "../models/hotel.model.js";
import RoomModel from "../models/room.model.js";
import Transaction from "../models/transaction.model.js";
import { createError } from "../utils/error.js";

const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw createError(400, "Invalid stay dates supplied.");
  }
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const normalizeRooms = async (hotelId, requestedRooms) => {
  if (!Array.isArray(requestedRooms) || requestedRooms.length === 0) {
    throw createError(400, "At least one room must be selected.");
  }

  const hotel = await Hotel.findById(hotelId).populate("rooms");
  if (!hotel) {
    throw createError(404, "Hotel not found.");
  }

  const flattenedRooms = await RoomModel.find({ _id: { $in: hotel.rooms } });
  const availabilityChecks = [];

  const normalized = requestedRooms.map((room) => {
    const { roomId, roomNumberId, price, label } = room;

    if (!roomId || !roomNumberId) {
      throw createError(400, "Room selection is invalid.");
    }

    const roomDoc = flattenedRooms.find((r) => r._id.toString() === roomId);
    if (!roomDoc) {
      throw createError(400, "Selected room does not belong to this hotel.");
    }

    const roomNumber = roomDoc.roomNumbers.find(
      (rn) => rn._id.toString() === roomNumberId
    );
    if (!roomNumber) {
      throw createError(400, "Selected room number is unavailable.");
    }

    availabilityChecks.push({
      roomNumber,
      roomDoc,
      storedPrice: roomDoc.price,
      priceOverride: price,
      label,
      roomNumberId,
    });

    return {
      room: roomDoc._id,
      roomNumberId,
      roomNumberLabel: label || `${roomDoc.title} #${roomNumber.number}`,
      price: price ?? roomDoc.price,
    };
  });

  return { normalized, availabilityChecks };
};

const ensureAvailability = (availabilityChecks, checkIn, checkOut) => {
  const stayDates = [];
  const cursor = new Date(checkIn);
  const finalDate = new Date(checkOut);

  while (cursor < finalDate) {
    stayDates.push(new Date(cursor).setHours(0, 0, 0, 0));
    cursor.setDate(cursor.getDate() + 1);
  }

  availabilityChecks.forEach(({ roomNumber }) => {
    const conflict = roomNumber.unavailableDates?.some((date) =>
      stayDates.includes(new Date(date).setHours(0, 0, 0, 0))
    );
    if (conflict) {
      throw createError(
        409,
        "One or more selected rooms are no longer available."
      );
    }
  });
};

const computeStayDates = (checkIn, checkOut) => {
  const dates = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return dates;
  }

  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const finalDate = new Date(end);
  finalDate.setHours(0, 0, 0, 0);

  while (cursor < finalDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

export const createBooking = async (req, res, next) => {
  try {
    const { hotelId, rooms, checkIn, checkOut, guests } = req.body;
    if (!hotelId || !checkIn || !checkOut) {
      return next(createError(400, "Missing booking information."));
    }

    const nights = calculateNights(checkIn, checkOut);
    const { normalized, availabilityChecks } = await normalizeRooms(
      hotelId,
      rooms
    );

    ensureAvailability(availabilityChecks, checkIn, checkOut);

    const totalAmount = normalized.reduce(
      (sum, room) => sum + room.price * nights,
      0
    );

    const booking = await Booking.create({
      user: req.user.id,
      hotel: hotelId,
      rooms: normalized,
      checkIn,
      checkOut,
      nights,
      guests: {
        adults: guests?.adults ?? 1,
        children: guests?.children ?? 0,
      },
      totalAmount,
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("hotel", "name city")
      .populate("user", "username email");

    if (!booking) {
      return next(createError(404, "Booking not found."));
    }

    if (!req.user.isAdmin && booking.user._id.toString() !== req.user.id) {
      return next(
        createError(403, "You are not authorized to view this booking.")
      );
    }

    if (req.user.isAdmin && !req.user.superAdmin && req.user.managedHotel) {
      if (booking.hotel?._id?.toString() !== req.user.managedHotel.toString()) {
        return next(
          createError(403, "You are not authorized to view this booking.")
        );
      }
    }

    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const listBookings = async (req, res, next) => {
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

    if (!req.user.isAdmin) {
      filter.user = req.user.id;
    } else if (!req.user.superAdmin) {
      if (req.user.managedHotel) {
        filter.hotel = req.user.managedHotel;
      } else {
        return next(
          createError(403, "Hotel admins must be assigned to a hotel.")
        );
      }
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate("hotel", "name city")
      .populate("user", "username email");

    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return next(createError(400, "Status is required."));
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(createError(404, "Booking not found."));
    }

    booking.status = status;
    await booking.save();

    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(createError(404, "Booking not found."));
    }

    if (req.user.isAdmin && !req.user.superAdmin) {
      if (!req.user.managedHotel) {
        return next(
          createError(403, "Hotel admins must be assigned to a hotel.")
        );
      }

      if (booking.hotel?.toString() !== req.user.managedHotel.toString()) {
        return next(
          createError(403, "You are not authorized to delete this booking.")
        );
      }
    }

    const stayDates = computeStayDates(booking.checkIn, booking.checkOut);

    if (stayDates.length) {
      const availabilityUpdates = booking.rooms.map(({ roomNumberId }) =>
        RoomModel.updateOne(
          { "roomNumbers._id": roomNumberId },
          {
            $pull: {
              "roomNumbers.$.unavailableDates": { $in: stayDates },
            },
          }
        )
      );

      await Promise.all(availabilityUpdates);
    }

    await Transaction.deleteMany({ booking: booking._id });
    await booking.deleteOne();

    res.status(200).json({ message: "Booking deleted." });
  } catch (err) {
    next(err);
  }
};
