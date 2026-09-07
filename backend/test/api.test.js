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
let ticketId;

before(async () => {
  const customerLogin = await request(app).post("/api/auth/login").send({ identifier: "customer_test", password: "Customer123!" });
  customerToken = customerLogin.body.token;
  const agentLogin = await request(app).post("/api/auth/login").send({ identifier: "agent_test", password: "Agent123!" });
  agentToken = agentLogin.body.token;
  const secondCustomer = await request(app).post("/api/auth/register").send({ name: "Second Customer", username: "second_customer", email: "second@example.com", password: "Customer123!" });
  secondCustomerToken = secondCustomer.body.token;
});

after(() => {
  memory.users.length = 0;
  memory.tickets.length = 0;
});

test("rejects invalid login credentials", async () => {
  const response = await request(app).post("/api/auth/login").send({ identifier: "customer_test", password: "wrong-password" });
  assert.equal(response.status, 401);
  assert.match(response.body.message, /Invalid/);
});

test("blocks customer-only ticket creation for an agent", async () => {
  const response = await request(app).post("/api/tickets").set("Authorization", `Bearer ${agentToken}`).send({ subject: "Not allowed", description: "Agent cannot create this", category: "Account", priority: "Low", contact: "agent-test@example.com" });
  assert.equal(response.status, 403);
});

test("creates a ticket for a customer and stores it in memory test persistence", async () => {
  const response = await request(app).post("/api/tickets").set("Authorization", `Bearer ${customerToken}`).send({ subject: "Cannot sign in", description: "The login form rejects my password.", category: "Account", priority: "High", contact: "customer-test@example.com" });
  assert.equal(response.status, 201);
  assert.equal(response.body.ticket.subject, "Cannot sign in");
  ticketId = response.body.ticket.id;
  assert.equal(memory.tickets.length, 1);
});

test("prevents another customer from viewing the ticket", async () => {
  const response = await request(app).get(`/api/tickets/${ticketId}`).set("Authorization", `Bearer ${secondCustomerToken}`);
  assert.equal(response.status, 403);
});

test("allows an agent to update ticket status", async () => {
  const response = await request(app).patch(`/api/tickets/${ticketId}`).set("Authorization", `Bearer ${agentToken}`).send({ status: "In Progress" });
  assert.equal(response.status, 200);
  assert.equal(response.body.ticket.status, "In Progress");
});
