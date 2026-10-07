import "dotenv/config";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import { Server } from "socket.io";

import {
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendNewRegistrationAdminEmail,
  sendTicketCreatedEmail,
  sendNewTicketStaffEmail,
  sendTicketAssignedEmail,
  sendMessageNotificationEmail,
  sendTicketStatusChangedEmail,
  sendTicketResolvedEmail,
} from "./services/emailService.js";
import {
  computeInitialSLA,
  evaluateSLA,
  onStaffReply,
  onTicketResolved,
} from "./services/slaService.js";
import { findLeastLoadedAgent } from "./services/assignmentService.js";
import { generateOpenRouterText } from "./services/openrouter.js";
import {
  DEFAULT_KB_ARTICLES,
  searchArticles,
  generateRAGAnswer,
  suggestTicketTitle,
} from "./services/kbService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || "development-secret-change-me";

const categories = ["Technical Issue", "Billing", "Account", "Product", "General Inquiry"];
const statuses = ["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"];
const priorities = ["Low", "Medium", "High", "Critical"];

const memory = {
  users: [],
  tickets: [],
  articles: JSON.parse(JSON.stringify(DEFAULT_KB_ARTICLES)),
  settings: { autoAssignEnabled: true },
  nextTicket: 1001,
};

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, jwtSecret);
    socket.user = payload;
    next();
  } catch {
    next();
  }
});

io.on("connection", (socket) => {
  if (socket.user) {
    socket.join(`user:${socket.user.sub}`);
    if (socket.user.role) {
      socket.join(`role:${socket.user.role}`);
    }
  }

  socket.on("join:ticket", (ticketId) => {
    if (ticketId) socket.join(`ticket:${ticketId}`);
  });

  socket.on("leave:ticket", (ticketId) => {
    if (ticketId) socket.leave(`ticket:${ticketId}`);
  });

  socket.on("typing", ({ ticketId, name }) => {
    if (ticketId) {
      socket.to(`ticket:${ticketId}`).emit("user:typing", { ticketId, name });
    }
  });
});

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
    cb(null, unique);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Database Schemas
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "agent", "admin"], default: "customer" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  url: String,
  size: Number,
  mimetype: String,
});

const messageSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["reply", "note"], default: "reply" },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    category: { type: String, enum: categories, required: true },
    priority: { type: String, enum: priorities, default: "Medium" },
    status: { type: String, enum: statuses, default: "Open" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    autoAssigned: { type: Boolean, default: false },
    attachments: [attachmentSchema],
    sla: {
      responseDue: Date,
      resolutionDue: Date,
      firstResponseAt: Date,
      resolvedAt: Date,
      isResponseBreached: { type: Boolean, default: false },
      isResolutionBreached: { type: Boolean, default: false },
    },
    csat: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String,
      ratedAt: Date,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);
ticketSchema.index({ subject: "text", ticketNumber: "text" });

const articleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    tags: [String],
    content: { type: String, required: true },
    views: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);
const Article = mongoose.model("Article", articleSchema);

