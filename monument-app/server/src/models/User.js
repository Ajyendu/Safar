import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true, default: "" },
    /** Monument slugs the user has entered in Monument Mode */
    visitedMonuments: [{ type: String }],
    /** Composite keys: "slug:qrId" for scanned QR checkpoints */
    scannedQrPoints: [{ type: String }],
    /** Simple gamification counters */
    stats: {
      totalScans: { type: Number, default: 0 },
      monumentsVisited: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

export const User = mongoose.model("User", userSchema);
