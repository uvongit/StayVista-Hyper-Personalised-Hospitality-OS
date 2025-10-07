import express from "express";
import { getSummary } from "../controllers/analytics.controller.js";
import { verifyAdmin } from "../utils/auth.middleware.js";

const router = express.Router();

router.get("/summary", verifyAdmin, getSummary);

export default router;
