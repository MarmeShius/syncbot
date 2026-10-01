import { useState } from "react";
import { Star, CheckCircle2, MessageSquareHeart } from "lucide-react";
import { apiRequest } from "../api";

export default function CsatModal({ ticket, onRated }) {
  const [rating, setRating] = useState(ticket?.csat?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState(ticket?.csat?.feedback || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(Boolean(ticket?.csat?.rating));

  if (!ticket || !["Resolved", "Closed"].includes(ticket.status)) {
    return null;
  }

  const ratingLabels = {
    1: "Very Dissatisfied 😞",
    2: "Dissatisfied 🙁",
    3: "Neutral 😐",
    4: "Satisfied 😊",
    5: "Extremely Satisfied! 🌟",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const data = await apiRequest(`/tickets/${ticket.id}/csat`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback }),
      });

      setSubmitted(true);
      if (onRated) onRated(data.ticket);
    } catch (err) {
      setError(err.message || "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-semibold">Thank you for your feedback!</p>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= (ticket?.csat?.rating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            />
          ))}
          <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            {ratingLabels[ticket?.csat?.rating || rating]}
          </span>
        </div>
        {(ticket?.csat?.feedback || feedback) && (
          <p className="mt-2 text-xs italic text-slate-600 dark:text-slate-400">
            "{ticket?.csat?.feedback || feedback}"
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-center gap-2">
        <MessageSquareHeart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <h4 className="font-semibold text-slate-900 dark:text-white">
          How satisfied were you with this resolution?
        </h4>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Your rating helps us reward great agents and continuously improve our service.
      </p>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const activeStar = hoverRating || rating;
              const isFilled = star <= activeStar;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star`}
                  className="rounded p-1 transition-transform hover:scale-115 focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      isFilled
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {ratingLabels[hoverRating || rating]}
          </span>
        </div>

        <textarea
          rows="2"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional: What went well or what can we improve?"
          className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit CSAT Rating"}
          </button>
        </div>
      </form>
    </div>
  );
}

