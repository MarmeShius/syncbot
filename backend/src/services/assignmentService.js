/**
 * Automatically assigns a ticket to the agent with the lowest number of active tickets.
 *
 * @param {Array|Function} getAgents - Function or array of available agents
 * @param {Array|Function} getTickets - Function or array of all tickets
 * @returns {Object|null} The chosen agent, or null if no agents available
 */
export async function findLeastLoadedAgent(getAgents, getTickets) {
  const agents = typeof getAgents === "function" ? await getAgents() : getAgents;
  if (!agents || !agents.length) return null;

  const tickets = typeof getTickets === "function" ? await getTickets() : getTickets;

  // Map agent ID to count of active tickets ("Open" or "In Progress")
  const loadMap = new Map();
  for (const agent of agents) {
    const agentId = String(agent._id || agent.id);
    loadMap.set(agentId, 0);
  }

  for (const ticket of tickets) {
    const isOngoing = ["Open", "In Progress"].includes(ticket.status);
    if (!isOngoing) continue;

    const assignedId = ticket.assignedAgent?._id || ticket.assignedAgent?.id || ticket.assignedAgent;
    if (assignedId && loadMap.has(String(assignedId))) {
      loadMap.set(String(assignedId), loadMap.get(String(assignedId)) + 1);
    }
  }

  // Find agent with minimum load
  let lowestLoad = Infinity;
  let bestAgent = null;

  for (const agent of agents) {
    const agentId = String(agent._id || agent.id);
    const load = loadMap.get(agentId) ?? 0;
    if (load < lowestLoad) {
      lowestLoad = load;
      bestAgent = agent;
    }
  }

  return bestAgent;
}

