import assert from "node:assert/strict";
import { test } from "node:test";
import { onStaffReply, onTicketResolved } from "../src/services/slaService.js";

test("normalizes missing SLA notifications when an agent replies", () => {
  const updated = onStaffReply({
    responseDue: new Date(Date.now() + 60_000).toISOString(),
    resolutionDue: new Date(Date.now() + 120_000).toISOString(),
    firstResponseAt: null,
  });

  assert.ok(updated.firstResponseAt);
  assert.deepEqual(updated.notifications, {});
});

test("normalizes missing SLA notifications when a ticket is resolved", () => {
  const updated = onTicketResolved({
    resolutionDue: new Date(Date.now() + 60_000).toISOString(),
  });

  assert.ok(updated.resolvedAt);
  assert.deepEqual(updated.notifications, {});
});
