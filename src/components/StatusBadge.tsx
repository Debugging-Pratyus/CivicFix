import React from "react";
import type { ComplaintStatus } from "@/types";
import { STATUS_META } from "@/lib/constants";
import { CheckCircle2, Clock, AlertTriangle, PlayCircle, GitFork } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function getStatusIcon(status: string, className = "w-3.5 h-3.5") {
  switch (status) {
    case "resolved":
      return <CheckCircle2 className={`${className} text-emerald-600`} />;
    case "in_progress":
      return <PlayCircle className={`${className} text-blue-600`} />;
    case "overdue":
      return <AlertTriangle className={`${className} text-rose-600`} />;
    case "duplicate":
      return <GitFork className={`${className} text-purple-600`} />;
    case "pending":
    default:
      return <Clock className={`${className} text-slate-500`} />;
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const meta = STATUS_META[status as ComplaintStatus];
  const label = meta ? meta.label : status.replace(/_/g, " ");

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-semibold gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs ${
        meta?.badgeClass || "bg-slate-100 text-slate-700 border-slate-300"
      } ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta?.dotClass || "bg-slate-400"}`} />
      {showIcon && getStatusIcon(status)}
      <span className="capitalize">{label}</span>
    </span>
  );
};
