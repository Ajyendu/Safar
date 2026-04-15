import { validationResult } from "express-validator";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { signUserToken } from "../utils/jwt.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map();
const googleClient = new OAuth2Client();

function normalizeChannelAndIdentifier(channel, email, phone) {
  if (channel === "email") {
    return { channel: "email", identifier: String(email || "").trim().toLowerCase() };
  }
  return { channel: "phone", identifier: String(phone || "").trim() };
}

function otpKey(channel, identifier) {
  return `${channel}:${identifier}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function pickUserSafe(user) {
  return {
    id: user._id,
    email: user.email || null,
    phone: user.phone || null,
    displayName: user.displayName,
    visitedMonuments: user.visitedMonuments,
    scannedQrPoints: user.scannedQrPoints,
    stats: user.stats,
  };
}

export async function register(req, res) {
  return res.status(403).json({ error: "Registration is disabled." });
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

export async function requestOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { channel, purpose, email, phone } = req.body;
  if (purpose === "register") {
    return res.status(403).json({ error: "Registration is disabled." });
  }

  const normalized = normalizeChannelAndIdentifier(channel, email, phone);
  if (!normalized.identifier) {
    return res.status(400).json({ error: channel === "email" ? "Valid email required" : "Valid phone required" });
  }

  const query = channel === "email" ? { email: normalized.identifier } : { phone: normalized.identifier };
  const existing = await User.findOne(query).select("_id");

  if (purpose === "login" && !existing) {
    return res.status(404).json({ error: "Account not found." });
  }

  const otp = generateOtp();
  const key = otpKey(channel, normalized.identifier);
  otpStore.set(key, { otp, purpose, channel, identifier: normalized.identifier, expiresAt: Date.now() + OTP_TTL_MS });

  // TODO: integrate actual providers (SMTP/Twilio). For now we log OTP server-side.
  console.log(`[auth][otp] ${purpose} ${channel} ${normalized.identifier} -> ${otp}`);

  const payload = { ok: true, message: `OTP sent to your ${channel}.`, expiresInSeconds: Math.floor(OTP_TTL_MS / 1000) };
  if (process.env.NODE_ENV !== "production") payload.devOtp = otp;
  return res.json(payload);
}

export async function verifyOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { channel, purpose, email, phone, otp } = req.body;
  const normalized = normalizeChannelAndIdentifier(channel, email, phone);
  const key = otpKey(channel, normalized.identifier);
  const record = otpStore.get(key);

  if (!record) return res.status(400).json({ error: "OTP not requested or expired" });
  if (record.expiresAt < Date.now()) {
    otpStore.delete(key);
    return res.status(400).json({ error: "OTP expired. Request a new code." });
  }
  if (record.purpose !== purpose) return res.status(400).json({ error: "OTP purpose mismatch. Request again." });
  if (String(otp || "").trim() !== record.otp) return res.status(400).json({ error: "Invalid OTP" });

  if (purpose === "register") {
    otpStore.delete(key);
    return res.status(403).json({ error: "Registration is disabled." });
  }

  otpStore.delete(key);
  const query = channel === "email" ? { email: normalized.identifier } : { phone: normalized.identifier };
  const user = await User.findOne(query);

  if (!user) return res.status(404).json({ error: "Account not found" });

  const token = signUserToken(user._id.toString());
  return res.json({ token, user: pickUserSafe(user) });
}

export async function googleAuth(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { credential } = req.body;
  const audience =
    process.env.GOOGLE_CLIENT_ID ||
    "986202966230-5k0queoscp7u0smo9m6b5u8bm5clhtpg.apps.googleusercontent.com";

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience,
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || "").toLowerCase().trim();
    const emailVerified = Boolean(payload?.email_verified);
    const displayName = String(payload?.name || "").trim();

    if (!email || !emailVerified) {
      return res.status(400).json({ error: "Google account email is not verified" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(403).json({ error: "Registration is disabled." });
    }
    if (!user.displayName && displayName) {
      user.displayName = displayName;
      await user.save();
    }

    const token = signUserToken(user._id.toString());
    return res.json({ token, user: pickUserSafe(user) });
  } catch {
    return res.status(401).json({ error: "Invalid Google credential" });
  }
}
