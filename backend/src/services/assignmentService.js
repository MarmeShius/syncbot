/**
 * Summarizes each agent's unresolved customers and tickets.
 *
 * @param {Array} agents - Active agents available for assignment
 * @param {Array} tickets - All tickets used to measure current workload
 * @returns {Map<string, { customerCount: number, activeTicketCount: number }>}
 */
export function getAgentWorkloads(agents, tickets) {
  const workloadMap = new Map();
  for (const agent of agents) {
    const agentId = String(agent._id || agent.id);
    workloadMap.set(agentId, { customerIds: new Set(), activeTicketCount: 0 });
  }

  for (const ticket of tickets) {
    // Resolved and closed tickets no longer contribute to active customer workload.
    if (["Resolved", "Closed"].includes(ticket.status)) continue;

    const assignedId = ticket.assignedAgent?._id || ticket.assignedAgent?.id || ticket.assignedAgent;
    const customerId = ticket.customer?._id || ticket.customer?.id || ticket.customer;
    const workload = assignedId ? workloadMap.get(String(assignedId)) : null;
    if (workload) {
      workload.activeTicketCount += 1;
      if (customerId) workload.customerIds.add(String(customerId));
    }
  }

  return new Map(
    [...workloadMap].map(([agentId, workload]) => [
      agentId,
      {
        customerCount: workload.customerIds.size,
        activeTicketCount: workload.activeTicketCount,
      },
    ]),
  );
}

/**
 * Assigns to the agent with the fewest active customers, then fewest active tickets.
 */
export async function findLeastLoadedAgent(getAgents, getTickets) {
  const agents = typeof getAgents === "function" ? await getAgents() : getAgents;
  if (!agents?.length) return null;

  const tickets = typeof getTickets === "function" ? await getTickets() : getTickets;
  const workloadMap = getAgentWorkloads(agents, tickets);
  return agents.reduce((bestAgent, agent) => {
    if (!bestAgent) return agent;
    const agentId = String(agent._id || agent.id);
    const bestAgentId = String(bestAgent._id || bestAgent.id);
    const workload = workloadMap.get(agentId);
    const bestWorkload = workloadMap.get(bestAgentId);
    return workload.customerCount < bestWorkload.customerCount ||
      (workload.customerCount === bestWorkload.customerCount &&
        (workload.activeTicketCount < bestWorkload.activeTicketCount ||
          (workload.activeTicketCount === bestWorkload.activeTicketCount &&
            agentId.localeCompare(bestAgentId) < 0)))
      ? agent
      : bestAgent;
  }, null);
}
