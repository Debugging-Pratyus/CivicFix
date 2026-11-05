/**
 * AI classification service using Google Gemini.
 *
 * Classifies incoming complaint text (and optionally images) into one of the
 * five supported CivicFix categories, extracts location clues, identifies
 * missing information and returns a structured JSON result.
 *
 * This module is server-side ONLY — it references serverEnv.GEMINI_API_KEY.
 */

import { GoogleGenAI } from "@google/genai";
import { serverEnv } from "@/lib/env";
import type { ComplaintCategory } from "@/types";

export interface AiClassificationResult {
  category: ComplaintCategory;
  confidence: number; // 0.0–1.0
  extracted_description: string;
  location_clues: string[];
  missing_info: string[];
  severity_estimate: number; // 1–5
  people_affected_estimate: number;
  reasoning: string;
  raw_response: Record<string, unknown>;
}

const CATEGORIES: ComplaintCategory[] = [
  "pothole",
  "waste_accumulation",
  "damaged_streetlight",
  "blocked_drain",
  "water_leakage",
];

const SYSTEM_PROMPT = `You are CivicFix, an AI assistant that analyses municipal complaints.

Your task is to:
1. Classify the complaint into exactly one category from: ${CATEGORIES.join(", ")}
2. Extract the core issue description (concise, 1–3 sentences)
3. Identify any location clues mentioned (street names, landmarks, intersections)
4. List any important information that is MISSING (e.g. exact location, severity details)
5. Estimate severity on a scale of 1 (cosmetic nuisance) to 5 (life-threatening hazard)
6. Estimate how many people are likely affected (use 1 if unknown)
7. Provide your reasoning in 1–2 sentences

IMPORTANT RULES:
- Never reject an incomplete complaint. Always pick the best-fit category.
- If you are unsure, still classify but set confidence < 0.5 and list what is missing.
- If the complaint could fit multiple categories, pick the PRIMARY one.
- Return ONLY valid JSON matching the schema below — no markdown, no explanation outside JSON.

JSON schema:
{
  "category": "<one of the five categories>",
  "confidence": <number 0.0 to 1.0>,
  "extracted_description": "<string>",
  "location_clues": ["<string>", ...],
  "missing_info": ["<string>", ...],
  "severity_estimate": <integer 1–5>,
  "people_affected_estimate": <integer >= 1>,
  "reasoning": "<string>"
}`;

let _aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!_aiClient) {
    _aiClient = new GoogleGenAI({ apiKey: serverEnv.GEMINI_API_KEY });
  }
  return _aiClient;
}

export async function classifyComplaint(
  title: string,
  description: string,
  imageUrls: string[] = []
): Promise<AiClassificationResult> {
  const ai = getAiClient();

  const userPrompt = `Complaint Title: ${title}\n\nComplaint Description:\n${description}`;

  // Build parts array — text first, then any inline images if provided
  // Note: for now we pass the prompt text; image analysis can be added when
  // base64 or Supabase-signed URLs are available to the model.
  const contents = [{ text: userPrompt }];

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [{ role: "user", parts: contents }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.1, // low temperature for consistent classification
      maxOutputTokens: 1024,
    },
  });

  const rawText = response.text ?? "";

  // Strip any accidental markdown fences
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    // If the model returns malformed JSON, fall back to a safe default
    // so the complaint is still saved rather than silently rejected.
    parsed = {
      category: guessCategoryFromText(title + " " + description),
      confidence: 0.2,
      extracted_description: description.slice(0, 300),
      location_clues: [],
      missing_info: ["AI parsing failed — manual review required"],
      severity_estimate: 2,
      people_affected_estimate: 1,
      reasoning: "Fallback classification due to AI response parse error.",
    };
  }

  const category = CATEGORIES.includes(parsed.category as ComplaintCategory)
    ? (parsed.category as ComplaintCategory)
    : guessCategoryFromText(title + " " + description);

  return {
    category,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    extracted_description:
      typeof parsed.extracted_description === "string"
        ? parsed.extracted_description
        : description.slice(0, 300),
    location_clues: Array.isArray(parsed.location_clues)
      ? (parsed.location_clues as string[])
      : [],
    missing_info: Array.isArray(parsed.missing_info)
      ? (parsed.missing_info as string[])
      : [],
    severity_estimate:
      typeof parsed.severity_estimate === "number"
        ? Math.min(5, Math.max(1, Math.round(parsed.severity_estimate)))
        : 2,
    people_affected_estimate:
      typeof parsed.people_affected_estimate === "number"
        ? Math.max(1, Math.round(parsed.people_affected_estimate))
        : 1,
    reasoning:
      typeof parsed.reasoning === "string" ? parsed.reasoning : "",
    raw_response: { text: rawText, parsed },
  };
}

/** Simple keyword-based fallback category guesser */
function guessCategoryFromText(text: string): ComplaintCategory {
  const lower = text.toLowerCase();
  if (lower.includes("pothole") || lower.includes("road") || lower.includes("crater"))
    return "pothole";
  if (lower.includes("waste") || lower.includes("garbage") || lower.includes("trash") || lower.includes("rubbish"))
    return "waste_accumulation";
  if (lower.includes("light") || lower.includes("lamp") || lower.includes("street light"))
    return "damaged_streetlight";
  if (lower.includes("drain") || lower.includes("flood") || lower.includes("blocked"))
    return "blocked_drain";
  if (lower.includes("water") || lower.includes("pipe") || lower.includes("leak"))
    return "water_leakage";
  return "pothole"; // safe default
}
