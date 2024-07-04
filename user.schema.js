import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  connected: { type: Boolean, default: false },
});

export const User = mongoose.model("User", userSchema);
