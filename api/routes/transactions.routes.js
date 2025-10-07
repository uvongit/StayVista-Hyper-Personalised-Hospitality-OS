import express from "express";
import {
  createTransaction,
  createUserTransaction,
  listTransactions,
  getTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";
import { verifyAdmin, verifyToken } from "../utils/auth.middleware.js";

const router = express.Router();

router.post("/", verifyAdmin, createTransaction);
router.post("/pay", verifyToken, createUserTransaction);
router.get("/", verifyToken, listTransactions);
router.get("/:id", verifyToken, getTransaction);
router.delete("/:id", verifyToken, deleteTransaction);

export default router;
