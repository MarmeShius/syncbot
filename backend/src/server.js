import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || "development-secret-change-me";
const categories = ["Technical Issue", "Billing", "Account", "Product", "General Inquiry"];
const statuses = ["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"];
const priorities = ["Low", "Medium", "High", "Critical"];
const memory = { users: [], tickets: [], nextTicket: 1001 };

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["customer", "agent", "admin"], default: "customer" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true, trim: true },
  kind: { type: String, enum: ["reply", "note"], default: "reply" }
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  category: { type: String, enum: categories, required: true },
  priority: { type: String, enum: priorities, default: "Medium" },
  status: { type: String, enum: statuses, default: "Open" },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  messages: [messageSchema]
}, { timestamps: true });
ticketSchema.index({ subject: "text", ticketNumber: "text" });
const User = mongoose.model("User", userSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);

const publicUser = (user) => ({ id: user._id || user.id, name: user.name, username: user.username, email: user.email, role: user.role });
const tokenFor = (user) => jwt.sign({ sub: String(user._id || user.id), role: user.role }, jwtSecret, { expiresIn: "7d" });
const sendError = (res, status, message) => res.status(status).json({ message });
const normalizeTicket = (ticket, includeNotes = false) => {
  const raw = ticket.toObject ? ticket.toObject() : ticket;
  return {
    ...raw,
    id: raw.ticketNumber || raw.id,
    customer: raw.customer && typeof raw.customer === "object" ? publicUser(raw.customer) : raw.customer,
    assignedAgent: raw.assignedAgent && typeof raw.assignedAgent === "object" ? publicUser(raw.assignedAgent) : raw.assignedAgent,
    messages: (raw.messages || []).filter((message) => includeNotes || message.kind !== "note")
  };
};

async function seedMemory() {
  if (process.env.ALLOW_IN_MEMORY_AUTH !== "true" || memory.users.length) return;
  const accounts = [
    [process.env.DEV_CUSTOMER_NAME, process.env.DEV_CUSTOMER_USERNAME, process.env.DEV_CUSTOMER_EMAIL, process.env.DEV_CUSTOMER_PASSWORD, "customer"],
    [process.env.DEV_AGENT_NAME, process.env.DEV_AGENT_USERNAME, process.env.DEV_AGENT_EMAIL, process.env.DEV_AGENT_PASSWORD, "agent"],
    [process.env.DEV_ADMIN_NAME, process.env.DEV_ADMIN_USERNAME, process.env.DEV_ADMIN_EMAIL, process.env.DEV_ADMIN_PASSWORD, "admin"]
  ].filter((account) => account.every(Boolean));
  for (const [name, username, email, password, role] of accounts) {
    memory.users.push({ id: new mongoose.Types.ObjectId().toString(), name, username, email, passwordHash: await bcrypt.hash(password, 10), role, active: true });
  }
}
const findMemoryUser = (id) => memory.users.find((user) => user.id === id);
const findUser = async (id) => process.env.MONGO_URI ? User.findById(id) : findMemoryUser(id);

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return sendError(res, 401, "Authentication required.");
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret);
    const user = await findUser(payload.sub);
    if (!user || user.active === false) return sendError(res, 401, "Your session is no longer valid.");
    req.user = user;
    next();
  } catch { return sendError(res, 401, "Invalid or expired token."); }
}
const roles = (...allowed) => (req, res, next) => allowed.includes(req.user.role) ? next() : sendError(res, 403, "You do not have permission for this action.");

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "syncbot-api" }));

app.post("/api/auth/register", async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password || password.length < 6) return sendError(res, 400, "Name, username, email and a password of at least 6 characters are required.");
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();
  const exists = process.env.MONGO_URI ? await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] }) : memory.users.find((user) => user.email === normalizedEmail || user.username === normalizedUsername);
  if (exists) return sendError(res, 409, "An account with that email or username already exists.");
  const data = { name: name.trim(), username: normalizedUsername, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role: "customer", active: true };
  const user = process.env.MONGO_URI ? await User.create(data) : (memory.users.push({ id: new mongoose.Types.ObjectId().toString(), ...data }), memory.users.at(-1));
  res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const identifier = String(req.body.identifier || req.body.email || req.body.username || "").toLowerCase().trim();
  const user = process.env.MONGO_URI ? await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }) : memory.users.find((item) => item.email === identifier || item.username === identifier);
  if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) return sendError(res, 401, "Invalid username/email or password.");
  res.json({ token: tokenFor(user), user: publicUser(user) });
});
app.get("/api/users/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.get("/api/admin/users", auth, roles("admin"), async (_req, res) => {
  const users = process.env.MONGO_URI
    ? await User.find().select("name username email role active createdAt").sort({ createdAt: -1 })
    : memory.users;
  res.json({ users: users.map((user) => ({ ...publicUser(user), active: user.active, createdAt: user.createdAt })) });
});

