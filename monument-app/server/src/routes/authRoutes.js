import { Router } from "express";
import { body } from "express-validator";
import { login, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("displayName").optional().isString().trim(),
  ],
  register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  login
);

router.get("/me", requireAuth, me);

export default router;