const publicUser = (user) => {
  if (!user) return null;
  return {
    id: user._id || user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

const tokenFor = (user) =>
  jwt.sign({ sub: String(user._id || user.id), role: user.role }, jwtSecret, { expiresIn: "7d" });

const sendError = (res, status, message) => res.status(status).json({ message });

function notifyNewRegistration(user) {
  void sendWelcomeEmail(user);
  void (async () => {
    const admins = process.env.MONGO_URI
      ? await User.find({ role: "admin", active: true })
      : memory.users.filter((item) => item.role === "admin" && item.active);
    await Promise.all(admins.map((admin) => sendNewRegistrationAdminEmail(admin, user)));
  })().catch((error) => console.error("Admin registration notification failed:", error.message));
}

function notifyStaffAboutNewTicket(ticket, customer) {
  void (async () => {
    const staff = process.env.MONGO_URI
      ? await User.find({ role: { $in: ["agent", "admin"] }, active: true })
      : memory.users.filter((item) => ["agent", "admin"].includes(item.role) && item.active);
    const assignedEmail = ticket.assignedAgent?.email?.toLowerCase();
    const recipients = staff.filter((item) => item.email?.toLowerCase() !== assignedEmail);
    await Promise.all(recipients.map((item) => sendNewTicketStaffEmail(item, ticket, customer)));
  })().catch((error) => console.error("New ticket staff notification failed:", error.message));
}

const normalizeTicket = (ticket, includeNotes = false) => {
  const raw = ticket.toObject ? ticket.toObject() : ticket;
  const slaEvaluation = raw.sla ? evaluateSLA(raw.sla, raw.status) : null;

  return {
    ...raw,
    id: raw.ticketNumber || raw.id,
    customer: raw.customer && typeof raw.customer === "object" ? publicUser(raw.customer) : raw.customer,
    assignedAgent:
      raw.assignedAgent && typeof raw.assignedAgent === "object"
        ? publicUser(raw.assignedAgent)
        : raw.assignedAgent,
    messages: (raw.messages || []).filter((message) => includeNotes || message.kind !== "note"),
    slaEvaluation,
  };
};

async function seedMemory() {
  if (process.env.ALLOW_IN_MEMORY_AUTH !== "true" || memory.users.length) return;
  const accounts = [
    [process.env.DEV_CUSTOMER_NAME, process.env.DEV_CUSTOMER_USERNAME, process.env.DEV_CUSTOMER_EMAIL, process.env.DEV_CUSTOMER_PASSWORD, "customer"],
    [process.env.DEV_AGENT_NAME, process.env.DEV_AGENT_USERNAME, process.env.DEV_AGENT_EMAIL, process.env.DEV_AGENT_PASSWORD, "agent"],
    [process.env.DEV_ADMIN_NAME, process.env.DEV_ADMIN_USERNAME, process.env.DEV_ADMIN_EMAIL, process.env.DEV_ADMIN_PASSWORD, "admin"],
  ].filter((account) => account.every(Boolean));

  for (const [name, username, email, password, role] of accounts) {
    memory.users.push({
      id: new mongoose.Types.ObjectId().toString(),
      name,
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      active: true,
    });
  }
}

const findMemoryUser = (id) => memory.users.find((user) => String(user.id) === String(id));
const findUser = async (id) => (process.env.MONGO_URI ? User.findById(id) : findMemoryUser(id));

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return sendError(res, 401, "Authentication required.");
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret);
    const user = await findUser(payload.sub);
    if (!user || user.active === false) return sendError(res, 401, "Your session is no longer valid.");
    req.user = user;
    next();
  } catch {
    return sendError(res, 401, "Invalid or expired token.");
  }
}

const roles = (...allowed) => (req, res, next) =>
  allowed.includes(req.user.role) ? next() : sendError(res, 403, "You do not have permission for this action.");

// Helper for live event emission
function broadcastTicketUpdate(event, ticket, payload = {}) {
  const norm = normalizeTicket(ticket, true);
  const normCustomer = normalizeTicket(ticket, false);

  io.to(`ticket:${ticket.ticketNumber || ticket.id}`).emit(event, { ticket: norm, ...payload });
  io.to("role:agent").emit(event, { ticket: norm, ...payload });
  io.to("role:admin").emit(event, { ticket: norm, ...payload });

  const customerId = ticket.customer?._id || ticket.customer?.id || ticket.customer;
  if (customerId) {
    io.to(`user:${customerId}`).emit(event, { ticket: normCustomer, ...payload });
  }
}

/* ---------------------- ROUTES ---------------------- */

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "syncbot-api" }));

// AUTH
app.post("/api/auth/register", async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password || password.length < 6) {
    return sendError(res, 400, "Name, username, email and a password of at least 6 characters are required.");
  }
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  const exists = process.env.MONGO_URI
    ? await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] })
    : memory.users.find((user) => user.email === normalizedEmail || user.username === normalizedUsername);

  if (exists) return sendError(res, 409, "An account with that email or username already exists.");

  const data = {
    name: name.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    role: "customer",
    active: true,
  };

  const user = process.env.MONGO_URI
    ? await User.create(data)
    : (memory.users.push({ id: new mongoose.Types.ObjectId().toString(), ...data, createdAt: new Date().toISOString() }), memory.users.at(-1));

  notifyNewRegistration(user);
  const customer = { ...publicUser(user), createdAt: user.createdAt || new Date().toISOString() };
  io.to("role:agent").emit("customer:registered", { customer });
  io.to("role:admin").emit("customer:registered", { customer });
  res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const identifier = String(req.body.identifier || req.body.email || req.body.username || "").toLowerCase().trim();
  const user = process.env.MONGO_URI
    ? await User.findOne({ $or: [{ email: identifier }, { username: identifier }] })
    : memory.users.find((item) => item.email === identifier || item.username === identifier);

  if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) {
    return sendError(res, 401, "Invalid username/email or password.");
  }
  void sendLoginNotificationEmail(user);
  res.json({ token: tokenFor(user), user: publicUser(user) });
});

