import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "";
process.env.ALLOW_IN_MEMORY_AUTH = "true";
process.env.DEV_CUSTOMER_NAME = "Test Customer";
process.env.DEV_CUSTOMER_USERNAME = "customer_test";
process.env.DEV_CUSTOMER_EMAIL = "customer-test@example.com";
process.env.DEV_CUSTOMER_PASSWORD = "Customer123!";
process.env.DEV_AGENT_NAME = "Test Agent";
process.env.DEV_AGENT_USERNAME = "agent_test";
process.env.DEV_AGENT_EMAIL = "agent-test@example.com";
process.env.DEV_AGENT_PASSWORD = "Agent123!";
process.env.DEV_ADMIN_NAME = "Test Admin";
process.env.DEV_ADMIN_USERNAME = "admin_test";
process.env.DEV_ADMIN_EMAIL = "admin-test@example.com";
process.env.DEV_ADMIN_PASSWORD = "Admin123!";

const { app, memory, start } = await import("../src/server.js");
await start();

let customerToken;
let secondCustomerToken;
let agentToken;
let adminToken;
let ticketId;

before(async () => {
  const customerLogin = await request(app)
    .post("/api/auth/login")
    .send({ identifier: "customer_test", password: "Customer123!" });
  customerToken = customerLogin.body.token;

  const agentLogin = await request(app)
    .post("/api/auth/login")
    .send({ identifier: "agent_test", password: "Agent123!" });
  agentToken = agentLogin.body.token;

  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ identifier: "admin_test", password: "Admin123!" });
  adminToken = adminLogin.body.token;

  const secondCustomer = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Second Customer",
      username: "second_customer",
      email: "second@example.com",
      password: "Customer123!",
    });
  secondCustomerToken = secondCustomer.body.token;
});

after(() => {
  memory.users.length = 0;
  memory.tickets.length = 0;
});

test("rejects invalid login credentials", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ identifier: "customer_test", password: "wrong-password" });
  assert.equal(response.status, 401);
  assert.match(response.body.message, /Invalid/);
});

test("blocks customer-only ticket creation for an agent", async () => {
  const response = await request(app)
    .post("/api/tickets")
    .set("Authorization", `Bearer ${agentToken}`)
    .send({
      subject: "Not allowed",
      description: "Agent cannot create this",
      category: "Account",
      priority: "Low",
      contact: "agent-test@example.com",
    });
  assert.equal(response.status, 403);
});

test("creates a ticket with SLA tracking and automatic agent assignment", async () => {
  const response = await request(app)
    .post("/api/tickets")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      subject: "Cannot sign in",
      description: "The login form rejects my password repeatedly.",
      category: "Account",
      priority: "High",
      contact: "customer-test@example.com",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.ticket.subject, "Cannot sign in");
  ticketId = response.body.ticket.id;

  // SLA should be initiated
  assert.ok(response.body.ticket.sla);
  assert.ok(response.body.ticket.sla.responseDue);
  assert.ok(response.body.ticket.sla.resolutionDue);
  assert.equal(response.body.ticket.slaEvaluation.isBreached, false);

  // Auto-assigned to the active agent
  assert.ok(response.body.ticket.assignedAgent);
  assert.equal(response.body.ticket.assignedAgent.username, "agent_test");
  assert.equal(response.body.ticket.autoAssigned, true);
});

test("prevents another customer from viewing the ticket", async () => {
  const response = await request(app)
    .get(`/api/tickets/${ticketId}`)
    .set("Authorization", `Bearer ${secondCustomerToken}`);
  assert.equal(response.status, 403);
});

test("allows an agent to post a reply and sets SLA first response time", async () => {
  const response = await request(app)
    .post(`/api/tickets/${ticketId}/messages`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ body: "We are reviewing your login issue right now." });

  assert.equal(response.status, 201);
  assert.equal(response.body.ticket.status, "In Progress");
  assert.ok(response.body.ticket.sla.firstResponseAt);
});

test("allows an agent to update status to Resolved", async () => {
  const response = await request(app)
    .patch(`/api/tickets/${ticketId}`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ status: "Resolved" });

  assert.equal(response.status, 200);
  assert.equal(response.body.ticket.status, "Resolved");
  assert.ok(response.body.ticket.sla.resolvedAt);
});

test("allows customer to submit CSAT satisfaction rating", async () => {
  const response = await request(app)
    .post(`/api/tickets/${ticketId}/csat`)
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ rating: 5, feedback: "Excellent and fast support!" });

  assert.equal(response.status, 200);
  assert.equal(response.body.csat.rating, 5);
  assert.equal(response.body.csat.feedback, "Excellent and fast support!");
});

test("generates an AI ticket title suggestion", async () => {
  const response = await request(app)
    .post("/api/ai/suggest-title")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      description: "My subscription payment was charged twice this morning.",
      category: "Billing",
    });

  assert.equal(response.status, 200);
  assert.ok(response.body.title);
});

test("returns FAQ articles for the customer portal", async () => {
  const response = await request(app)
    .get("/api/kb")
    .set("Authorization", `Bearer ${customerToken}`);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.articles));
  assert.ok(response.body.articles.length > 0);
  assert.ok(response.body.articles.some((article) => article.title));
});

test("returns RAG knowledge base search result", async () => {
  const response = await request(app)
    .post("/api/ai/rag-search")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ query: "What are the SLA policies?" });

  assert.equal(response.status, 200);
  assert.ok(response.body.answer);
  assert.ok(Array.isArray(response.body.sources));
});

test("provides analytics dashboard data for admin", async () => {
  const response = await request(app)
    .get("/api/analytics/dashboard")
    .set("Authorization", `Bearer ${adminToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.total, 1);
  assert.equal(response.body.resolved, 1);
  assert.equal(response.body.csatAverage, "5.0");
  assert.equal(response.body.csatTotalReviews, 1);
  assert.ok(Array.isArray(response.body.agentLeaderboard));
});
