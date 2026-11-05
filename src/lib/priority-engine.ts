/**
 * Transparent, configurable priority scoring engine.
 *
 * Score breakdown (total 100 points):
 *   Safety / Severity       → 30 pts
 *   People Affected         → 25 pts
 *   Recurrence              → 20 pts
 *   SLA Pressure            → 15 pts
 *   Evidence Confidence     → 10 pts
 *
 * All weights are explicit and stored factor-by-factor so the AI
 * never makes opaque priority decisions.
 */

import type { PriorityBreakdown } from "@/types";

export interface PriorityInput {
  /** 1–5: 1 = cosmetic nuisance, 5 = life-threatening hazard */
  severity: number;
  /** Estimated number of people affected */
  people_affected: number;
  /** Number of previous complaints at the same location / category */
  recurrence_count: number;
  /** Hours since complaint was submitted (affects SLA pressure) */
  hours_elapsed: number;
  /** SLA deadline in hours for this category+priority */
  sla_deadline_hours: number;
  /** 0.0–1.0: how confident the AI is in its classification */
  evidence_confidence: number;
}

const WEIGHTS = {
  safety_severity: 30,
  people_affected: 25,
  recurrence: 20,
  sla_pressure: 15,
  evidence_confidence: 10,
} as const;

/** Clamp a value between 0 and max. */
function clamp(value: number, max: number): number {
  return Math.min(Math.max(0, value), max);
}

export function calculatePriorityScore(input: PriorityInput): PriorityBreakdown {
  // ── Safety / Severity (0–30) ─────────────────────────────────────────────
  // severity is 1–5; normalise to 0–1 then scale
  const safety_severity = clamp(
    ((input.severity - 1) / 4) * WEIGHTS.safety_severity,
    WEIGHTS.safety_severity
  );

  // ── People Affected (0–25) ───────────────────────────────────────────────
  // Logarithmic scale: 1 person → ~0, 10 → ~19, 100 → ~25
  const people_ratio = input.people_affected > 0
    ? Math.log10(input.people_affected + 1) / Math.log10(101)
    : 0;
  const people_affected = clamp(
    people_ratio * WEIGHTS.people_affected,
    WEIGHTS.people_affected
  );

  // ── Recurrence (0–20) ────────────────────────────────────────────────────
  // 0 prior = 0 pts, 5+ prior = full 20 pts
  const recurrence = clamp(
    (Math.min(input.recurrence_count, 5) / 5) * WEIGHTS.recurrence,
    WEIGHTS.recurrence
  );

  // ── SLA Pressure (0–15) ──────────────────────────────────────────────────
  // Increases as we approach or pass the deadline
  const sla_ratio = input.sla_deadline_hours > 0
    ? input.hours_elapsed / input.sla_deadline_hours
    : 1;
  const sla_pressure = clamp(
    sla_ratio * WEIGHTS.sla_pressure,
    WEIGHTS.sla_pressure
  );

  // ── Evidence Confidence (0–10) ───────────────────────────────────────────
  const evidence_confidence = clamp(
    input.evidence_confidence * WEIGHTS.evidence_confidence,
    WEIGHTS.evidence_confidence
  );

  const total = Math.round(
    safety_severity + people_affected + recurrence + sla_pressure + evidence_confidence
  );

  return {
    safety_severity: Math.round(safety_severity * 10) / 10,
    people_affected: Math.round(people_affected * 10) / 10,
    recurrence: Math.round(recurrence * 10) / 10,
    sla_pressure: Math.round(sla_pressure * 10) / 10,
    evidence_confidence: Math.round(evidence_confidence * 10) / 10,
    total: clamp(total, 100),
  };
}