app.get("/api/users/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

// CUSTOMER DIRECTORY (agents and admins)
app.get("/api/agent/customers", auth, roles("agent", "admin"), async (_req, res) => {
  const customers = process.env.MONGO_URI
    ? await User.find({ role: "customer", active: true })
        .select("name username email role active createdAt")
        .sort({ createdAt: -1 })
    : memory.users
        .filter((user) => user.role === "customer" && user.active)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.json({
    customers: customers.map((customer) => ({
      ...publicUser(customer),
      active: customer.active,
      createdAt: customer.createdAt || null,
    })),
  });
});

// ADMIN USERS
app.get("/api/admin/users", auth, roles("admin"), async (_req, res) => {
  const users = process.env.MONGO_URI
    ? await User.find().select("name username email role active createdAt").sort({ createdAt: -1 })
    : memory.users;
  res.json({ users: users.map((u) => ({ ...publicUser(u), active: u.active, createdAt: u.createdAt })) });
});

app.patch("/api/admin/users/:id", auth, roles("admin"), async (req, res) => {
  const updates = {};
  if (["customer", "agent", "admin"].includes(req.body.role)) updates.role = req.body.role;
  if (typeof req.body.active === "boolean") updates.active = req.body.active;

  if (process.env.MONGO_URI) {
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select(
      "name username email role active createdAt"
    );
    if (!user) return sendError(res, 404, "User not found.");
    return res.json({ user: { ...publicUser(user), active: user.active, createdAt: user.createdAt } });
  }

  const user = memory.users.find((item) => item.id === req.params.id);
  if (!user) return sendError(res, 404, "User not found.");
  Object.assign(user, updates);
  res.json({ user: { ...publicUser(user), active: user.active } });
});

// ADMIN SETTINGS
app.get("/api/admin/settings", auth, roles("admin"), (_req, res) => {
  res.json({ settings: memory.settings });
});

app.patch("/api/admin/settings", auth, roles("admin"), (req, res) => {
  if (typeof req.body.autoAssignEnabled === "boolean") {
    memory.settings.autoAssignEnabled = req.body.autoAssignEnabled;
  }
  res.json({ settings: memory.settings });
});

// FILE UPLOAD ENDPOINT
app.post("/api/upload", auth, upload.single("file"), (req, res) => {
  if (!req.file) return sendError(res, 400, "No file uploaded.");
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    attachment: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

app.get("/api/categories", auth, (_req, res) => res.json({ categories }));

// AI TITLE SUGGESTION
app.post("/api/ai/suggest-title", auth, async (req, res) => {
  const { description, category } = req.body;
  try {
    const result = await suggestTicketTitle(description, category);
    res.json(result);
  } catch (error) {
    console.error("OpenRouter title request failed:", error.message);
    sendError(res, 502, `OpenRouter title request failed: ${error.message}`);
  }
});

// AI RAG SEARCH
app.post("/api/ai/rag-search", auth, async (req, res) => {
  const query = String(req.body.query || req.body.message || "").trim();
  if (!query) return sendError(res, 400, "Query cannot be empty.");

  const articles = process.env.MONGO_URI ? await Article.find() : memory.articles;
  try {
    const result = await generateRAGAnswer(query, articles);
    res.json(result);
  } catch (error) {
    console.error("Knowledge base RAG request failed:", error.message);
    sendError(res, 502, `Knowledge base RAG request failed: ${error.message}`);
  }
});

// KNOWLEDGE BASE CRUD
app.get("/api/kb", auth, async (req, res) => {
  const query = String(req.query.search || "").trim();
  const category = req.query.category;
  let list = process.env.MONGO_URI ? await Article.find() : memory.articles;

  if (category) {
    list = list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }
  if (query) {
    list = searchArticles(list, query);
  }
  res.json({ articles: list });
});

app.get("/api/kb/:id", auth, async (req, res) => {
  const id = req.params.id;
  if (process.env.MONGO_URI) {
    const article = await Article.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { slug: id }, { id }],
    });
    if (!article) return sendError(res, 404, "Article not found.");
    article.views = (article.views || 0) + 1;
    await article.save();
    return res.json({ article });
  }

  const article = memory.articles.find((a) => a.id === id || a.slug === id);
  if (!article) return sendError(res, 404, "Article not found.");
  article.views = (article.views || 0) + 1;
  res.json({ article });
});

app.post("/api/kb", auth, roles("admin"), async (req, res) => {
  const { title, category, content, tags = [] } = req.body;
  if (!title || !category || !content) return sendError(res, 400, "Title, category, and content are required.");
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  if (process.env.MONGO_URI) {
    const created = await Article.create({ title, category, content, tags, slug });
    return res.status(201).json({ article: created });
  }

  const created = {
    id: `kb-${Date.now()}`,
    slug,
    title,
    category,
    content,
    tags: Array.isArray(tags) ? tags : [tags],
    views: 0,
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
  };
  memory.articles.unshift(created);
  res.status(201).json({ article: created });
});

app.patch("/api/kb/:id", auth, roles("admin"), async (req, res) => {
  const allowed = {};
  for (const field of ["title", "category", "content", "tags"]) {
    if (req.body[field] !== undefined) allowed[field] = req.body[field];
  }

  if (process.env.MONGO_URI) {
    const updated = await Article.findOneAndUpdate(
      { $or: [{ _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }, { slug: req.params.id }] },
      allowed,
      { new: true }
    );
    if (!updated) return sendError(res, 404, "Article not found.");
    return res.json({ article: updated });
  }

  const article = memory.articles.find((a) => a.id === req.params.id || a.slug === req.params.id);
  if (!article) return sendError(res, 404, "Article not found.");
  Object.assign(article, allowed);
  res.json({ article });
});

