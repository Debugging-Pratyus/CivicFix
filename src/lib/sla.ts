/**
 * SLA deadline configuration per category and priority tier.
 *
 * Priority tiers:
 *   critical  → score 75–100
 *   high      → score 50–74
 *   medium    → score 25–49
 *   low       → score 0–24
 *
 * Deadlines are in hours.
 */

import type { ComplaintCategory } from "@/types";

type PriorityTier = "critical" | "high" | "medium" | "low";

/** SLA table: category → priority tier → hours until deadline */
const SLA_TABLE: Record<ComplaintCategory, Record<PriorityTier, number>> = {
  pothole: {
    critical: 24,
    high: 48,
    medium: 96,
    low: 168,
  },
  waste_accumulation: {
    critical: 12,
    high: 24,
    medium: 72,
    low: 120,
  },
  damaged_streetlight: {
    critical: 24,
    high: 48,
    medium: 120,
    low: 240,
  },
  blocked_drain: {
    critical: 8,
    high: 24,
    medium: 72,
    low: 120,
  },
  water_leakage: {
    critical: 6,
    high: 12,
    medium: 48,
    low: 96,
  },
};

export function getPriorityTier(score: number): PriorityTier {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function getSlaDeadlineHours(
  category: ComplaintCategory,
  priorityScore: number
): number {
  const tier = getPriorityTier(priorityScore);
  return SLA_TABLE[category][tier];
}

export function computeDeadlineAt(
  createdAt: Date,
  deadlineHours: number
): Date {
  return new Date(createdAt.getTime() + deadlineHours * 60 * 60 * 1000);
}
