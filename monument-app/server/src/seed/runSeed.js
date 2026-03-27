import "dotenv/config";
import mongoose from "mongoose";
import { Monument } from "../models/Monument.js";
import { indiaGateMonument } from "./indiaGateData.js";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("[seed] Connected");

  await Monument.findOneAndUpdate(
    { slug: indiaGateMonument.slug },
    { $set: indiaGateMonument },
    { upsert: true, new: true }
  );
  console.log("[seed] India Gate monument upserted:", indiaGateMonument.slug);

  await mongoose.disconnect();
  console.log("[seed] Done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
