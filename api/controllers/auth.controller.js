import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";

const resolveJwtSecret = () => {
  const secret = process.env.JWT || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT secret is not configured. Set JWT or JWT_SECRET in the environment."
    );
  }
  return secret;
};

export const register = async (req, res, next) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const newUser = new User({
      ...req.body,
      password: hash,
    });

    await newUser.save();
    res.status(200).send("User has been created.");
  } catch (err) {
    next(err);
  }
};
export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return next(createError(404, "User not found!"));

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect)
      return next(createError(400, "Wrong password or username!"));

    const jwtSecret = resolveJwtSecret();
    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
        superAdmin: user.superAdmin,
        managedHotel: user.managedHotel ?? null,
      },
      jwtSecret
    );

    const { password, ...otherDetails } = user._doc;
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
    };

    // Always maintain the legacy cookie for compatibility
    res.cookie("access_token", token, cookieOptions);

    if (user.superAdmin) {
      res.cookie("super_admin_access_token", token, cookieOptions);
    }

    if (user.isAdmin && !user.superAdmin) {
      res.cookie("admin_access_token", token, cookieOptions);
    }

    if (!user.isAdmin && !user.superAdmin) {
      res.cookie("member_access_token", token, cookieOptions);
    }

    res.status(200).json({
      details: {
        ...otherDetails,
        isAdmin: user.isAdmin,
        superAdmin: user.superAdmin,
        managedHotel: user.managedHotel ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};