app.patch("/api/admin/users/:id", auth, roles("admin"), async (req, res) => {
  const updates = {};
  if (["customer", "agent", "admin"].includes(req.body.role)) updates.role = req.body.role;
  if (typeof req.body.active === "boolean") updates.active = req.body.active;
  if (process.env.MONGO_URI) {
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("name username email role active createdAt");
    if (!user) return sendError(res, 404, "User not found.");
    return res.json({ user: { ...publicUser(user), active: user.active, createdAt: user.createdAt } });
  }
  const user = memory.users.find((item) => item.id === req.params.id);
  if (!user) return sendError(res, 404, "User not found.");
  Object.assign(user, updates);
  res.json({ user: { ...publicUser(user), active: user.active } });
});

app.get("/api/categories", auth, (_req, res) => res.json({ categories }));

app.post("/api/ai/chat", auth, roles("customer"), async (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message) return sendError(res, 400, "Message cannot be empty.");
  if (message.length > 1000) return sendError(res, 400, "Message is too long.");
  const isStaff = ["agent", "admin"].includes(req.user.role);
  const systemPrompt = isStaff
    ? "You are SyncBot Agent Copilot for a support agent or administrator. Help with triaging queues, prioritizing complaints, drafting professional customer replies, explaining statuses, and suggesting next actions. Never tell staff to create a ticket for a customer; staff are handling existing tickets. Do not invent account actions, refunds, or ticket updates."
    : "You are SyncBot Customer Assistant. Give concise, practical guidance. Never invent account actions, refunds, or ticket updates. If a customer needs a human, tell them to create or reply to a support ticket.";

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ]
        })
      });
      const data = await response.json();
      if (response.ok && data.choices?.[0]?.message?.content) return res.json({ reply: data.choices[0].message.content, mode: "openai" });
      console.error("OpenAI chat request failed", data.error || data);
    } catch (error) { console.error("OpenAI chat request failed", error.message); }
  }

  const lower = message.toLowerCase();
  let reply = isStaff
    ? "I can help triage the queue, compare priority, draft a customer reply, or suggest the next support action."
    : "I can help explain support topics, ticket statuses, billing questions, and account issues. For a case-specific problem, please create a ticket so our team can investigate it.";
  if (lower.includes("password") || lower.includes("login")) reply = isStaff ? "For an account-access complaint, verify the customer identity, review the exact error, and avoid requesting or recording their password. Suggested status: In Progress while the account is investigated." : "For login trouble, check your email and password first. If you still cannot sign in, create an Account ticket and include the exact error message. Never share your password in a ticket.";
  if (lower.includes("billing") || lower.includes("payment") || lower.includes("charged")) reply = isStaff ? "For a billing complaint, verify the transaction reference and payment status, then send a concise acknowledgement. Do not request full card numbers." : "For a payment concern, create a Billing ticket with the order reference and transaction date. Do not include full card numbers or passwords.";
  if (lower.includes("status") || lower.includes("ticket")) reply = isStaff ? "Open a ticket from the queue to review its conversation, use Analyze with AI for a summary, then update status and priority from Ticket controls." : "You can view your ticket status and conversation in My Tickets. Reply there if you need to add more information.";
  res.json({ reply, mode: "local-fallback" });
});

app.get("/api/tickets/stats", auth, async (req, res) => {
  const list = await visibleTickets(req.user);
  res.json({ total: list.length, open: list.filter((t) => t.status === "Open").length, inProgress: list.filter((t) => t.status === "In Progress").length, resolved: list.filter((t) => t.status === "Resolved").length, highPriority: list.filter((t) => ["High", "Critical"].includes(t.priority)).length });
});

async function visibleTickets(user) {
  if (process.env.MONGO_URI) {
    const filter = user.role === "customer" ? { customer: user._id } : user.role === "agent" ? { $or: [{ assignedAgent: user._id }, { assignedAgent: null }] } : {};
    return Ticket.find(filter).populate("customer assignedAgent").sort({ createdAt: -1 });
  }
  return memory.tickets.filter((ticket) => user.role === "customer" ? ticket.customer === user.id : user.role === "agent" ? !ticket.assignedAgent || ticket.assignedAgent === user.id : true);
}

