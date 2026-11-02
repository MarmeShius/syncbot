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

const { app, memory, start, checkSlaNotifications } = await import("../src/server.js");
const { emailTestOutbox } = await import("../src/services/emailService.js");
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
  emailTestOutbox.length = 0;
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
  assert.ok(emailTestOutbox.some((mail) => mail.to === "customer-test@example.com" && mail.subject.includes("Received")));
  assert.ok(emailTestOutbox.some((mail) => mail.to === "agent-test@example.com" && mail.subject.includes("assigned")));

  const analytics = await request(app)
    .get("/api/analytics/dashboard")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(analytics.status, 200);
  const assignedAgent = analytics.body.agentLeaderboard.find((agent) => agent.email === "agent-test@example.com");
  assert.equal(assignedAgent.activeCustomerCount, 1);
  assert.equal(assignedAgent.activeTicketCount, 1);
});

test("prevents another customer from viewing the ticket", async () => {
  const response = await request(app)
    .get(`/api/tickets/${ticketId}`)
    .set("Authorization", `Bearer ${secondCustomerToken}`);
  assert.equal(response.status, 403);
});

test("allows an agent to post a reply and sets SLA first response time", async () => {
  emailTestOutbox.length = 0;
  const sendAgentReply = (body) => request(app)
    .post(`/api/tickets/${ticketId}/messages`)
    .set("Authorization", "Bearer " + agentToken)
    .send({ body });
  const response = await sendAgentReply("We are reviewing your login issue right now.");
  const secondReply = await sendAgentReply("I have checked the account details as well.");

  assert.equal(response.status, 201);
  assert.equal(secondReply.status, 201);
  assert.equal(response.body.ticket.status, "In Progress");
  assert.ok(response.body.ticket.sla.firstResponseAt);
  await new Promise((resolve) => setImmediate(resolve));
  const customerMessages = emailTestOutbox.filter(
    (mail) => mail.to === "customer-test@example.com" && mail.subject.includes("New update from Test Agent"),
  );
  assert.equal(customerMessages.length, 2);
  assert.ok(emailTestOutbox.some((mail) => mail.to === "customer-test@example.com" && mail.subject.includes("responded within the service target")));
});

test("emails the assigned agent every time the customer replies", async () => {
  emailTestOutbox.length = 0;
  const sendCustomerReply = (body) => request(app)
    .post(`/api/tickets/${ticketId}/messages`)
    .set("Authorization", "Bearer " + customerToken)
    .send({ body });
  const response = await sendCustomerReply("I can reproduce the sign-in problem on my phone too.");
  const secondReply = await sendCustomerReply("The problem also appears in another browser.");

  assert.equal(response.status, 201);
  assert.equal(secondReply.status, 201);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    emailTestOutbox.filter((mail) => mail.to === "agent-test@example.com" && mail.subject.includes("Test Customer")).length,
    2,
  );
});

test("allows an agent to update status to Resolved", async () => {
  emailTestOutbox.length = 0;
  const response = await request(app)
    .patch(`/api/tickets/${ticketId}`)
    .set("Authorization", "Bearer " + agentToken)
    .send({ status: "Resolved" });

  assert.equal(response.status, 200);
  assert.equal(response.body.ticket.status, "Resolved");
  assert.ok(response.body.ticket.sla.resolvedAt);
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(emailTestOutbox.some((mail) => mail.to === "customer-test@example.com" && mail.subject.includes("Marked as Resolved")));
  assert.ok(emailTestOutbox.some((mail) => mail.to === "customer-test@example.com" && mail.subject.includes("Resolution service target met")));

  emailTestOutbox.length = 0;
  const closed = await request(app)
    .patch(`/api/tickets/${ticketId}`)
    .set("Authorization", "Bearer " + agentToken)
    .send({ status: "Closed" });
  assert.equal(closed.status, 200);
  assert.ok(emailTestOutbox.some((mail) => mail.to === "customer-test@example.com" && mail.subject.includes("Status update: Closed")));
});

