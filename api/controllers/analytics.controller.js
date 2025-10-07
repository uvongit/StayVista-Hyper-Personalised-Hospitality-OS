import Booking from "../models/booking.model.js";
import Hotel from "../models/hotel.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";

export const getSummary = async (req, res, next) => {
  try {
    const [totalUsers, totalHotels, totalTransactions, todayAmount] =
      await Promise.all([
        User.countDocuments(),
        Hotel.countDocuments(),
        Transaction.countDocuments(),
        Transaction.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(24, 0, 0, 0)),
              },
              status: { $ne: "failed" },
            },
          },
          {
            $group: {
              _id: null,
              amount: { $sum: "$amount" },
            },
          },
        ]).then((result) => result[0]?.amount ?? 0),
      ]);

    res.status(200).json({
      totalUsers,
      totalHotels,
      totalTransactions,
      todayBookingAmount: todayAmount,
    });
  } catch (err) {
    next(err);
  }
};
