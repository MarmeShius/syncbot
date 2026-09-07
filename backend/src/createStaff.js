import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ["agent", "admin"] },
  active: { type: Boolean, default: true }
});
const User = mongoose.model("User", userSchema);
const required = ["STAFF_NAME", "STAFF_USERNAME", "STAFF_EMAIL", "STAFF_PASSWORD", "STAFF_ROLE"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length || !["agent", "admin"].includes(process.env.STAFF_ROLE)) {
  console.error("Set STAFF_NAME, STAFF_USERNAME, STAFF_EMAIL, STAFF_PASSWORD and STAFF_ROLE (agent or admin) in backend/.env.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
await User.create({
  name: process.env.STAFF_NAME.trim(),
  username: process.env.STAFF_USERNAME.toLowerCase().trim(),
  email: process.env.STAFF_EMAIL.toLowerCase().trim(),
  passwordHash: await bcrypt.hash(process.env.STAFF_PASSWORD, 12),
  role: process.env.STAFF_ROLE,
  active: true
});
console.log(`${process.env.STAFF_ROLE} account created.`);
await mongoose.disconnect();