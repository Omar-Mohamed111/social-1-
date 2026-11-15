import mongoose from "mongoose";
import { env } from "../config/env";

export const mongooseConnect = async () => {
  await mongoose.connect(env.db.url);
  console.log("MongoDB connected successfully ✅");
};
