import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const faqs = [
  {
    id: 1,
    question: "How do I create a support ticket?",
    answer: "Choose Create New Ticket, describe the issue, add a subject and contact details, then select a category and priority. Submit the form to send it to the support team.",
  },
  {
    id: 2,
    question: "What should I include in my issue description?",
    answer: "Explain what you were doing, what happened, any error message you saw, and the steps that reproduce the problem. Please do not include passwords or full payment card details.",
  },
  {
    id: 3,
    question: "How can I check the status of my ticket?",
    answer: "Open the Customer Portal and select a ticket from My Support Tickets. Its current status, replies, assigned agent, and SLA indicator appear in the ticket details.",
  },
  {
    id: 4,
    question: "What do the ticket statuses mean?",
    answer: "Open means the team has received the ticket. In Progress means an agent is working on it. Waiting for Customer means the team needs more information. Resolved means a solution was provided. Closed means the conversation is complete.",
  },
  {
    id: 5,
    question: "What is ticket priority?",
    answer: "Priority tells the support team how urgent an issue is. SyncBot offers Critical, High, Medium, and Low. Choose based on how severely the issue affects your work.",
  },
  {
    id: 6,
    question: "What does SLA mean?",
    answer: "SLA means Service Level Agreement. It is the target time for the support team’s first response and for resolving a ticket. SyncBot displays a badge when a deadline is approaching, met, or breached.",
  },
  {
    id: 7,
    question: "What are the response and resolution targets?",
    answer: "The configured targets are: Critical—2 hours to respond and 6 hours to resolve; High—4 and 12 hours; Medium—8 and 24 hours; Low—24 and 48 hours. These are service targets, not a guarantee that every issue can be resolved within that time.",
  },
  {
    id: 8,
    question: "How do I reply to the support agent?",
    answer: "Open your ticket, type your message in the reply box, and choose Send Reply. Your reply is added to the ticket conversation for the support team to see.",
  },
  {
    id: 9,
    question: "Can I attach a file to my ticket?",
    answer: "Yes. Use the attachment control while creating a ticket or sending a reply. Attach screenshots or documents that help explain the issue, and avoid including passwords or other sensitive information.",
  },
  {
    id: 10,
    question: "How will I know which agent is handling my ticket?",
    answer: "The assigned agent is shown in your ticket details when one has been assigned. SyncBot can automatically route tickets to an available agent when automatic assignment is enabled.",
  },
  {
    id: 11,
    question: "Can I update my ticket after I submit it?",
    answer: "You can add information by replying in the ticket conversation. If something important changes, send a new reply so the agent can take it into account.",
  },
  {
    id: 12,
    question: "What is the AI title suggestion?",
    answer: "When available, Suggest Title with AI uses your description to propose a short subject for the ticket. Review it and edit it before submitting if needed.",
  },
  {
    id: 13,
    question: "What can the support assistant help me with?",
    answer: "The assistant can provide general guidance about using SyncBot and common support topics. For help that requires access to your account or ticket, create a ticket so the support team can investigate.",
  },
  {
    id: 14,
    question: "When can I rate the support I received?",
    answer: "After a ticket is Resolved or Closed, you can submit a one-to-five-star satisfaction rating and optional feedback from the ticket details.",
  },
  {
    id: 15,
    question: "How do I keep my account secure?",
    answer: "Use a unique password, never share it in a ticket or message, and do not send passwords or verification codes to anyone. If you think your account is at risk, contact your workspace administrator.",
  },
];

export default function FaqList() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <aside className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/20">
      <div className="flex items-center gap-2 border-b border-sky-200 pb-4 dark:border-sky-900/50">
        <HelpCircle className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Browse common questions and answers.
          </p>
        </div>
      </div>

      <div className="mt-3 max-h-152 divide-y divide-sky-100 overflow-y-auto pr-1 dark:divide-slate-800">
        {faqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <div key={faq.id} className="py-3 first:pt-1">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                className="flex w-full items-start justify-between gap-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                <span>{faq.question}</span>
                {isExpanded ? (
                  <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
              </button>
              {isExpanded && (
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
