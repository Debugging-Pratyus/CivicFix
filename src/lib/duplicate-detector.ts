/**
 * Duplicate detection engine.
 *
 * Uses TypeScript-based text similarity (no external ML needed) to detect
 * potentially duplicate complaints before saving.
 *
 * Similarity is computed from:
 *   1. Jaccard similarity of description word tokens (40%)
 *   2. Category match (30%)
 *   3. Location / landmark overlap (30%)
 *
 * We create DuplicateSuggestion records rather than auto-merging.
 * Admins confirm or reject them. Every citizen complaint keeps its own ID.
 */

import type { Complaint, ComplaintCategory } from "@/types";

export interface SimilarityResult {
  complaint_id: string;
  tracking_id: string;
  similarity_score: number; // 0.0–1.0
  similarity_reasons: string[];
}

/** Tokenise text into a normalised word set */
function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2) // drop very short tokens
  );
}

/** Jaccard similarity between two word sets */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = new Set([...a].filter((w) => b.has(w)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

/** Location overlap: checks if any location tokens appear in both complaints */
function locationOverlap(
  locA: string | null,
  landmarkA: string | null,
  locB: string | null,
  landmarkB: string | null
): number {
  const aText = [(locA ?? ""), (landmarkA ?? "")].join(" ");
  const bText = [(locB ?? ""), (landmarkB ?? "")].join(" ");
  if (!aText.trim() || !bText.trim()) return 0;
  return jaccardSimilarity(tokenise(aText), tokenise(bText));
}

export function computeSimilarity(
  incoming: {
    title: string;
    description: string;
    category: ComplaintCategory;
    location_text: string | null;
    landmark_clues: string | null;
  },
  existing: Complaint
): SimilarityResult {
  const reasons: string[] = [];

  // ── 1. Description similarity (40%) ──────────────────────────────────────
  const incomingTokens = tokenise(incoming.title + " " + incoming.description);
  const existingTokens = tokenise(existing.title + " " + existing.description);
  const descSim = jaccardSimilarity(incomingTokens, existingTokens);
  const descScore = descSim * 0.4;

  if (descSim > 0.3) {
    reasons.push(`Similar description (${Math.round(descSim * 100)}% word overlap)`);
  }

  // ── 2. Category match (30%) ───────────────────────────────────────────────
  const categoryScore = incoming.category === existing.category ? 0.3 : 0;
  if (incoming.category === existing.category) {
    reasons.push(`Same category: ${incoming.category}`);
  }

  // ── 3. Location overlap (30%) ────────────────────────────────────────────
  const locSim = locationOverlap(
    incoming.location_text,
    incoming.landmark_clues,
    existing.location_text,
    existing.landmark_clues
  );
  const locScore = locSim * 0.3;
  if (locSim > 0.2) {
    reasons.push(`Similar location (${Math.round(locSim * 100)}% overlap)`);
  }

  const total = Math.min(1, descScore + categoryScore + locScore);

  return {
    complaint_id: existing.id,
    tracking_id: existing.tracking_id,
    similarity_score: Math.round(total * 1000) / 1000,
    similarity_reasons: reasons,
  };
}

/** Threshold above which we create a duplicate suggestion */
export const DUPLICATE_THRESHOLD = 0.5;

/** Filter and rank candidates, returning those above threshold */
export function findDuplicateCandidates(
  incoming: Parameters<typeof computeSimilarity>[0],
  existingComplaints: Complaint[]
): SimilarityResult[] {
  return existingComplaints
    .map((c) => computeSimilarity(incoming, c))
    .filter((r) => r.similarity_score >= DUPLICATE_THRESHOLD)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5); // top 5 candidates max
}
