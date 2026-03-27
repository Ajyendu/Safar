import { validationResult } from "express-validator";
import { User } from "../models/User.js";
import { signUserToken } from "../utils/jwt.js";

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password, displayName } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    displayName: displayName || "",
  });
  const token = signUserToken(user._id.toString());
  return res.status(201).json({
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      visitedMonuments: user.visitedMonuments,
      scannedQrPoints: user.scannedQrPoints,
      stats: user.stats,
    },
  });
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signUserToken(user._id.toString());
  return res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      visitedMonuments: user.visitedMonuments,
      scannedQrPoints: user.scannedQrPoints,
      stats: user.stats,
    },
  });
}

export async function me(req, res) {
  const user = await User.findById(req.user._id).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json({ user });
}
