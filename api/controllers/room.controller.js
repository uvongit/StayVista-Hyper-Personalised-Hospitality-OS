import Room from "../models/room.model.js";
import Hotel from "../models/hotel.model.js";
import { createError } from "../utils/error.js";

export const createRoom = async (req, res, next) => {
  const hotelId = req.params.hotelid;
  const newRoom = new Room(req.body);

  try {
    const savedRoom = await newRoom.save();
    try {
      await Hotel.findByIdAndUpdate(hotelId, {
        $push: { rooms: savedRoom._id },
      });
    } catch (err) {
      next(err);
    }
    res.status(200).json(savedRoom);
  } catch (err) {
    next(err);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedRoom);
  } catch (err) {
    next(err);
  }
};
export const updateRoomAvailability = async (req, res, next) => {
  try {
    const incomingDates = Array.isArray(req.body.dates) ? req.body.dates : [];
    const operation =
      typeof req.body.operation === "string"
        ? req.body.operation.toLowerCase()
        : "add";

    const normalizedDates = incomingDates
      .map((value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          return null;
        }
        date.setHours(0, 0, 0, 0);
        return date;
      })
      .filter(Boolean);

    if (
      (operation === "add" || operation === "remove") &&
      !normalizedDates.length
    ) {
      return res
        .status(400)
        .json({ message: "No valid dates provided to update availability." });
    }

    const roomNumberFilter = { "roomNumbers._id": req.params.id };

    if (operation === "clear") {
      await Room.updateOne(roomNumberFilter, {
        $set: { "roomNumbers.$.unavailableDates": [] },
      });
      return res.status(200).json({ message: "Availability cleared." });
    }

    if (operation === "remove") {
      await Room.updateOne(roomNumberFilter, {
        $pull: {
          "roomNumbers.$.unavailableDates": { $in: normalizedDates },
        },
      });
      return res
        .status(200)
        .json({ message: "Dates removed from availability." });
    }

    await Room.updateOne(roomNumberFilter, {
      $addToSet: {
        "roomNumbers.$.unavailableDates": {
          $each: normalizedDates,
        },
      },
    });
    res.status(200).json({ message: "Room status has been updated." });
  } catch (err) {
    next(err);
  }
};
export const deleteRoom = async (req, res, next) => {
  const roomId = req.params.id;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return next(createError(404, "Room not found"));
    }

    await Room.findByIdAndDelete(roomId);

    try {
      await Hotel.updateMany({ rooms: roomId }, { $pull: { rooms: roomId } });
    } catch (err) {
      next(err);
      return;
    }

    res.status(200).json({ message: "Room has been deleted." });
  } catch (err) {
    next(err);
  }
};
export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    res.status(200).json(room);
  } catch (err) {
    next(err);
  }
};
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
};
