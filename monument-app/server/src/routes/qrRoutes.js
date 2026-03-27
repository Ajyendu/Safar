import { Router } from "express";
import { recordMonumentVisit, verifyQr } from "../controllers/qrController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.post("/verify", optionalAuth, verifyQr);
router.post("/visit", optionalAuth, recordMonumentVisit);

export default router;
