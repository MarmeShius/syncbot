import { generateGeminiText } from "./gemini.js";

export const DEFAULT_KB_ARTICLES = [
  {
    id: "kb-1",
    slug: "reset-password-and-account-security",
    title: "How to Reset Your Password and Secure Your Account",
    category: "Account",
    tags: ["password", "login", "auth", "security", "credentials"],
    content: `If you are unable to log in to your SyncBot account:
1. Verify that your username or email address is entered accurately.
2. If you have forgotten your password, reach out to your system administrator or use the password reset prompt.
3. For security reasons, passwords must be at least 6 characters long and contain alphanumeric characters.
4. If your account is inactive or blocked, contact your workspace administrator to reactivate your credentials.
Tip: Never share your account password inside a ticket or message thread.`,
    views: 45,
    helpfulCount: 28,
    createdAt: new Date("2026-08-01").toISOString(),
  },
  {
    id: "kb-2",
    slug: "billing-invoices-and-refunds",
    title: "Billing Inquiries: Invoices, Deductions, and Refunds",
    category: "Billing",
    tags: ["billing", "invoice", "payment", "refund", "charged", "credit card"],
    content: `SyncBot provides automated invoice tracking and billing management:
1. Invoices are generated at the start of each billing cycle and sent directly to your registered account email.
2. If you notice duplicate charges or an unexpected billing deduction, open a Billing ticket with the transaction reference ID, date, and billed amount.
3. Refunds are reviewed by our billing team within 24 hours. Once approved, funds typically take 3-5 business days to reflect on your payment method.
Notice: Never attach full credit card details or CVV codes to tickets. Only transaction references are required.`,
    views: 89,
    helpfulCount: 52,
    createdAt: new Date("2026-08-05").toISOString(),
  },
  {
    id: "kb-3",
    slug: "troubleshooting-sync-and-connection",
    title: "Troubleshooting WebSocket Sync & Connection Issues",
    category: "Technical Issue",
    tags: ["network", "websocket", "sync", "disconnect", "crash", "real-time"],
    content: `SyncBot uses WebSockets (Socket.IO) for real-time ticket streaming and live chat:
1. If real-time ticket updates or message alerts are not appearing, ensure your browser allows WebSockets on port 5000/standard ports.
2. Verify you have not opened multiple outdated browser tabs. Refresh your browser page to re-establish the socket connection.
3. Corporate firewalls or strict ad-blockers can sometimes block WebSocket handshakes. Try temporarily disabling restrictive extensions.
4. If the issue persists, capture your browser console log (F12 -> Console) and attach it to a Technical Issue ticket.`,
    views: 112,
    helpfulCount: 76,
    createdAt: new Date("2026-08-10").toISOString(),
  },
  {
    id: "kb-4",
    slug: "workspace-navigation-and-roles",
    title: "SyncBot Workspace Roles: Customer, Agent, and Admin",
    category: "Product",
    tags: ["role", "agent", "admin", "customer", "workspace", "permissions"],
    content: `SyncBot provides three tailored workspace views depending on user roles:
- Customer Portal: Create tickets, view conversation history, attach files, review SLAs, and rate customer satisfaction (CSAT) upon resolution.
- Agent Workspace: Triage ticket queues, prioritize by SLA deadlines, use AI Copilot for suggested replies, add internal notes, and attach diagnostic files.
- Admin Workspace: Manage system users, toggle automated ticket routing, edit the Knowledge Base, and monitor support analytics & SLA compliance.`,
    views: 64,
    helpfulCount: 39,
    createdAt: new Date("2026-08-15").toISOString(),
  },
  {
    id: "kb-5",
    slug: "sla-policies-and-escalation",
    title: "SyncBot SLA Policies and Response Deadlines",
    category: "General Inquiry",
    tags: ["sla", "deadline", "priority", "critical", "response time", "escalation"],
    content: `SyncBot enforces strict Service Level Agreements (SLAs) based on ticket priority:
- Critical: Initial response within 2 hours; resolution within 6 hours.
- High: Initial response within 4 hours; resolution within 12 hours.
- Medium: Initial response within 8 hours; resolution within 24 hours.
- Low: Initial response within 24 hours; resolution within 48 hours.
Tickets approaching breach deadlines are highlighted in amber ('At Risk'), and breached tickets trigger automated staff alerts.`,
    views: 58,
    helpfulCount: 41,
    createdAt: new Date("2026-08-20").toISOString(),
  },
];

