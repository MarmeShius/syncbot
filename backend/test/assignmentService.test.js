import assert from "node:assert/strict";
import { test } from "node:test";
import { findLeastLoadedAgent, getAgentWorkloads } from "../src/services/assignmentService.js";

test("assigns to an available agent with no unresolved tickets", async () => {
  const agents = [
    { id: "maya", active: true },
    { id: "maryam", active: true },
  ];
  const tickets = [
    { status: "Open", assignedAgent: "maya", customer: "customer-1" },
    { status: "In Progress", assignedAgent: "maya", customer: "customer-1" },
    { status: "Waiting for Customer", assignedAgent: "maya", customer: "customer-2" },
    { status: "Resolved", assignedAgent: "maryam", customer: "customer-3" },
    { status: "Closed", assignedAgent: "maryam", customer: "customer-4" },
  ];

  const selected = await findLeastLoadedAgent(agents, tickets);

  assert.equal(selected.id, "maryam");
});

test("balances by distinct active customers before using active tickets as a tiebreaker", async () => {
  const agents = [
    { id: "maya", active: true },
    { id: "maryam", active: true },
  ];
  const tickets = [
    { status: "Open", assignedAgent: "maya", customer: "same-customer" },
    { status: "In Progress", assignedAgent: { id: "maya" }, customer: "same-customer" },
    { status: "Waiting for Customer", assignedAgent: "maya", customer: "same-customer" },
    { status: "Open", assignedAgent: { _id: "maryam" }, customer: "other-customer" },
    { status: "In Progress", assignedAgent: "maryam", customer: "third-customer" },
  ];

  const workloads = getAgentWorkloads(agents, tickets);
  assert.deepEqual(workloads.get("maya"), { customerCount: 1, activeTicketCount: 3 });
  assert.deepEqual(workloads.get("maryam"), { customerCount: 2, activeTicketCount: 2 });
  assert.equal((await findLeastLoadedAgent(agents, tickets)).id, "maya");

  tickets.push({ status: "Waiting for Customer", assignedAgent: "maya", customer: "third-customer" });
  assert.equal((await findLeastLoadedAgent(agents, tickets)).id, "maryam");
});

test("returns null when no agents are available", async () => {
  const tickets = [{ status: "Open", assignedAgent: "maya", customer: "customer-1" }];
  assert.equal(await findLeastLoadedAgent([], tickets), null);
});

test("breaks complete workload ties by agent id", async () => {
  const selected = await findLeastLoadedAgent(
    [{ id: "maryam" }, { id: "maya" }],
    [],
  );

  assert.equal(selected.id, "maryam");
});

test("supports asynchronous agent and ticket sources", async () => {
  const selected = await findLeastLoadedAgent(
    async () => [{ id: "maya" }, { id: "maryam" }],
    async () => [{ status: "Open", assignedAgent: "maya", customer: "customer-1" }],
  );

  assert.equal(selected.id, "maryam");
});
