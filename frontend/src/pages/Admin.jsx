import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";

function Admin() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  /* API data replaces the old local demo records. */
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  /*
    {
      id: 1,
      name: "Ali Raza",
      email: "ali@example.com",
      role: "Customer",
      status: "Active",
      joined: "Sep 01, 2026",
    },
    {
      id: 2,
      name: "Hina Khan",
      email: "hina@example.com",
      role: "Customer",
      status: "Active",
      joined: "Aug 28, 2026",
    },
    {
      id: 3,
      name: "Sarah Ahmed",
      email: "sarah@syncbot.com",
      role: "Agent",
      status: "Active",
      joined: "Aug 15, 2026",
    },
    {
      id: 4,
      name: "John Smith",
      email: "john@syncbot.com",
      role: "Agent",
      status: "Active",
      joined: "Aug 10, 2026",
    },
    {
      id: 5,
      name: "Maryam Admin",
      email: "admin@syncbot.com",
      role: "Administrator",
      status: "Active",
      joined: "Aug 01, 2026",
    },
  ]);

  const [legacyTickets] = useState([
    {
      id: "TKT-1001",
      subject: "Unable to login to my account",
      customer: "Ali Raza",
      category: "Account",
      priority: "High",
      status: "Open",
      agent: "Sarah Ahmed",
    },
    {
      id: "TKT-1002",
      subject: "Payment was deducted twice",
      customer: "Hina Khan",
      category: "Billing",
      priority: "Critical",
      status: "In Progress",
      agent: "Sarah Ahmed",
    },
    {
      id: "TKT-1003",
      subject: "Application keeps crashing",
      customer: "Usman Tariq",
      category: "Technical Issue",
      priority: "High",
      status: "Waiting for Customer",
      agent: "John Smith",
    },
    {
      id: "TKT-1004",
      subject: "Question about premium plan",
      customer: "Ayesha Malik",
      category: "Product",
      priority: "Medium",
      status: "Resolved",
      agent: "John Smith",
    },
    {
      id: "TKT-1005",
      subject: "General product inquiry",
      customer: "Hamza Ali",
      category: "General Inquiry",
      priority: "Low",
      status: "Open",
      agent: "Sarah Ahmed",
    },
  ]);

  const [legacyCategories, setLegacyCategories] = useState([
    {
      id: 1,
      name: "Technical Issue",
      description: "Problems related to technical functionality.",
      tickets: 18,
    },
    {
      id: 2,
      name: "Billing",
      description: "Payments, invoices and billing problems.",
      tickets: 12,
    },
    {
      id: 3,
      name: "Account",
      description: "Login, account and profile issues.",
      tickets: 9,
    },
    {
      id: 4,
      name: "Product",
      description: "Questions about products and features.",
      tickets: 15,
    },
    {
      id: 5,
      name: "General Inquiry",
      description: "General customer questions.",
      tickets: 7,
    },
  ]);
  */

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [userResult, ticketResult, categoryResult] = await Promise.all([
          apiRequest("/admin/users"),
          apiRequest("/tickets?limit=50"),
          apiRequest("/categories"),
        ]);
        setUsers(userResult.users.map((item) => ({
          ...item,
          role: item.role.charAt(0).toUpperCase() + item.role.slice(1),
          status: item.active ? "Active" : "Suspended",
          joined: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
        })));
        setTickets(ticketResult.tickets.map((item) => ({
          ...item,
          customer: item.customer?.name || "Customer",
          agent: item.assignedAgent?.name || "Unassigned",
        })));
        setCategories(categoryResult.categories.map((name, index) => ({ id: index + 1, name, description: "Support category", tickets: ticketResult.tickets.filter((ticket) => ticket.category === name).length })));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const [newCategory, setNewCategory] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] =
    useState("");

  const totalUsers = users.length;

  const customerCount = users.filter(
    (user) => user.role === "Customer"
  ).length;

  const agentCount = users.filter(
    (user) => user.role === "Agent"
  ).length;

  const activeTickets = tickets.filter(
    (ticket) =>
      ticket.status !== "Resolved" &&
      ticket.status !== "Closed"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.id.toLowerCase().includes(search.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.customer.toLowerCase().includes(search.toLowerCase()) ||
      ticket.category.toLowerCase().includes(search.toLowerCase())
  );

  const changeUserRole = async (id, role) => {
    try {
      const result = await apiRequest(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role: role.toLowerCase() }) });
      setUsers((currentUsers) => currentUsers.map((item) => item.id === id ? { ...item, role, status: result.user.active ? "Active" : "Suspended" } : item));
    } catch (updateError) { setError(updateError.message); }
  };

  const toggleUserStatus = async (id) => {
    const currentUser = users.find((item) => item.id === id);
    if (!currentUser) return;
    try {
      const result = await apiRequest(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ active: currentUser.status !== "Active" }) });
      setUsers((currentUsers) => currentUsers.map((item) => item.id === id ? { ...item, status: result.user.active ? "Active" : "Suspended" } : item));
    } catch (updateError) { setError(updateError.message); }
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;

    setCategories([
      ...categories,
      {
        id: Date.now(),
        name: newCategory,
        description:
          newCategoryDescription || "New support category.",
        tickets: 0,
      },
    ]);

    setNewCategory("");
    setNewCategoryDescription("");
  };

  const deleteCategory = (id) => {
    setCategories(
      categories.filter((category) => category.id !== id)
    );
  };

  const getPriorityClass = (priority) => {
    if (priority === "Critical")
      return "bg-red-100 text-red-700";

    if (priority === "High")
      return "bg-orange-100 text-orange-700";

    if (priority === "Medium")
      return "bg-yellow-100 text-yellow-700";

    return "bg-green-100 text-green-700";
  };

  const getStatusClass = (status) => {
    if (status === "Open")
      return "bg-blue-100 text-blue-700";

    if (status === "In Progress")
      return "bg-purple-100 text-purple-700";

    if (status === "Waiting for Customer")
      return "bg-yellow-100 text-yellow-700";

    if (status === "Resolved")
      return "bg-green-100 text-green-700";

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col fixed h-screen">

        <div className="p-6 border-b border-gray-700">

          <h1 className="text-2xl font-bold text-purple-400">
            SyncBot
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Administration
          </p>

        </div>

        <nav className="p-4 space-y-2">

          <button
            onClick={() => setActiveSection("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              activeSection === "dashboard"
                ? "bg-purple-600"
                : "hover:bg-gray-800"
            }`}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => setActiveSection("users")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              activeSection === "users"
                ? "bg-purple-600"
                : "hover:bg-gray-800"
            }`}
          >
            👥 User Management
          </button>

          <button
            onClick={() => setActiveSection("tickets")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              activeSection === "tickets"
                ? "bg-purple-600"
                : "hover:bg-gray-800"
            }`}
          >
            🎫 Ticket Overview
          </button>

          <button
            onClick={() => setActiveSection("categories")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              activeSection === "categories"
                ? "bg-purple-600"
                : "hover:bg-gray-800"
            }`}
          >
            🗂️ Categories
          </button>

        </nav>

        <div className="mt-auto p-4 border-t border-gray-700">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>

            <div>
              <p className="font-semibold">
                {user?.name || "Administrator"}
              </p>

              <p className="text-xs text-gray-400">
                Administrator
              </p>
            </div>

          </div>

        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">

        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">

          <div>

            <h2 className="text-xl font-bold text-gray-800">
              {activeSection === "dashboard"
                ? "Admin Dashboard"
                : activeSection === "users"
                ? "User Management"
                : activeSection === "tickets"
                ? "Ticket Overview"
                : "Category Management"}
            </h2>

            <p className="text-sm text-gray-500">
              Manage and monitor your support platform
            </p>

          </div>

          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            {user?.name?.slice(0, 2).toUpperCase() || "AD"}
          </div>

        </header>

        {error && <div className="mx-4 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">{error}</div>}
        {loading && <div className="p-8 text-center text-sm text-gray-500">Loading live admin data...</div>}

        <div className="p-4 sm:p-6">

          {/* ================= DASHBOARD ================= */}
          {activeSection === "dashboard" && (
            <div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                <div className="bg-white rounded-xl border p-5 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Total Users
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    {totalUsers}
                  </h3>

                  <p className="text-xs text-gray-400 mt-2">
                    Registered platform users
                  </p>
                </div>

                <div className="bg-white rounded-xl border p-5 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Customers
                  </p>

                  <h3 className="text-3xl font-bold mt-2 text-blue-600">
                    {customerCount}
                  </h3>

                  <p className="text-xs text-gray-400 mt-2">
                    Customer accounts
                  </p>
                </div>

                <div className="bg-white rounded-xl border p-5 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Support Agents
                  </p>

                  <h3 className="text-3xl font-bold mt-2 text-purple-600">
                    {agentCount}
                  </h3>

                  <p className="text-xs text-gray-400 mt-2">
                    Active support staff
                  </p>
                </div>

                <div className="bg-white rounded-xl border p-5 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Active Tickets
                  </p>

                  <h3 className="text-3xl font-bold mt-2 text-orange-600">
                    {activeTickets}
                  </h3>

                  <p className="text-xs text-gray-400 mt-2">
                    Requiring attention
                  </p>
                </div>

              </div>

              {/* Overview */}
              <div className="grid lg:grid-cols-2 gap-6">

                <div className="bg-white rounded-xl border">

                  <div className="p-5 border-b">
                    <h3 className="font-bold text-lg">
                      Ticket Overview
                    </h3>
                  </div>

                  <div className="p-5 space-y-5">

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">
                          Active Tickets
                        </span>

                        <span className="font-semibold">
                          {activeTickets}
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              activeTickets * 15,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">
                          Resolved Tickets
                        </span>

                        <span className="font-semibold">
                          {resolvedTickets}
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              resolvedTickets * 20,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                  </div>

                </div>

                <div className="bg-white rounded-xl border">

                  <div className="p-5 border-b">
                    <h3 className="font-bold text-lg">
                      System Summary
                    </h3>
                  </div>

                  <div className="p-5 space-y-4">

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Categories
                      </span>

                      <span className="font-bold">
                        {categories.length}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Support Agents
                      </span>

                      <span className="font-bold">
                        {agentCount}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Customers
                      </span>

                      <span className="font-bold">
                        {customerCount}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Total Tickets
                      </span>

                      <span className="font-bold">
                        {tickets.length}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* Recent Tickets */}
              <div className="bg-white rounded-xl border mt-6">

                <div className="p-5 border-b flex justify-between">
                  <h3 className="font-bold text-lg">
                    Recent Tickets
                  </h3>

                  <button
                    onClick={() => setActiveSection("tickets")}
                    className="text-purple-600 text-sm font-semibold"
                  >
                    View All
                  </button>
                </div>

                <div className="divide-y">

                  {tickets.slice(0, 4).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-5 flex flex-col md:flex-row justify-between gap-3"
                    >

                      <div>

                        <p className="text-purple-600 text-sm font-semibold">
                          {ticket.id}
                        </p>

                        <h4 className="font-semibold">
                          {ticket.subject}
                        </h4>

                        <p className="text-sm text-gray-500">
                          {ticket.customer} •{" "}
                          {ticket.category}
                        </p>

                      </div>

                      <div className="flex gap-2 items-center">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>

                      </div>

                    </div>
                  ))}

                </div>

              </div>

            </div>
          )}

          {/* ================= USERS ================= */}
          {activeSection === "users" && (
            <div>

              <div className="bg-white rounded-xl border p-4 mb-6">

                <input
                  type="text"
                  placeholder="Search users by name, email or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                />

              </div>

              <div className="bg-white rounded-xl border overflow-hidden">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-255">

                    <thead className="bg-gray-50 border-b">

                      <tr>
                        <th className="text-left px-5 py-4">
                          User
                        </th>

                        <th className="text-left px-5 py-4">
                          Role
                        </th>

                        <th className="text-left px-5 py-4">
                          Status
                        </th>

                        <th className="text-left px-5 py-4">
                          Joined
                        </th>

                        <th className="text-left px-5 py-4">
                          Actions
                        </th>
                      </tr>

                    </thead>

                    <tbody className="divide-y">

                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50"
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold">
                              {user.name}
                            </p>

                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>

                          </td>

                          <td className="px-5 py-4">

                            <select
                              value={user.role}
                              onChange={(e) =>
                                changeUserRole(
                                  user.id,
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2 text-sm"
                              disabled={
                                user.role ===
                                "Administrator"
                              }
                            >
                              <option>Customer</option>
                              <option>Agent</option>
                              <option>
                                Administrator
                              </option>
                            </select>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {user.status}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-sm text-gray-500">
                            {user.joined}
                          </td>

                          <td className="px-5 py-4">

                            {user.role !==
                              "Administrator" && (
                              <button
                                onClick={() =>
                                  toggleUserStatus(user.id)
                                }
                                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                                  user.status === "Active"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-green-50 text-green-600"
                                }`}
                              >
                                {user.status === "Active"
                                  ? "Suspend"
                                  : "Activate"}
                              </button>
                            )}

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>
          )}

          {/* ================= TICKETS ================= */}
          {activeSection === "tickets" && (
            <div>

              <div className="bg-white rounded-xl border p-4 mb-6">

                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                />

              </div>

              <div className="bg-white rounded-xl border overflow-hidden">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-250">

                    <thead className="bg-gray-50 border-b">

                      <tr>
                        <th className="text-left px-5 py-4">
                          Ticket
                        </th>

                        <th className="text-left px-5 py-4">
                          Customer
                        </th>

                        <th className="text-left px-5 py-4">
                          Category
                        </th>

                        <th className="text-left px-5 py-4">
                          Priority
                        </th>

                        <th className="text-left px-5 py-4">
                          Status
                        </th>

                        <th className="text-left px-5 py-4">
                          Assigned Agent
                        </th>
                      </tr>

                    </thead>

                    <tbody className="divide-y">

                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="hover:bg-gray-50"
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-purple-600">
                              {ticket.id}
                            </p>

                            <p className="text-sm">
                              {ticket.subject}
                            </p>

                          </td>

                          <td className="px-5 py-4">
                            {ticket.customer}
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {ticket.category}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                                ticket.status
                              )}`}
                            >
                              {ticket.status}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-sm">
                            {ticket.agent}
                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>
          )}

          {/* ================= CATEGORIES ================= */}
          {activeSection === "categories" && (
            <div>

              <div className="grid lg:grid-cols-3 gap-6">

                {/* Add Category */}
                <div className="bg-white rounded-xl border p-5 h-fit">

                  <h3 className="font-bold text-lg">
                    Add Category
                  </h3>

                  <p className="text-sm text-gray-500 mt-1 mb-5">
                    Create a new support ticket category.
                  </p>

                  <div className="space-y-4">

                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategory}
                      onChange={(e) =>
                        setNewCategory(e.target.value)
                      }
                      className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <textarea
                      placeholder="Category description"
                      rows="4"
                      value={newCategoryDescription}
                      onChange={(e) =>
                        setNewCategoryDescription(
                          e.target.value
                        )
                      }
                      className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <button
                      onClick={addCategory}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                    >
                      + Add Category
                    </button>

                  </div>

                </div>

                {/* Category List */}
                <div className="lg:col-span-2">

                  <div className="bg-white rounded-xl border overflow-hidden">

                    <div className="p-5 border-b">

                      <h3 className="font-bold text-lg">
                        Existing Categories
                      </h3>

                    </div>

                    <div className="divide-y">

                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="p-5 flex flex-col sm:flex-row justify-between gap-4"
                        >

                          <div>

                            <h4 className="font-semibold">
                              {category.name}
                            </h4>

                            <p className="text-sm text-gray-500 mt-1">
                              {category.description}
                            </p>

                            <p className="text-xs text-purple-600 mt-2">
                              {category.tickets} tickets
                            </p>

                          </div>

                          <button
                            onClick={() =>
                              deleteCategory(category.id)
                            }
                            className="text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold h-fit"
                          >
                            Delete
                          </button>

                        </div>
                      ))}

                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Admin;
