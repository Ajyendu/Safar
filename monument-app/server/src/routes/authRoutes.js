import { Router } from "express";
import { body } from "express-validator";
import { googleAuth, login, me, register, requestOtp, verifyOtp } from "../controllers/authController.js";
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

router.post(
  "/otp/request",
  [
    body("channel").isIn(["email", "phone"]),
    body("purpose").isIn(["login", "register"]),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().isString().trim().isLength({ min: 7, max: 20 }),
  ],
  requestOtp
);

router.post(
  "/otp/verify",
  [
    body("channel").isIn(["email", "phone"]),
    body("purpose").isIn(["login", "register"]),
    body("otp").isString().trim().isLength({ min: 4, max: 8 }),
    body("displayName").optional().isString().trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().isString().trim().isLength({ min: 7, max: 20 }),
  ],
  verifyOtp
);

router.post("/google", [body("credential").isString().notEmpty()], googleAuth);

export default router;
