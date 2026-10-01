// SLA targets in milliseconds
export const SLA_POLICIES = {
  Critical: {
    responseTimeMs: 2 * 60 * 60 * 1000,   // 2 hours
    resolutionTimeMs: 6 * 60 * 60 * 1000, // 6 hours
  },
  High: {
    responseTimeMs: 4 * 60 * 60 * 1000,   // 4 hours
    resolutionTimeMs: 12 * 60 * 60 * 1000,// 12 hours
  },
  Medium: {
    responseTimeMs: 8 * 60 * 60 * 1000,   // 8 hours
    resolutionTimeMs: 24 * 60 * 60 * 1000,// 24 hours
  },
  Low: {
    responseTimeMs: 24 * 60 * 60 * 1000,  // 24 hours
    resolutionTimeMs: 48 * 60 * 60 * 1000,// 48 hours
  },
};

export function computeInitialSLA(priority = "Medium", baseTime = new Date()) {
  const now = new Date(baseTime).getTime();
  const policy = SLA_POLICIES[priority] || SLA_POLICIES.Medium;

  return {
    responseDue: new Date(now + policy.responseTimeMs).toISOString(),
    resolutionDue: new Date(now + policy.resolutionTimeMs).toISOString(),
    firstResponseAt: null,
    resolvedAt: null,
    isResponseBreached: false,
    isResolutionBreached: false,
  };
}

export function evaluateSLA(sla, currentStatus = "Open") {
  if (!sla) return { status: "NORMAL", message: "No SLA tracked" };

  const now = Date.now();
  const isResolved = ["Resolved", "Closed"].includes(currentStatus);

  const responseDueTime = new Date(sla.responseDue).getTime();
  const resolutionDueTime = new Date(sla.resolutionDue).getTime();

  const responseBreached = sla.firstResponseAt
    ? new Date(sla.firstResponseAt).getTime() > responseDueTime
    : now > responseDueTime;

  const resolutionBreached = sla.resolvedAt
    ? new Date(sla.resolvedAt).getTime() > resolutionDueTime
    : isResolved
    ? false
    : now > resolutionDueTime;

  const isBreached = responseBreached || resolutionBreached;

  // Check if approaching deadline (< 60 mins remaining)
  const remainingResponse = responseDueTime - now;
  const remainingResolution = resolutionDueTime - now;
  const isApproaching =
    !isResolved &&
    !isBreached &&
    ((!sla.firstResponseAt && remainingResponse > 0 && remainingResponse < 60 * 60 * 1000) ||
      (remainingResolution > 0 && remainingResolution < 2 * 60 * 60 * 1000));

  let badge = "HEALTHY";
  if (isBreached) badge = "BREACHED";
  else if (isApproaching) badge = "AT_RISK";
  else if (isResolved) badge = "MET";

  return {
    badge,
    isBreached,
    isApproaching,
    responseBreached,
    resolutionBreached,
    responseRemainingMs: Math.max(0, responseDueTime - now),
    resolutionRemainingMs: Math.max(0, resolutionDueTime - now),
  };
}

export function onStaffReply(sla) {
  if (!sla) return sla;
  const updated = { ...sla };
  if (!updated.firstResponseAt) {
    const now = new Date();
    updated.firstResponseAt = now.toISOString();
    const responseDueTime = new Date(updated.responseDue).getTime();
    updated.isResponseBreached = now.getTime() > responseDueTime;
  }
  return updated;
}

export function onTicketResolved(sla) {
  if (!sla) return sla;
  const updated = { ...sla };
  const now = new Date();
  updated.resolvedAt = now.toISOString();
  const resolutionDueTime = new Date(updated.resolutionDue).getTime();
  updated.isResolutionBreached = now.getTime() > resolutionDueTime;
  return updated;
}

