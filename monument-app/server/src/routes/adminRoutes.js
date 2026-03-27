import { Router } from "express";
import {
  createMonument,
  deleteMonument,
  listAllMonuments,
  updateMonument,
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** In production, add role: admin on User and check here */
router.use(requireAuth);

router.get("/monuments", listAllMonuments);
router.post("/monuments", createMonument);
router.patch("/monuments/:slug", updateMonument);
router.delete("/monuments/:slug", deleteMonument);

export default router;
