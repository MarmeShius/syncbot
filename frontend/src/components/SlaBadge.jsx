import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

export default function SlaBadge({ sla, status, compact = false }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!sla) return null;

  const isResolved = ["Resolved", "Closed"].includes(status);
  const responseDue = new Date(sla.responseDue).getTime();
  const resolutionDue = new Date(sla.resolutionDue).getTime();

  // Evaluate response
  const responseBreached = sla.firstResponseAt
    ? new Date(sla.firstResponseAt).getTime() > responseDue
    : now > responseDue;

  // Evaluate resolution
  const resolutionBreached = sla.resolvedAt
    ? new Date(sla.resolvedAt).getTime() > resolutionDue
    : isResolved
    ? false
    : now > resolutionDue;

  const isBreached = responseBreached || resolutionBreached;

  const remainingTarget = !sla.firstResponseAt ? responseDue - now : resolutionDue - now;
  const isAtRisk = !isResolved && !isBreached && remainingTarget > 0 && remainingTarget < 60 * 60 * 1000;

  const formatRemaining = (ms) => {
    if (ms <= 0) return "0m";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (isBreached) {
    return (
      <span
        title={responseBreached ? "Response SLA Breached" : "Resolution SLA Breached"}
        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
      >
        <ShieldAlert className="h-3 w-3" />
        <span>SLA Breached</span>
      </span>
    );
  }

  if (isResolved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        <span>SLA Met</span>
      </span>
    );
  }

  if (isAtRisk) {
    return (
      <span
        title="Less than 1 hour before SLA deadline"
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>SLA: {formatRemaining(remainingTarget)} left</span>
      </span>
    );
  }

  return (
    <span
      title={`Response target: ${formatRemaining(responseDue - now)}`}
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      <Clock className="h-3 w-3 text-slate-500" />
      <span>
        {compact ? formatRemaining(remainingTarget) : `SLA: ${formatRemaining(remainingTarget)}`}
      </span>
    </span>
  );
}