test("emails customers once when SLA deadlines pass without a response", async () => {
  const overdueTicket = {
    id: "sla-overdue-test",
    ticketNumber: "sla-overdue-test",
    subject: "Overdue support request",
    status: "Open",
    customer: { name: "Test Customer", email: "customer-test@example.com" },
    sla: {
      responseDue: new Date(0).toISOString(),
      resolutionDue: new Date(0).toISOString(),
      firstResponseAt: null,
      resolvedAt: null,
      notifications: {},
    },
  };
  memory.tickets.push(overdueTicket);
  emailTestOutbox.length = 0;

  try {
    await checkSlaNotifications(Date.now());
    const firstRunCount = emailTestOutbox.length;
    await checkSlaNotifications(Date.now());

    assert.equal(firstRunCount, 2);
    assert.equal(emailTestOutbox.length, firstRunCount);
    assert.ok(emailTestOutbox.some((mail) => mail.subject.includes("have not responded")));
    assert.ok(emailTestOutbox.some((mail) => mail.subject.includes("resolution deadline has passed")));
  } finally {
    memory.tickets = memory.tickets.filter((ticket) => ticket !== overdueTicket);
  }
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

test("falls back to a local ticket title when OpenRouter rejects the API key", async () => {
  const previousFetch = globalThis.fetch;
  const previousApiKey = process.env.OPENROUTER_API_KEY;
  let providerCalls = 0;
  process.env.OPENROUTER_API_KEY = "rejected-test-key";
  globalThis.fetch = async () => {
    providerCalls += 1;
    return new Response(JSON.stringify({ error: { message: "User not found." } }), { status: 401 });
  };

  try {
    const makeRequest = () => request(app)
    .post("/api/ai/suggest-title")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      description: "My subscription payment was charged twice this morning.",
      category: "Billing",
    });
    const response = await makeRequest();
    const retriedResponse = await makeRequest();

    assert.equal(response.status, 200);
    assert.ok(response.body.title);
    assert.equal(response.body.mode, "local-fallback");
    assert.equal(retriedResponse.status, 200);
    assert.equal(retriedResponse.body.mode, "local-fallback");
    assert.equal(providerCalls, 1);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousApiKey;
  }
});

test("requires a customer conversation to start AI ticket intake", async () => {
  const response = await request(app)
    .post("/api/ai/ticket-intake")
    .set("Authorization", "Bearer " + customerToken)
    .send({ messages: [] });

  assert.equal(response.status, 400);
});

test("returns a valid ticket draft from the AI intake assistant", async () => {
  const previousFetch = globalThis.fetch;
  const previousApiKey = process.env.OPENROUTER_API_KEY;
  const previousTicketModel = process.env.OPENROUTER_TICKET_MODEL;
  let providerRequest;
  process.env.OPENROUTER_API_KEY = "test-api-key";
  process.env.OPENROUTER_TICKET_MODEL = "openai/fast-ticket-test";
  globalThis.fetch = async (_url, options) => {
    providerRequest = JSON.parse(options.body);
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reply: "I have enough details, so I am creating your ticket now.",
                ready: true,
                draft: {
                  subject: "Duplicate subscription charge",
                  description: "The subscription payment was charged twice this morning.",
                  category: "Billing",
                  priority: "Medium",
                },
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const response = await request(app)
      .post("/api/ai/ticket-intake")
      .set("Authorization", "Bearer " + customerToken)
      .send({ messages: [{ role: "user", content: "My subscription was charged twice." }] });

    assert.equal(response.status, 200);
    assert.equal(response.body.ready, true);
    assert.equal(response.body.draft.category, "Billing");
    assert.equal(response.body.draft.priority, "Medium");
    assert.equal(providerRequest.model, "openai/fast-ticket-test");
    assert.equal(providerRequest.max_tokens, 500);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousApiKey;
    if (previousTicketModel === undefined) delete process.env.OPENROUTER_TICKET_MODEL;
    else process.env.OPENROUTER_TICKET_MODEL = previousTicketModel;
  }
});

test("falls back to local ticket intake when OpenRouter rejects the API key", async () => {
  const previousFetch = globalThis.fetch;
  const previousApiKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "rejected-intake-test-key";
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: { message: "User not found." } }), { status: 401 });

  try {
    const response = await request(app)
      .post("/api/ai/ticket-intake")
      .set("Authorization", "Bearer " + customerToken)
      .send({
        messages: [{ role: "user", content: "My subscription payment was charged twice this morning." }],
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.mode, "local-fallback");
    assert.equal(response.body.ready, true);
    assert.equal(response.body.draft.category, "Billing");
    assert.match(response.body.reply, /AI service is unavailable/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousApiKey;
  }
});

test("falls back to the knowledge base when OpenRouter chat is unavailable", async () => {
  const previousFetch = globalThis.fetch;
  const previousApiKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "rejected-chat-test-key";
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: { message: "User not found." } }), { status: 401 });

  try {
    const response = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer " + customerToken)
      .send({ message: "qxzvplmbrt" });

    assert.equal(response.status, 200);
    assert.equal(response.body.mode, "local-fallback");
    assert.match(response.body.reply, /AI service is unavailable/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousApiKey;
  }
});

test("prevents staff from using customer AI ticket intake", async () => {
  const response = await request(app)
    .post("/api/ai/ticket-intake")
    .set("Authorization", "Bearer " + agentToken)
    .send({ messages: [{ role: "user", content: "My order is missing." }] });

  assert.equal(response.status, 403);
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
  const resolvedAgent = response.body.agentLeaderboard.find(
    (agent) => agent.email === "agent-test@example.com",
  );
  assert.equal(resolvedAgent.resolvedCount, 1);
  assert.equal(resolvedAgent.resolvedCustomerCount, 1);
});
