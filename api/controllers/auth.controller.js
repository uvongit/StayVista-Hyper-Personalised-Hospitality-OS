import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";

const resolveAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT access secret is not configured. Set JWT_ACCESS_SECRET or JWT in the environment.");
  }
  return secret;
};

const resolveRefreshSecret = () => {
  const secret =
    process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH || process.env.JWT_REFRESH_SECRET || process.env.JWT || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT refresh secret is not configured. Set JWT_REFRESH_SECRET or JWT in the environment."
    );
  }
  return secret;
};

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN || "1h";
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || "1d";
const DEFAULT_REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const resolveRefreshCookieMaxAge = () => {
  const input = process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS;
  if (!input) return DEFAULT_REFRESH_COOKIE_MAX_AGE;
  const parsed = Number(input);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REFRESH_COOKIE_MAX_AGE;
};

const REFRESH_COOKIE_MAX_AGE = resolveRefreshCookieMaxAge();

const buildTokenPayload = (user) => ({
  id: user._id,
  isAdmin: user.isAdmin,
  superAdmin: user.superAdmin,
  managedHotel: user.managedHotel ?? null,
});

const generateAccessToken = (payload) => jwt.sign(payload, resolveAccessSecret(), { expiresIn: ACCESS_TOKEN_TTL });

const generateRefreshToken = (payload) => jwt.sign(payload, resolveRefreshSecret(), { expiresIn: REFRESH_TOKEN_TTL });

const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };

  res.cookie("refresh_token", token, cookieOptions);
};

const clearRefreshTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
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

const mapUserDetails = (user) => {
  if (!user) return null;
  const source = user._doc ? { ...user._doc } : { ...user };
  delete source.password;
  return {
    ...source,
    isAdmin: Boolean(user.isAdmin),
    superAdmin: Boolean(user.superAdmin),
    managedHotel: user.managedHotel ?? null,
  };
};

const sanitizePhone = (value = "") => value.replace(/[\s()-]/g, "").replace(/^(\+)?0+(?=\d)/, "$1");

const isLikelyPhone = (value = "") => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7;
};

const resolveRootAdminCredentials = () => {
  const username = process.env.ROOT_ADMIN_USERNAME;
  const password = process.env.ROOT_ADMIN_PASSWORD;
  const email = process.env.ROOT_ADMIN_EMAIL;

  if (!username || !password) {
    return null;
  }

  return {
    username,
    password,
    email,
  };
};

export const login = async (req, res, next) => {
  try {
    const rootCreds = resolveRootAdminCredentials();
    if (rootCreds && req.body.username === rootCreds.username) {
      if (req.body.password !== rootCreds.password) {
        return next(createError(400, "Wrong password or username!"));
      }

      const rootUser = {
        _id: "root-superadmin",
        username: rootCreds.username,
        email: rootCreds.email ?? "",
        isAdmin: true,
        superAdmin: true,
        managedHotel: null,
      };

      const payload = buildTokenPayload(rootUser);
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      setRefreshTokenCookie(res, refreshToken);

      return res.status(200).json({
        user: mapUserDetails(rootUser),
        accessToken,
      });
    }

    const normalizedIdentifier = (req.body.username || req.body.email || req.body.phone || req.body.identifier || "").trim();
    if (!normalizedIdentifier) {
      return next(createError(400, "Username, email, or phone number is required."));
    }

    let user = null;

    if (normalizedIdentifier.includes("@")) {
      user = await User.findOne({ email: normalizedIdentifier.toLowerCase() });
    } else if (isLikelyPhone(normalizedIdentifier)) {
      const sanitized = sanitizePhone(normalizedIdentifier);
      user =
        (await User.findOne({ phone: sanitized })) ||
        (await User.findOne({ phone: normalizedIdentifier }));
    } else {
      user = await User.findOne({ username: normalizedIdentifier });
    }

    if (!user && isLikelyPhone(normalizedIdentifier)) {
      const digitsOnly = normalizedIdentifier.replace(/\D/g, "");
      user = await User.findOne({ phone: digitsOnly });
    }

    if (!user) return next(createError(404, "User not found!"));

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(400, "Wrong password or username!"));
    }

    const payload = buildTokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      user: mapUserDetails(user),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refresh_token;
    if (!incomingToken) {
      return next(createError(401, "Refresh token not provided."));
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingToken, resolveRefreshSecret());
    } catch (err) {
      return next(createError(403, "Refresh token is invalid or expired."));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(createError(404, "User associated with token no longer exists."));
    }

    const payload = buildTokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      user: mapUserDetails(user),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (_req, res) => {
  clearRefreshTokenCookie(res);
  res.status(200).json({ message: "Logged out successfully." });
};
