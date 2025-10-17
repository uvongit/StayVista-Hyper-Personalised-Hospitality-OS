import jwt from "jsonwebtoken";
import { createError } from "./error.js";

const resolveAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT access secret is not configured. Set JWT_ACCESS_SECRET or JWT in the environment.");
  }
  return secret;
};

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== "string") {
    return null;
  }
  const [scheme, value] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return null;
  }
  return value;
};

export const verifyToken = (req, res, next) => {
  const token = extractBearerToken(req.headers?.authorization);
  if (!token) {
    return next(createError(401, "You are not authenticated!"));
  }

  try {
    const decoded = jwt.verify(token, resolveAccessSecret());
    req.user = decoded;
    return next();
  } catch (err) {
    return next(createError(403, "Token is not valid!"));
  }
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    const user = req.user;
    if (!user) {
      return next(createError(401, "You are not authenticated!"));
    }

    if (user.id === req.params.id || user.superAdmin) {
      return next();
    }

    return next(createError(403, "You are not authorized!"));
  });
};

export const verifySuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    const user = req.user;
    if (!user) {
      return next(createError(401, "You are not authenticated!"));
    }

    if (user.superAdmin) {
      return next();
    }

    return next(createError(403, "You are not authorized!"));
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    const user = req.user;
    if (!user) {
      return next(createError(401, "You are not authenticated!"));
    }

    if (user.superAdmin || user.isAdmin) {
      return next();
    }

    return next(createError(403, "You are not authorized!"));
  });
};
