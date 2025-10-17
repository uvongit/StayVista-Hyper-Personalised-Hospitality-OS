import express from "express";
import {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getUsers,
  getAvailableAvatars,
  updateUserAvatar,
  resetUserPassword,
} from "../controllers/user.controller.js";
import { verifyAdmin, verifySuperAdmin, verifyToken, verifyUser } from "../utils/auth.middleware.js";

const router = express.Router();

//AVATAR OPTIONS
router.get("/assets/avatars", verifyToken, getAvailableAvatars);
router.put("/:id/avatar", verifyUser, updateUserAvatar);

//CREATE (SUPER ADMIN ONLY)
router.post("/", verifySuperAdmin, createUser);

//UPDATE
router.put("/:id", verifyUser, updateUser);

//DELETE
router.delete("/:id", verifyUser, deleteUser);

//RESET PASSWORD (SUPER ADMIN ONLY)
router.post("/:id/reset-password", verifyAdmin, resetUserPassword);

//GET
router.get("/:id", verifyUser, getUser);

//GET ALL
router.get("/", verifyAdmin, getUsers);

export default router;