app.delete("/api/kb/:id", auth, roles("admin"), async (req, res) => {
  if (process.env.MONGO_URI) {
    await Article.findOneAndDelete({
      $or: [{ _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }, { slug: req.params.id }],
    });
    return res.json({ ok: true });
  }

  memory.articles = memory.articles.filter((a) => a.id !== req.params.id && a.slug !== req.params.id);
  res.json({ ok: true });
});

app.post("/api/kb/:id/vote", auth, async (req, res) => {
  if (process.env.MONGO_URI) {
    const article = await Article.findOneAndUpdate(
      { $or: [{ _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }, { slug: req.params.id }] },
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );
    return res.json({ helpfulCount: article?.helpfulCount || 0 });
  }

  const article = memory.articles.find((a) => a.id === req.params.id || a.slug === req.params.id);
  if (!article) return sendError(res, 404, "Article not found.");
  article.helpfulCount = (article.helpfulCount || 0) + 1;
  res.json({ helpfulCount: article.helpfulCount });
});

// AI CHAT (Customer Assistant & Staff Copilot with RAG grounding)
app.post("/api/ai/chat", auth, async (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message) return sendError(res, 400, "Message cannot be empty.");
  if (message.length > 1000) return sendError(res, 400, "Message is too long.");

  const isStaff = ["agent", "admin"].includes(req.user.role);

  try {
    const articles = process.env.MONGO_URI ? await Article.find() : memory.articles;
    const ragResult = await generateRAGAnswer(message, articles);
    const hasKnowledgeMatches = (ragResult.sources || []).length > 0;

    if (hasKnowledgeMatches) {
      return res.json({
        reply: ragResult.answer,
        mode: "local-rag",
        sources: ragResult.sources,
      });
    }

    if (process.env.OPENROUTER_API_KEY) {
      const rolePrompt = isStaff
        ? "You are SyncBot Agent Copilot for a support agent or administrator. Help with triaging queues, prioritizing complaints, drafting professional customer replies, explaining statuses, and citing knowledge base articles when relevant."
        : "You are SyncBot Customer Assistant. Give concise, practical guidance. If the customer needs personal investigation, tell them to open a ticket.";

      const groundingPrompt =
        "No matching Knowledge Base article was found. Answer the user's general question using your general knowledge. Make clear that this is general guidance, not confirmed SyncBot or company policy. Do not invent account-specific facts, policies, or guarantees; direct the user to support for those.";

      const reply = await generateOpenRouterText({
        systemPrompt: `${rolePrompt} ${groundingPrompt}`,
        userPrompt: `User Question:\n${message}`,
        temperature: 0.2,
      });

      return res.json({ reply, mode: "openrouter-general", sources: [] });
    }

    return res.json({
      reply: ragResult.answer,
      mode: "local-rag",
      sources: ragResult.sources,
    });
  } catch (error) {
    console.error("OpenRouter chat request failed:", error.message);
    return sendError(res, 502, `OpenRouter chat request failed: ${error.message}`);
  }
});

// TICKETS
async function visibleTickets(user) {
  if (process.env.MONGO_URI) {
    const filter =
      user.role === "customer"
        ? { customer: user._id }
        : {};
    return Ticket.find(filter).populate("customer assignedAgent").sort({ createdAt: -1 });
  }
  return memory.tickets.filter((ticket) => {
    if (user.role === "customer") {
      const custId = ticket.customer?._id || ticket.customer?.id || ticket.customer;
      return String(custId) === String(user.id);
    }
    return true;
  });
}

async function getTicket(id) {
  if (process.env.MONGO_URI) {
    return Ticket.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { ticketNumber: id }],
    }).populate("customer assignedAgent messages.author");
  }
  return memory.tickets.find((ticket) => ticket.id === id || ticket.ticketNumber === id);
}

// TICKET STATS
app.get("/api/tickets/stats", auth, async (req, res) => {
  const list = await visibleTickets(req.user);
  res.json({
    total: list.length,
    open: list.filter((t) => t.status === "Open").length,
    inProgress: list.filter((t) => t.status === "In Progress").length,
    resolved: list.filter((t) => t.status === "Resolved").length,
    highPriority: list.filter((t) => ["High", "Critical"].includes(t.priority)).length,
  });
});

