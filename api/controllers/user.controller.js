import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { createError } from "../utils/error.js";

const AVAILABLE_AVATARS = [
  "https://api.dicebear.com/7.x/bottts-neutral/png?seed=Ada",
  "https://api.dicebear.com/7.x/bottts-neutral/png?seed=Orion",
  "https://api.dicebear.com/7.x/bottts-neutral/png?seed=Nova",
  "https://api.dicebear.com/7.x/bottts-neutral/png?seed=Atlas",
  "https://api.dicebear.com/7.x/bottts-neutral/png?seed=Luna",
  "https://api.dicebear.com/7.x/bottts-neutral/png?seed=Pixel",
  "https://api.dicebear.com/7.x/bottts-neutral/png?seed=Echo",
  "https://api.dicebear.com/7.x/bottts-neutral/png?seed=Orbit",
];

export const createUser = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      phone,
      country,
      city,
      isAdmin = false,
      superAdmin = false,
      managedHotel = null,
      img = "",
    } = req.body || {};

    const requiredFields = {
      username,
      email,
      password,
      phone,
      country,
      city,
    };

    const missingEntry = Object.entries(requiredFields).find(([, value]) => {
      if (value === undefined || value === null) return true;
      if (typeof value === "string" && value.trim() === "") return true;
      return false;
    });

    if (missingEntry) {
      return next(createError(400, `Field "${missingEntry[0]}" is required.`));
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).replace(/[\s()-]/g, "").trim();
    const normalizedUsername = String(username).trim();
    const normalizedCountry = String(country).trim();
    const normalizedCity = String(city).trim();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    let normalizedManagedHotel = null;
    if (managedHotel) {
      if (!mongoose.Types.ObjectId.isValid(managedHotel)) {
        return next(createError(400, "Invalid managed hotel identifier."));
      }
      normalizedManagedHotel = new mongoose.Types.ObjectId(managedHotel);
    }

    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      country: normalizedCountry,
      city: normalizedCity,
      isAdmin: Boolean(isAdmin || superAdmin),
      superAdmin: Boolean(superAdmin),
      managedHotel: normalizedManagedHotel,
      ...(img ? { img } : {}),
    });

    const savedUser = await newUser.save();
    const { password: _password, ...otherDetails } = savedUser.toObject();
    res.status(201).json(otherDetails);
  } catch (err) {
    if (err?.code === 11000) {
      const conflictField = Object.keys(err.keyValue || {})[0] || "credential";
      return next(createError(409, `Another user already uses that ${conflictField}.`));
    }
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (
      !req.user?.isAdmin &&
      Object.prototype.hasOwnProperty.call(payload, "isAdmin")
    ) {
      delete payload.isAdmin;
    }

    if (
      !req.user?.superAdmin &&
      Object.prototype.hasOwnProperty.call(payload, "superAdmin")
    ) {
      delete payload.superAdmin;
    }

    if (
      !req.user?.superAdmin &&
      Object.prototype.hasOwnProperty.call(payload, "managedHotel")
    ) {
      delete payload.managedHotel;
    }

    if (payload.isAdmin !== undefined) {
      payload.isAdmin = Boolean(payload.isAdmin);
    }

    if (payload.superAdmin !== undefined) {
      payload.superAdmin = Boolean(payload.superAdmin);
    }

    if (payload.managedHotel !== undefined) {
      if (!payload.managedHotel) {
        payload.managedHotel = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(payload.managedHotel)) {
          return next(createError(400, "Invalid hotel selection."));
        }
        payload.managedHotel = new mongoose.Types.ObjectId(
          payload.managedHotel
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true }
    ).populate("managedHotel", "_id name city");
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};
export const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted.");
  } catch (err) {
    next(err);
  }
};
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const getAvailableAvatars = async (req, res) => {
  res.status(200).json({ avatars: AVAILABLE_AVATARS });
};

export const updateUserAvatar = async (req, res, next) => {
  try {
    const { img } = req.body;

    if (!img || !AVAILABLE_AVATARS.includes(img)) {
      return res
        .status(400)
        .json({ message: "Selected avatar is not allowed." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { img } },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return next(
        createError(400, "New password must be at least 6 characters long.")
      );
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return next(createError(404, "User not found."));
    }

    const requester = req.user;

    if (!requester) {
      return next(createError(401, "Authentication required."));
    }

    const isSelf = requester.id?.toString() === targetUser._id.toString();

    const canResetOthers = Boolean(requester.superAdmin || requester.isAdmin);

    if (!isSelf && !canResetOthers) {
      return next(
        createError(403, "You are not authorized to reset this password.")
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword.trim(), salt);

    targetUser.password = hash;
    await targetUser.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (err) {
    next(err);
  }
};