app.get("/api/tickets", auth, async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const query = String(req.query.search || "").toLowerCase();
  let list = await visibleTickets(req.user);
  list = list.filter((ticket) => (!query || `${ticket.subject} ${ticket.ticketNumber || ticket.id} ${ticket.customer?.name || ""}`.toLowerCase().includes(query)) && (!req.query.status || ticket.status === req.query.status) && (!req.query.priority || ticket.priority === req.query.priority) && (!req.query.category || ticket.category === req.query.category));
  res.json({ tickets: list.slice((page - 1) * limit, page * limit).map((ticket) => normalizeTicket(ticket, req.user.role !== "customer")), pagination: { page, limit, total: list.length, pages: Math.max(Math.ceil(list.length / limit), 1) } });
});

app.post("/api/tickets", auth, roles("customer"), async (req, res) => {
  const { subject, description, category, priority = "Medium", contact } = req.body;
  if (!subject || !description || !contact || !categories.includes(category) || !priorities.includes(priority)) return sendError(res, 400, "Subject, description, contact, category and a valid priority are required.");
  if (process.env.MONGO_URI) {
    const ticket = await Ticket.create({ ticketNumber: `TKT-${Date.now().toString().slice(-6)}`, subject, description, contact, category, priority, customer: req.user._id, messages: [{ author: req.user._id, body: description, kind: "reply" }] });
    return res.status(201).json({ ticket: normalizeTicket(ticket) });
  }
  const ticket = { id: `TKT-${memory.nextTicket++}`, ticketNumber: `TKT-${memory.nextTicket - 1}`, subject: subject.trim(), description: description.trim(), contact: contact.trim(), category, priority, status: "Open", customer: req.user.id, assignedAgent: null, messages: [{ id: new mongoose.Types.ObjectId().toString(), author: req.user.id, body: description.trim(), kind: "reply", createdAt: new Date().toISOString() }], createdAt: new Date().toISOString() };
  memory.tickets.unshift(ticket);
  res.status(201).json({ ticket: normalizeTicket(ticket) });
});

async function getTicket(id) {
  return process.env.MONGO_URI ? Ticket.findOne({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ticketNumber: id }] }).populate("customer assignedAgent messages.author") : memory.tickets.find((ticket) => ticket.id === id || ticket.ticketNumber === id);
}
app.get("/api/tickets/:id", auth, async (req, res) => {
  const ticket = await getTicket(req.params.id);
  if (!ticket) return sendError(res, 404, "Ticket not found.");
  const isOwner = String(ticket.customer?._id || ticket.customer) === String(req.user._id || req.user.id);
  if (req.user.role === "customer" && !isOwner) return sendError(res, 403, "You can only view your own tickets.");
  res.json({ ticket: normalizeTicket(ticket, req.user.role !== "customer") });
});

app.patch("/api/tickets/:id", auth, roles("agent", "admin"), async (req, res) => {
  const allowed = {};
  for (const field of ["status", "priority", "category"]) if (req.body[field]) allowed[field] = req.body[field];
  if (allowed.status && !statuses.includes(allowed.status)) return sendError(res, 400, "Invalid status.");
  if (allowed.priority && !priorities.includes(allowed.priority)) return sendError(res, 400, "Invalid priority.");
  if (allowed.category && !categories.includes(allowed.category)) return sendError(res, 400, "Invalid category.");
  if (process.env.MONGO_URI) { const ticket = await Ticket.findOneAndUpdate({ $or: [{ _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }, { ticketNumber: req.params.id }] }, allowed, { new: true }).populate("customer assignedAgent"); if (!ticket) return sendError(res, 404, "Ticket not found."); return res.json({ ticket: normalizeTicket(ticket, true) }); }
  const ticket = await getTicket(req.params.id); if (!ticket) return sendError(res, 404, "Ticket not found."); Object.assign(ticket, allowed); res.json({ ticket: normalizeTicket(ticket, true) });
});

