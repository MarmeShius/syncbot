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

const staff = [
  { prefix: "STAFF_AGENT", role: "agent" },
  { prefix: "STAFF_ADMIN", role: "admin" }
].map(({ prefix, role }) => ({
  role,
  name: process.env[`${prefix}_NAME`]?.trim(),
  username: process.env[`${prefix}_USERNAME`]?.toLowerCase().trim(),
  email: process.env[`${prefix}_EMAIL`]?.toLowerCase().trim(),
  password: process.env[`${prefix}_PASSWORD`]
}));

const missing = staff.flatMap((account) =>
  ["name", "username", "email", "password"].filter((field) => !account[field]).map((field) => `${account.role}:${field}`)
);
if (!process.env.MONGO_URI || missing.length) {
  console.error("Set MONGO_URI and all STAFF_AGENT_* and STAFF_ADMIN_* values in backend/.env.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
for (const account of staff) {
  const passwordHash = await bcrypt.hash(account.password, 12);
  await User.findOneAndUpdate(
    { $or: [{ username: account.username }, { email: account.email }] },
    { $set: { name: account.name, username: account.username, email: account.email, passwordHash, role: account.role, active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`${account.role} account synced.`);
}
await mongoose.disconnect();