/**
 * Searches articles based on query tokens and tags.
 */
export function searchArticles(articles, query) {
  if (!query || !query.trim()) return articles;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return articles
    .map((article) => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();
      const tags = (article.tags || []).map((t) => t.toLowerCase());

      for (const term of terms) {
        if (titleLower.includes(term)) score += 5;
        if (tags.some((tag) => tag.includes(term))) score += 4;
        if (contentLower.includes(term)) score += 2;
        if (article.category.toLowerCase().includes(term)) score += 3;
      }

      return { article, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.article);
}

/**
 * RAG Grounding: synthesizes an answer given a query and matching KB articles.
 */
export async function generateRAGAnswer(query, articles) {
  const matches = searchArticles(articles, query).slice(0, 3);

  if (!matches.length) {
    return {
      answer: "I couldn't find a direct match in our Knowledge Base. Please feel free to open a support ticket, and our team will be glad to assist you.",
      sources: [],
    };
  }

  const context = matches
    .map(
      (m, idx) =>
        `[Source ${idx + 1}]: "${m.title}" (${m.category})\n${m.content}`
    )
    .join("\n\n");

  if (process.env.GEMINI_API_KEY) {
    try {
      const answer = await generateGeminiText({
        systemPrompt: "You are SyncBot Knowledge Copilot. Answer strictly using the provided Knowledge Base articles. Include citations to source article titles. Keep the answer concise, accurate, and practical.",
        userPrompt: `Knowledge Base Context:\n${context}\n\nUser Question:\n${query}`,
        temperature: 0.2,
      });
      if (answer) {
        return {
          answer,
          sources: matches.map((m) => ({ id: m.id, title: m.title, category: m.category })),
          mode: "gemini-rag",
        };
      }
    } catch (err) {
      console.error("Gemini RAG search failed:", err.message);
    }
  }

  // Local rule-based RAG synthesis fallback
  const top = matches[0];
  const firstSnippet = top.content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, 3)
    .join(" ");

  const answer = `Based on our knowledge article "${top.title}": ${firstSnippet} You can read more in our Knowledge Base under the ${top.category} section.`;

  return {
    answer,
    sources: matches.map((m) => ({ id: m.id, title: m.title, category: m.category })),
    mode: "local-rag",
  };
}

/**
 * Suggests an AI title based on description and category.
 */
export async function suggestTicketTitle(description, category = "General Inquiry") {
  if (!description || !description.trim()) {
    return { title: `${category} Request` };
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const title = await generateGeminiText({
        systemPrompt: "You are an AI support ticket triager. Write a concise, clear, professional ticket title (4 to 8 words maximum) summarizing the customer issue. Return only the title as plain text without quotes.",
        userPrompt: `Category: ${category}\nDescription:\n${description}`,
        temperature: 0.3,
      });
      if (title) {
        return { title: title.replace(/^["']|["']$/g, ""), mode: "gemini" };
      }
    } catch (err) {
      console.error("AI title generation failed:", err.message);
    }
  }

  // Local fallback heuristic
  const clean = description.trim().replace(/\n+/g, " ");
  const firstSentence = clean.split(/[.?!]/)[0].trim();
  const words = firstSentence.split(/\s+/).slice(0, 7).join(" ");
  const title = words ? `${words.charAt(0).toUpperCase() + words.slice(1)}...` : `${category} Support Request`;

  return { title, mode: "local-fallback" };
}