app.post("/api/tickets/:id/messages", auth, async (req, res) => {
  const body = String(req.body.body || "").trim(); if (!body) return sendError(res, 400, "Message cannot be empty.");
  const ticket = await getTicket(req.params.id); if (!ticket) return sendError(res, 404, "Ticket not found.");
  const isOwner = String(ticket.customer?._id || ticket.customer) === String(req.user._id || req.user.id);
  if (req.user.role === "customer" && !isOwner) return sendError(res, 403, "You can only reply to your own tickets.");
  if (process.env.MONGO_URI) { ticket.messages.push({ author: req.user._id, body, kind: "reply" }); await ticket.save(); await ticket.populate("customer assignedAgent messages.author"); return res.status(201).json({ ticket: normalizeTicket(ticket, req.user.role !== "customer") }); }
  ticket.messages.push({ id: new mongoose.Types.ObjectId().toString(), author: req.user.id, body, kind: "reply", createdAt: new Date().toISOString() }); if (req.user.role === "agent") ticket.status = "In Progress"; res.status(201).json({ ticket: normalizeTicket(ticket, req.user.role !== "customer") });
});

app.post("/api/tickets/:id/notes", auth, roles("agent", "admin"), async (req, res) => {
  const body = String(req.body.body || "").trim(); if (!body) return sendError(res, 400, "Note cannot be empty."); const ticket = await getTicket(req.params.id); if (!ticket) return sendError(res, 404, "Ticket not found.");
  if (process.env.MONGO_URI) { ticket.messages.push({ author: req.user._id, body, kind: "note" }); await ticket.save(); await ticket.populate("customer assignedAgent messages.author"); return res.status(201).json({ ticket: normalizeTicket(ticket, true) }); }
  ticket.messages.push({ id: new mongoose.Types.ObjectId().toString(), author: req.user.id, body, kind: "note", createdAt: new Date().toISOString() }); res.status(201).json({ ticket: normalizeTicket(ticket, true) });
});

app.post("/api/tickets/:id/ai-analysis", auth, roles("agent", "admin"), async (req, res) => {
  const ticket = await getTicket(req.params.id); if (!ticket) return sendError(res, 404, "Ticket not found.");
  const text = `${ticket.subject} ${ticket.description}`.toLowerCase();
  const category = text.includes("payment") || text.includes("charged") || text.includes("invoice") ? "Billing" : ticket.category;
  const priority = text.includes("urgent") || text.includes("twice") || text.includes("blocked") ? "High" : ticket.priority;
  const fallback = { summary: `${ticket.subject}. ${ticket.description}`.slice(0, 240), category, priority, sentiment: priority === "High" ? "Frustrated" : "Neutral", suggestedResponse: "Thanks for reporting this. We are reviewing the details and will update you with the next step shortly.", recommendedAction: `Review the ${category.toLowerCase()} details and confirm the resolution with the customer.` };
  if (!process.env.OPENAI_API_KEY) return res.json({ analysis: fallback, mode: "local-fallback" });

  try {
    const conversation = (ticket.messages || []).filter((message) => message.kind !== "note").slice(-10).map((message) => `${message.author?.name || "User"}: ${message.body}`).join("\n");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an AI support operations assistant. Analyze the supplied ticket only. Return valid JSON with exactly these string keys: summary, category, priority, sentiment, suggestedResponse, recommendedAction. Category must be one of Technical Issue, Billing, Account, Product, General Inquiry. Priority must be one of Low, Medium, High, Critical. Do not invent refunds, account changes, or facts." },
          { role: "user", content: JSON.stringify({ subject: ticket.subject, description: ticket.description, category: ticket.category, priority: ticket.priority, status: ticket.status, conversation }) }
        ]
      })
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!response.ok || !content) throw new Error(data.error?.message || "AI provider returned no analysis.");
    const analysis = { ...fallback, ...JSON.parse(content) };
    return res.json({ analysis, mode: "openai" });
  } catch (error) {
    console.error("AI ticket analysis failed:", error.message);
    return res.json({ analysis: fallback, mode: "local-fallback", warning: "The AI provider was unavailable, so the local analysis was returned." });
  }
});

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: "Unexpected server error." }); });

async function start() {
  if (process.env.MONGO_URI) { await mongoose.connect(process.env.MONGO_URI); console.log("MongoDB connected"); } else { await seedMemory(); console.log(process.env.ALLOW_IN_MEMORY_AUTH === "true" ? "Running with explicitly enabled in-memory development accounts" : "Running without persistence; set MONGO_URI before creating real staff accounts"); }
  if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => console.log(`SyncBot API listening on http://localhost:${port}`));
  }
}

export { app, memory, start };

if (process.env.NODE_ENV !== "test") {
  start().catch((error) => { console.error(error); process.exit(1); });
}