// ANALYTICS DASHBOARD
app.get("/api/analytics/dashboard", auth, roles("agent", "admin"), async (req, res) => {
  const allTickets = process.env.MONGO_URI
    ? await Ticket.find().populate("customer assignedAgent")
    : memory.tickets;

  const total = allTickets.length;
  const statusCounts = {};
  const categoryCounts = {};
  const priorityCounts = {};

  let totalResponseTimeMs = 0;
  let responseCount = 0;
  let totalResolutionTimeMs = 0;
  let resolutionCount = 0;
  let responseSlaMetCount = 0;
  let resolutionSlaMetCount = 0;
  let csatTotal = 0;
  let csatCount = 0;
  const csatDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const t of allTickets) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;

    // SLA tracking
    if (t.sla) {
      if (t.sla.firstResponseAt) {
        responseCount++;
        const duration = new Date(t.sla.firstResponseAt).getTime() - new Date(t.createdAt).getTime();
        totalResponseTimeMs += Math.max(0, duration);
        if (!t.sla.isResponseBreached) responseSlaMetCount++;
      }
      if (["Resolved", "Closed"].includes(t.status) && t.sla.resolvedAt) {
        resolutionCount++;
        const duration = new Date(t.sla.resolvedAt).getTime() - new Date(t.createdAt).getTime();
        totalResolutionTimeMs += Math.max(0, duration);
        if (!t.sla.isResolutionBreached) resolutionSlaMetCount++;
      }
    }

    // CSAT tracking
    if (t.csat?.rating) {
      csatCount++;
      csatTotal += t.csat.rating;
      csatDistribution[t.csat.rating] = (csatDistribution[t.csat.rating] || 0) + 1;
    }
  }

  // Agent Leaderboard
  const allAgents = process.env.MONGO_URI
    ? await User.find({ role: "agent" })
    : memory.users.filter((u) => u.role === "agent");

  const agentLeaderboard = allAgents.map((agent) => {
    const agentId = String(agent._id || agent.id);
    const assigned = allTickets.filter(
      (t) => String(t.assignedAgent?._id || t.assignedAgent?.id || t.assignedAgent) === agentId
    );
    const resolved = assigned.filter((t) => ["Resolved", "Closed"].includes(t.status));
    const ratings = assigned.filter((t) => t.csat?.rating).map((t) => t.csat.rating);
    const avgCsat = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "N/A";

    return {
      agentId,
      name: agent.name,
      email: agent.email,
      totalAssigned: assigned.length,
      resolvedCount: resolved.length,
      avgCsat,
    };
  });

  res.json({
    total,
    open: statusCounts["Open"] || 0,
    inProgress: statusCounts["In Progress"] || 0,
    resolved: (statusCounts["Resolved"] || 0) + (statusCounts["Closed"] || 0),
    avgFirstResponseHours: responseCount ? (totalResponseTimeMs / responseCount / 3600000).toFixed(1) : "0.0",
    avgResolutionHours: resolutionCount ? (totalResolutionTimeMs / resolutionCount / 3600000).toFixed(1) : "0.0",
    responseSlaCompliance: responseCount ? Math.round((responseSlaMetCount / responseCount) * 100) : 100,
    resolutionSlaCompliance: resolutionCount ? Math.round((resolutionSlaMetCount / resolutionCount) * 100) : 100,
    csatAverage: csatCount ? (csatTotal / csatCount).toFixed(1) : "5.0",
    csatTotalReviews: csatCount,
    csatDistribution,
    categoryCounts,
    priorityCounts,
    agentLeaderboard,
  });
});

// LIST TICKETS
app.get("/api/tickets", auth, async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const query = String(req.query.search || "").toLowerCase();
  const slaFilter = req.query.slaFilter;

  let list = await visibleTickets(req.user);

  list = list.filter((ticket) => {
    const matchesSearch =
      !query ||
      `${ticket.subject} ${ticket.ticketNumber || ticket.id} ${ticket.customer?.name || ""}`
        .toLowerCase()
        .includes(query);
    const matchesStatus = !req.query.status || ticket.status === req.query.status;
    const matchesPriority = !req.query.priority || ticket.priority === req.query.priority;
    const matchesCategory = !req.query.category || ticket.category === req.query.category;

    let matchesSla = true;
    if (slaFilter && ticket.sla) {
      const evalSla = evaluateSLA(ticket.sla, ticket.status);
      if (slaFilter === "breached") matchesSla = evalSla.isBreached;
      else if (slaFilter === "at_risk") matchesSla = evalSla.isApproaching;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesSla;
  });

  res.json({
    tickets: list
      .slice((page - 1) * limit, page * limit)
      .map((ticket) => normalizeTicket(ticket, req.user.role !== "customer")),
    pagination: {
      page,
      limit,
      total: list.length,
      pages: Math.max(Math.ceil(list.length / limit), 1),
    },
  });
});

