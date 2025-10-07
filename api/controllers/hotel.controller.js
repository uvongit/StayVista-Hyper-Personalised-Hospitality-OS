import Hotel from "../models/hotel.model.js";
import Room from "../models/room.model.js";

export const createHotel = async (req, res, next) => {
  const newHotel = new Hotel(req.body);

  try {
    const savedHotel = await newHotel.save();
    res.status(200).json(savedHotel);
  } catch (err) {
    next(err);
  }
};
export const updateHotel = async (req, res, next) => {
  try {
    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedHotel);
  } catch (err) {
    next(err);
  }
};
export const deleteHotel = async (req, res, next) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.status(200).json("Hotel has been deleted.");
  } catch (err) {
    next(err);
  }
};
export const getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    res.status(200).json(hotel);
  } catch (err) {
    next(err);
  }
};
export const getHotels = async (req, res, next) => {
  const { min, max, limit, city, ...others } = req.query;
  const filters = { ...others };
  const priceFilter = {};

  // Handle case-insensitive city search
  if (city !== undefined && city !== "") {
    filters.city = { $regex: new RegExp(`^${city}$`, "i") };
  }

  if (min !== undefined && min !== "") {
    const parsedMin = Number(min);
    if (!Number.isNaN(parsedMin)) {
      priceFilter.$gte = parsedMin;
    }
  }

  if (max !== undefined && max !== "") {
    const parsedMax = Number(max);
    if (!Number.isNaN(parsedMax)) {
      priceFilter.$lte = parsedMax;
    }
  }

  if (Object.keys(priceFilter).length > 0) {
    filters.cheapestPrice = priceFilter;
  }

  const parsedLimit = Number(limit);

  try {
    const query = Hotel.find(filters);

    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      query.limit(parsedLimit);
    }

    const hotels = await query;
    res.status(200).json(hotels);
  } catch (err) {
    next(err);
  }
};
export const countByCity = async (req, res, next) => {
  const cities = req.query.cities.split(",");
  try {
    const list = await Promise.all(
      cities.map((city) => {
        return Hotel.countDocuments({
          city: { $regex: new RegExp(`^${city}$`, "i") },
        });
      })
    );
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
};
export const countByType = async (req, res, next) => {
  try {
    const hotelCount = await Hotel.countDocuments({ type: "hotel" });
    const apartmentCount = await Hotel.countDocuments({ type: "apartment" });
    const resortCount = await Hotel.countDocuments({ type: "resort" });
    const villaCount = await Hotel.countDocuments({ type: "villa" });
    const cabinCount = await Hotel.countDocuments({ type: "cabin" });

    res.status(200).json([
      { type: "hotel", count: hotelCount },
      { type: "apartments", count: apartmentCount },
      { type: "resorts", count: resortCount },
      { type: "villas", count: villaCount },
      { type: "cabins", count: cabinCount },
    ]);
  } catch (err) {
    next(err);
  }
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildDateRange = (start, end) => {
  if (!start || !end) return [];
  const range = [];
  const startOfDay = new Date(start.getTime());
  const endOfDay = new Date(end.getTime());
  startOfDay.setHours(0, 0, 0, 0);
  endOfDay.setHours(0, 0, 0, 0);

  const cursor = new Date(startOfDay.getTime());
  while (cursor < endOfDay) {
    range.push(cursor.getTime());
    cursor.setDate(cursor.getDate() + 1);
  }
  return range;
};

export const getHotelRooms = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const checkIn = parseDate(req.query.checkIn);
    let checkOut = parseDate(req.query.checkOut);
    if (checkIn) {
      if (!checkOut || checkOut <= checkIn) {
        checkOut = new Date(checkIn.getTime());
        checkOut.setDate(checkOut.getDate() + 1);
      }
    } else {
      checkOut = null;
    }

    const rooms = await Room.find({ _id: { $in: hotel.rooms } }).lean();
    const requestedRange =
      checkIn && checkOut ? buildDateRange(checkIn, checkOut) : [];

    const roomsWithAvailability = rooms.map((room) => {
      const roomNumbers = (room.roomNumbers || []).map((roomNumber) => {
        const unavailableDates = Array.isArray(roomNumber.unavailableDates)
          ? roomNumber.unavailableDates
          : [];
        const unavailableSet = new Set(
          unavailableDates
            .map((date) => new Date(date).getTime())
            .filter((value) => !Number.isNaN(value))
        );
        const isUnavailableForRange = requestedRange.some((ts) =>
          unavailableSet.has(ts)
        );
        return {
          ...roomNumber,
          unavailableDates,
          isUnavailableForRange,
        };
      });

      return {
        ...room,
        roomNumbers,
        nextAvailableDate: undefined,
      };
    });

    res.status(200).json({
      rooms: roomsWithAvailability,
      range: {
        checkIn: checkIn ? checkIn.toISOString() : null,
        checkOut: checkOut ? checkOut.toISOString() : null,
      },
    });
  } catch (err) {
    next(err);
  }
};
