import React from "react";
import type { PriorityBreakdown } from "@/types";
import { ShieldAlert, Flame, AlertCircle, Info } from "lucide-react";

interface PriorityBadgeProps {
  score: number | null | undefined;
  breakdown?: PriorityBreakdown | null;
  showBreakdown?: boolean;
  size?: "sm" | "md" | "lg";
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  score,
  breakdown,
  showBreakdown = false,
  size = "md",
}) => {
  const numericScore = score ?? 0;

  let tier = "Low";
  let tierColor = "bg-slate-100 text-slate-700 border-slate-200";
  let barColor = "bg-slate-500";
  let Icon = Info;

  if (numericScore >= 75) {
    tier = "Critical";
    tierColor = "bg-rose-50 text-rose-700 border-rose-200";
    barColor = "bg-rose-500";
    Icon = Flame;
  } else if (numericScore >= 50) {
    tier = "High";
    tierColor = "bg-amber-50 text-amber-700 border-amber-200";
    barColor = "bg-amber-500";
    Icon = ShieldAlert;
  } else if (numericScore >= 25) {
    tier = "Medium";
    tierColor = "bg-sky-50 text-sky-700 border-sky-200";
    barColor = "bg-sky-500";
    Icon = AlertCircle;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-sm font-bold gap-2",
  }[size];

  return (
    <div className="inline-flex flex-col gap-1.5">
      <div
        className={`inline-flex items-center rounded-lg border font-mono ${tierColor} ${sizeClasses}`}
        title={`Priority Score: ${numericScore}/100 (${tier} Priority)`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-sans font-medium">{tier}</span>
        <span className="font-bold">
          {numericScore}
          <span className="text-[10px] opacity-60">/100</span>
        </span>
      </div>

      {showBreakdown && breakdown && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs space-y-2 max-w-xs">
          <div className="flex items-center justify-between font-semibold text-slate-900 border-b border-slate-100 pb-1.5">
            <span>Score Factors</span>
            <span className="font-mono text-blue-600">{breakdown.total}/100</span>
          </div>

          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>Safety / Severity (30%)</span>
                <span className="font-mono font-semibold">{breakdown.safety_severity}/30</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{ width: `${(breakdown.safety_severity / 30) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>People Affected (25%)</span>
                <span className="font-mono font-semibold">{breakdown.people_affected}/25</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(breakdown.people_affected / 25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>Recurrence History (20%)</span>
                <span className="font-mono font-semibold">{breakdown.recurrence}/20</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(breakdown.recurrence / 20) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>SLA Deadline Pressure (15%)</span>
                <span className="font-mono font-semibold">{breakdown.sla_pressure}/15</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(breakdown.sla_pressure / 15) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>Evidence Confidence (10%)</span>
                <span className="font-mono font-semibold">{breakdown.evidence_confidence}/10</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(breakdown.evidence_confidence / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