// CREATE TICKET (with SLA initiation, auto-assignment, email & attachments)
app.post("/api/tickets", auth, roles("customer"), async (req, res) => {
  const { subject, description, category, priority = "Medium", contact, attachments = [] } = req.body;
  if (!subject || !description || !contact || !categories.includes(category) || !priorities.includes(priority)) {
    return sendError(res, 400, "Subject, description, contact, category and a valid priority are required.");
  }

  const initialSLA = computeInitialSLA(priority);

  // Auto-assignment evaluation
  let assignedAgent = null;
  let autoAssigned = false;
  if (memory.settings.autoAssignEnabled) {
    const agents = process.env.MONGO_URI
      ? await User.find({ role: "agent", active: true })
      : memory.users.filter((u) => u.role === "agent" && u.active);
    const allTickets = process.env.MONGO_URI ? await Ticket.find() : memory.tickets;
    assignedAgent = await findLeastLoadedAgent(agents, allTickets);
    if (assignedAgent) autoAssigned = true;
  }

  let createdTicket;

  if (process.env.MONGO_URI) {
    const ticketDoc = await Ticket.create({
      ticketNumber: `TKT-${Date.now().toString().slice(-6)}`,
      subject: subject.trim(),
      description: description.trim(),
      contact: contact.trim(),
      category,
      priority,
      status: "Open",
      customer: req.user._id,
      assignedAgent: assignedAgent ? assignedAgent._id : null,
      autoAssigned,
      attachments,
      sla: initialSLA,
      messages: [{ author: req.user._id, body: description.trim(), kind: "reply", attachments }],
    });
    createdTicket = await Ticket.findById(ticketDoc._id).populate("customer assignedAgent messages.author");
  } else {
    const ticketNum = `TKT-${memory.nextTicket++}`;
    const newTicket = {
      id: ticketNum,
      ticketNumber: ticketNum,
      subject: subject.trim(),
      description: description.trim(),
      contact: contact.trim(),
      category,
      priority,
      status: "Open",
      customer: req.user,
      assignedAgent: assignedAgent ? publicUser(assignedAgent) : null,
      autoAssigned,
      attachments,
      sla: initialSLA,
      messages: [
        {
          id: new mongoose.Types.ObjectId().toString(),
          author: publicUser(req.user),
          body: description.trim(),
          kind: "reply",
          attachments,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };
    memory.tickets.unshift(newTicket);
    createdTicket = newTicket;
  }

  // Real-time broadcast
  broadcastTicketUpdate("ticket:created", createdTicket);

  // Email notifications
  sendTicketCreatedEmail(createdTicket, req.user);
  notifyStaffAboutNewTicket(createdTicket, req.user);
  if (assignedAgent) {
    sendTicketAssignedEmail(createdTicket, assignedAgent);
  }

  res.status(201).json({ ticket: normalizeTicket(createdTicket) });
});

// GET TICKET
app.get("/api/tickets/:id", auth, async (req, res) => {
  const ticket = await getTicket(req.params.id);
  if (!ticket) return sendError(res, 404, "Ticket not found.");
  const isOwner = String(ticket.customer?._id || ticket.customer?.id || ticket.customer) === String(req.user._id || req.user.id);
  if (req.user.role === "customer" && !isOwner) {
    return sendError(res, 403, "You can only view your own tickets.");
  }
  res.json({ ticket: normalizeTicket(ticket, req.user.role !== "customer") });
});

// UPDATE TICKET (Status, Priority, Category, Assigned Agent)
app.patch("/api/tickets/:id", auth, roles("agent", "admin"), async (req, res) => {
  const allowed = {};
  for (const field of ["status", "priority", "category", "assignedAgent"]) {
    if (req.body[field] !== undefined) allowed[field] = req.body[field];
  }

  if (allowed.status && !statuses.includes(allowed.status)) return sendError(res, 400, "Invalid status.");
  if (allowed.priority && !priorities.includes(allowed.priority)) return sendError(res, 400, "Invalid priority.");
  if (allowed.category && !categories.includes(allowed.category)) return sendError(res, 400, "Invalid category.");

  const ticket = await getTicket(req.params.id);
  if (!ticket) return sendError(res, 404, "Ticket not found.");
  const previousStatus = ticket.status;
  const statusChanged = Boolean(allowed.status && allowed.status !== previousStatus);

  // Check SLA update if ticket is resolved/closed
  let updatedSla = ticket.sla;
  if (allowed.status && ["Resolved", "Closed"].includes(allowed.status) && !["Resolved", "Closed"].includes(ticket.status)) {
    updatedSla = onTicketResolved(ticket.sla);
    allowed.sla = updatedSla;
  }

  let finalTicket;
  if (process.env.MONGO_URI) {
    finalTicket = await Ticket.findOneAndUpdate(
      { $or: [{ _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }, { ticketNumber: req.params.id }] },
      allowed,
      { new: true }
    ).populate("customer assignedAgent messages.author");
  } else {
    Object.assign(ticket, allowed);
    if (allowed.assignedAgent && typeof allowed.assignedAgent === "string") {
      const agent = findMemoryUser(allowed.assignedAgent);
      if (agent) ticket.assignedAgent = publicUser(agent);
    }
    finalTicket = ticket;
  }

  // Real-time broadcast
  broadcastTicketUpdate("ticket:updated", finalTicket);

  // Email notifications
  if (statusChanged && allowed.status === "Resolved") {
    sendTicketResolvedEmail(finalTicket, finalTicket.customer);
  } else if (statusChanged) {
    sendTicketStatusChangedEmail(finalTicket, finalTicket.customer, previousStatus);
  }
  if (allowed.assignedAgent) {
    sendTicketAssignedEmail(finalTicket, finalTicket.assignedAgent);
  }

  res.json({ ticket: normalizeTicket(finalTicket, true) });
});

// AUTO-ASSIGN SINGLE TICKET
app.post("/api/tickets/:id/auto-assign", auth, roles("agent", "admin"), async (req, res) => {
  const ticket = await getTicket(req.params.id);
  if (!ticket) return sendError(res, 404, "Ticket not found.");

  const agents = process.env.MONGO_URI
    ? await User.find({ role: "agent", active: true })
    : memory.users.filter((u) => u.role === "agent" && u.active);
  const allTickets = process.env.MONGO_URI ? await Ticket.find() : memory.tickets;

  const chosenAgent = await findLeastLoadedAgent(agents, allTickets);
  if (!chosenAgent) return sendError(res, 400, "No available active agents for auto-assignment.");

  if (process.env.MONGO_URI) {
    ticket.assignedAgent = chosenAgent._id;
    ticket.autoAssigned = true;
    await ticket.save();
    await ticket.populate("customer assignedAgent messages.author");
  } else {
    ticket.assignedAgent = publicUser(chosenAgent);
    ticket.autoAssigned = true;
  }

  broadcastTicketUpdate("ticket:updated", ticket);
  sendTicketAssignedEmail(ticket, chosenAgent);

  res.json({ ticket: normalizeTicket(ticket, true), assignedAgent: publicUser(chosenAgent) });
});

// POST CSAT RATING
app.post("/api/tickets/:id/csat", auth, roles("customer"), async (req, res) => {
  const { rating, feedback } = req.body;
  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return sendError(res, 400, "Rating must be an integer between 1 and 5.");
  }

  const ticket = await getTicket(req.params.id);
  if (!ticket) return sendError(res, 404, "Ticket not found.");

  const isOwner = String(ticket.customer?._id || ticket.customer?.id || ticket.customer) === String(req.user._id || req.user.id);
  if (!isOwner) return sendError(res, 403, "You can only rate your own tickets.");

  const csatData = {
    rating: ratingNum,
    feedback: String(feedback || "").trim(),
    ratedAt: new Date().toISOString(),
  };

  if (process.env.MONGO_URI) {
    ticket.csat = csatData;
    await ticket.save();
    await ticket.populate("customer assignedAgent messages.author");
  } else {
    ticket.csat = csatData;
  }

  broadcastTicketUpdate("ticket:csat", ticket, { csat: csatData });
  res.json({ ticket: normalizeTicket(ticket, false), csat: csatData });
});

// POST MESSAGE (Customer or Staff)
app.post("/api/tickets/:id/messages", auth, async (req, res) => {
  const body = String(req.body.body || "").trim();
  const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
  if (!body && !attachments.length) return sendError(res, 400, "Message or attachment is required.");

  const ticket = await getTicket(req.params.id);
  if (!ticket) return sendError(res, 404, "Ticket not found.");

  const isOwner = String(ticket.customer?._id || ticket.customer?.id || ticket.customer) === String(req.user._id || req.user.id);
  if (req.user.role === "customer" && !isOwner) {
    return sendError(res, 403, "You can only reply to your own tickets.");
  }

  const isStaff = ["agent", "admin"].includes(req.user.role);
  const previousStatus = ticket.status;

  // Update SLA first response if staff replies
  if (isStaff && ticket.sla) {
    ticket.sla = onStaffReply(ticket.sla);
  }

  // Update status automatically: Agent reply -> "In Progress" or "Waiting for Customer"
  if (isStaff && ticket.status === "Open") {
    ticket.status = "In Progress";
  }

  const messagePayload = {
    author: process.env.MONGO_URI ? req.user._id : publicUser(req.user),
    body,
    kind: "reply",
    attachments,
    createdAt: new Date().toISOString(),
  };

  let finalTicket;
  if (process.env.MONGO_URI) {
    ticket.messages.push(messagePayload);
    await ticket.save();
    finalTicket = await Ticket.findById(ticket._id).populate("customer assignedAgent messages.author");
  } else {
    ticket.messages.push({
      id: new mongoose.Types.ObjectId().toString(),
      ...messagePayload,
    });
    finalTicket = ticket;
  }

  // Real-time broadcast
  broadcastTicketUpdate("ticket:message", finalTicket, {
    message: finalTicket.messages[finalTicket.messages.length - 1],
  });

  // Email notifications to counterpart
  const recipient = isStaff ? finalTicket.customer : finalTicket.assignedAgent;
  if (recipient) {
    sendMessageNotificationEmail(
      finalTicket,
      messagePayload,
      req.user,
      recipient,
      previousStatus !== finalTicket.status ? previousStatus : null
    );
  }

  res.status(201).json({ ticket: normalizeTicket(finalTicket, req.user.role !== "customer") });
});

// POST INTERNAL NOTE (Staff only)
app.post("/api/tickets/:id/notes", auth, roles("agent", "admin"), async (req, res) => {
  const body = String(req.body.body || "").trim();
  const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
  if (!body && !attachments.length) return sendError(res, 400, "Note body is required.");

  const ticket = await getTicket(req.params.id);
  if (!ticket) return sendError(res, 404, "Ticket not found.");

  const notePayload = {
    author: process.env.MONGO_URI ? req.user._id : publicUser(req.user),
    body,
    kind: "note",
    attachments,
    createdAt: new Date().toISOString(),
  };

  let finalTicket;
  if (process.env.MONGO_URI) {
    ticket.messages.push(notePayload);
    await ticket.save();
    finalTicket = await Ticket.findById(ticket._id).populate("customer assignedAgent messages.author");
  } else {
    ticket.messages.push({
      id: new mongoose.Types.ObjectId().toString(),
      ...notePayload,
    });
    finalTicket = ticket;
  }

  // Internal notes are only sent to agents & admins
  io.to(`ticket:${ticket.ticketNumber || ticket.id}`).emit("ticket:note", { ticket: normalizeTicket(finalTicket, true) });
  io.to("role:agent").emit("ticket:note", { ticket: normalizeTicket(finalTicket, true) });
  io.to("role:admin").emit("ticket:note", { ticket: normalizeTicket(finalTicket, true) });

  res.status(201).json({ ticket: normalizeTicket(finalTicket, true) });
});

// AI COPILOT ANALYSIS
app.post("/api/tickets/:id/ai-analysis", auth, roles("agent", "admin"), async (req, res) => {
  const ticket = await getTicket(req.params.id);
  if (!ticket) return sendError(res, 404, "Ticket not found.");

  const text = `${ticket.subject} ${ticket.description}`.toLowerCase();
  const category = text.includes("payment") || text.includes("charged") || text.includes("invoice") ? "Billing" : ticket.category;
  const priority = text.includes("urgent") || text.includes("twice") || text.includes("blocked") ? "High" : ticket.priority;
  const fallback = {
    summary: `${ticket.subject}. ${ticket.description}`.slice(0, 240),
    category,
    priority,
    sentiment: priority === "High" ? "Frustrated" : "Neutral",
    suggestedResponse: "Thanks for reporting this. We are reviewing the details and will update you with the next step shortly.",
    recommendedAction: `Review the ${category.toLowerCase()} details and confirm the resolution with the customer.`,
  };

  if (!process.env.OPENROUTER_API_KEY) return res.json({ analysis: fallback, mode: "local-fallback" });

  try {
    const conversation = (ticket.messages || [])
      .filter((message) => message.kind !== "note")
      .slice(-10)
      .map((message) => `${message.author?.name || "User"}: ${message.body}`)
      .join("\n");

    const content = await generateOpenRouterText({
      systemPrompt:
        "You are an AI support operations assistant. Analyze the supplied ticket only. Return valid JSON with exactly these string keys: summary, category, priority, sentiment, suggestedResponse, recommendedAction. Category must be one of Technical Issue, Billing, Account, Product, General Inquiry. Priority must be one of Low, Medium, High, Critical.",
      userPrompt: JSON.stringify({
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        conversation,
      }),
      temperature: 0.2,
      responseMimeType: "application/json",
    });
    const analysis = { ...fallback, ...JSON.parse(content) };
    return res.json({ analysis, mode: "openrouter" });
  } catch (error) {
    console.error("AI ticket analysis failed:", error.message);
    return sendError(res, 502, `OpenRouter ticket analysis failed: ${error.message}`);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Unexpected server error." });
});

async function start() {
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } else {
    await seedMemory();
    console.log(
      process.env.ALLOW_IN_MEMORY_AUTH === "true"
        ? "Running with explicitly enabled in-memory development accounts"
        : "Running without persistence; set MONGO_URI before creating real staff accounts"
    );
  }
  if (process.env.NODE_ENV !== "test") {
    server.listen(port, () => console.log(`SyncBot API & WebSockets listening on http://localhost:${port}`));
  }
}

export { app, server, io, memory, start };

if (process.env.NODE_ENV !== "test") {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
