import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Ticket,
  Settings,
  Search,
  Activity,
} from "lucide-react";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import SlaBadge from "../components/SlaBadge";

function Admin() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeSection, setActiveSection] = useState("analytics");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [systemSettings, setSystemSettings] = useState({ autoAssignEnabled: true });


  async function loadData() {
    try {
      const [userResult, ticketResult, analyticsResult, settingsResult] =
        await Promise.all([
          apiRequest("/admin/users"),
          apiRequest("/tickets?limit=50"),
          apiRequest("/analytics/dashboard"),
          apiRequest("/admin/settings").catch(() => ({ settings: { autoAssignEnabled: true } })),
        ]);

      setUsers(
        userResult.users.map((item) => ({
          ...item,
          role: item.role.charAt(0).toUpperCase() + item.role.slice(1),
          status: item.active ? "Active" : "Suspended",
          joined: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
        }))
      );

      setTickets(
        ticketResult.tickets.map((item) => ({
          ...item,
          customerName: item.customer?.name || "Customer",
          agentName: item.assignedAgent?.name || "Unassigned",
        }))
      );

      setAnalytics(analyticsResult);
      if (settingsResult.settings) setSystemSettings(settingsResult.settings);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // WebSockets: Real-time update for Admin
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      apiRequest("/tickets?limit=50").then((res) => {
        setTickets(
          res.tickets.map((item) => ({
            ...item,
            customerName: item.customer?.name || "Customer",
            agentName: item.assignedAgent?.name || "Unassigned",
          }))
        );
      }).catch(() => {});

      apiRequest("/analytics/dashboard").then((data) => {
        setAnalytics(data);
      }).catch(() => {});
    };

    socket.on("ticket:created", handleUpdate);
    socket.on("ticket:updated", handleUpdate);
    socket.on("ticket:csat", handleUpdate);

    return () => {
      socket.off("ticket:created", handleUpdate);
      socket.off("ticket:updated", handleUpdate);
      socket.off("ticket:csat", handleUpdate);
    };
  }, [socket]);

  const changeUserRole = async (id, role) => {
    try {
      const result = await apiRequest(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: role.toLowerCase() }),
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, role, status: result.user.active ? "Active" : "Suspended" }
            : item
        )
      );
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const toggleUserStatus = async (id) => {
    const currentUser = users.find((item) => item.id === id);
    if (!currentUser) return;
    try {
      const result = await apiRequest(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: currentUser.status !== "Active" }),
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: result.user.active ? "Active" : "Suspended" }
            : item
        )
      );
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const toggleAutoAssign = async () => {
    const nextVal = !systemSettings.autoAssignEnabled;
    try {
      const res = await apiRequest("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ autoAssignEnabled: nextVal }),
      });
      setSystemSettings(res.settings);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sync<span className="text-emerald-600 dark:text-emerald-400">Bot</span> Admin
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            System Operations Control
          </p>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5 text-xs font-semibold">
          {[
            ["analytics", "Analytics Dashboard", BarChart3],
            ["dashboard", "Overview & KPIs", Activity],
            ["users", "User Management", Users],
            ["tickets", "Ticket Oversight", Ticket],
            ["settings", "System Settings", Settings],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition ${
                activeSection === id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-xs font-bold text-white">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {user?.name || "Administrator"}
              </p>
              <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-6 sm:p-8">
        {/* Mobile Navigation */}
        <div className="mb-6 flex flex-wrap gap-1.5 lg:hidden">
          {[
            ["analytics", "Analytics", BarChart3],
            ["dashboard", "Overview", Activity],
            ["users", "Users", Users],
            ["tickets", "Tickets", Ticket],
            ["settings", "Settings", Settings],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                activeSection === id
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* 1. ANALYTICS DASHBOARD */}
        {activeSection === "analytics" && analytics && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Analytics &amp; Performance Metrics
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Service Level Agreements (SLA), Customer Satisfaction (CSAT), and operational throughput.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Volume</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{analytics.total}</p>
                <span className="text-[10px] text-emerald-600 font-medium">All recorded</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Response SLA</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {analytics.responseSlaCompliance}%
                </p>
                <span className="text-[10px] text-slate-400">Met deadline</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Resolution SLA</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {analytics.resolutionSlaCompliance}%
                </p>
                <span className="text-[10px] text-slate-400">Within target</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg 1st Response</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.avgFirstResponseHours}h
                </p>
                <span className="text-[10px] text-slate-400">Speed to reply</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg Resolution</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.avgResolutionHours}h
                </p>
                <span className="text-[10px] text-slate-400">Time to close</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">CSAT Score</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <p className="text-2xl font-extrabold text-amber-500">{analytics.csatAverage}</p>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                <span className="text-[10px] text-slate-400">{analytics.csatTotalReviews} reviews</span>
              </div>
            </div>

            {/* Visual Charts: Category and Priority Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Tickets by Category Breakdown
                </h3>
                <div className="mt-5 space-y-3.5">
                  {Object.entries(analytics.categoryCounts || {}).map(([cat, cnt]) => {
                    const pct = analytics.total ? Math.round((cnt / analytics.total) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>{cat}</span>
                          <span>{cnt} ({pct}%)</span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority & CSAT Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Customer Satisfaction (CSAT) Distribution
                </h3>
                <div className="mt-5 space-y-2.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = analytics.csatDistribution?.[stars] || 0;
                    const pct = analytics.csatTotalReviews
                      ? Math.round((count / analytics.csatTotalReviews) * 100)
                      : 0;

                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold text-amber-500">{stars} Stars</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-medium text-slate-500 dark:text-slate-400">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Agent Performance Leaderboard */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Agent Support Leaderboard
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Performance across resolution volume, speed, and customer ratings.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5">Agent Name</th>
                      <th className="px-6 py-3.5">Assigned Tickets</th>
                      <th className="px-6 py-3.5">Resolved Count</th>
                      <th className="px-6 py-3.5">Avg CSAT Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {analytics.agentLeaderboard?.map((ag) => (
                      <tr key={ag.agentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {ag.name}
                          <span className="block text-[11px] font-normal text-slate-400">
                            {ag.email}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {ag.totalAssigned}
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          {ag.resolvedCount}
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-500">
                          {ag.avgCsat !== "N/A" ? `★ ${ag.avgCsat} / 5.0` : "No ratings yet"}
                        </td>
                      </tr>
                    ))}
                    {!analytics.agentLeaderboard?.length && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                          No active agents registered in system.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 2. MAIN OVERVIEW / DASHBOARD */}
        {activeSection === "dashboard" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Workspace Overview
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                High-level operational overview across all queues.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Users</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{users.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">Active Agents</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                  {users.filter((u) => u.role === "Agent" && u.status === "Active").length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">Open Tickets</p>
                <p className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {tickets.filter((t) => t.status === "Open").length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">Resolved</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {tickets.filter((t) => ["Resolved", "Closed"].includes(t.status)).length}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 3. USER MANAGEMENT */}
        {activeSection === "users" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  User Management
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Assign user roles and manage access privileges.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter users..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Joined</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {u.name}
                          <span className="block text-[11px] font-normal text-slate-400">{u.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={u.role}
                            onChange={(e) => changeUserRole(u.id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <option value="Customer">Customer</option>
                            <option value="Agent">Agent</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              u.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{u.joined}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className="text-xs font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                          >
                            {u.status === "Active" ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 4. TICKET OVERSIGHT */}
        {activeSection === "tickets" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  Ticket Oversight
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Global view of all submitted customer support tickets.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter tickets..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5">Ticket</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Assigned Agent</th>
                      <th className="px-6 py-3.5">SLA Tracking</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 block text-[11px]">
                            {t.id}
                          </span>
                          {t.subject}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {t.customerName}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          {t.agentName}
                        </td>
                        <td className="px-6 py-4">
                          <SlaBadge sla={t.sla} status={t.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              t.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : t.status === "In Progress"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        
        {/* 6. SYSTEM SETTINGS */}
        {activeSection === "settings" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                System Settings
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Configure automated workflows, routing policies, and notification triggers.
              </p>
            </div>

            <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Automatic Ticket Routing
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Automatically assign incoming customer tickets to the least-loaded active agent.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleAutoAssign}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    systemSettings.autoAssignEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      systemSettings.autoAssignEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Active SLA Configuration
                </h4>
                <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex justify-between">
                    <span>Critical Priority:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">2h Response / 6h Resolution</span>
                  </li>
                  <li className="flex justify-between">
                    <span>High Priority:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">4h Response / 12h Resolution</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Medium Priority:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">8h Response / 24h Resolution</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Low Priority:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">24h Response / 48h Resolution</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Admin;
