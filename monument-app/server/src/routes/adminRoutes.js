import { Router } from "express";
import { adminLogin } from "../controllers/adminAuthController.js";
import {
  createMonument,
  deleteMonument,
  getAdminStats,
  listAllMonuments,
  updateMonument,
} from "../controllers/adminController.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const router = Router();

router.post("/auth/login", adminLogin);

router.use(requireAdminAuth);

router.get("/stats", getAdminStats);
router.get("/monuments", listAllMonuments);
router.post("/monuments", createMonument);
router.patch("/monuments/:slug", updateMonument);
router.delete("/monuments/:slug", deleteMonument);

export default router;
