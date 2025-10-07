import jwt from "jsonwebtoken";
import { createError } from "./error.js";

export const verifyToken = (req, res, next) => {
  const scopeHeader = (req.headers["x-session-scope"] || "").toString().toLowerCase();
  const cookies = req.cookies || {};

  const resolveToken = () => {
    switch (scopeHeader) {
      case "super":
        return cookies.super_admin_access_token || cookies.access_token;
      case "admin":
        return (
          cookies.super_admin_access_token ||
          cookies.admin_access_token ||
          cookies.access_token
        );
      case "member":
        return cookies.member_access_token || cookies.access_token;
      default:
        return (
          cookies.super_admin_access_token ||
          cookies.admin_access_token ||
          cookies.member_access_token ||
          cookies.access_token
        );
    }
  };

  const token = resolveToken();
  if (!token) {
    return next(createError(401, "You are not authenticated!"));
  }

  const jwtSecret = process.env.JWT || process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next(createError(500, "JWT secret is not configured"));
  }
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return next(createError(403, "Token is not valid!"));
    }
    req.user = user;
    next();
  });
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    const user = req.user;
    if (!user) {
      return next(createError(401, "You are not authenticated!"));
    }

    if (user.id === req.params.id || user.superAdmin || user.isAdmin) {
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

export const verifySuperAdmin = verifyAdmin;
