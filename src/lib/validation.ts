/**
 * Zod validation schemas for all API request bodies.
 * Shared between route handlers and client-side form validation.
 */
import { z } from "zod";

export const COMPLAINT_CATEGORIES = [
  "pothole",
  "waste_accumulation",
  "damaged_streetlight",
  "blocked_drain",
  "water_leakage",
] as const;

export const COMPLAINT_STATUSES = [
  "pending",
  "in_progress",
  "resolved",
  "overdue",
  "duplicate",
] as const;

// ─── Complaint submission ─────────────────────────────────────────────────────

export const SubmitComplaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  category: z
    .enum(COMPLAINT_CATEGORIES)
    .optional(), // AI will classify if omitted
  location_text: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  landmark_clues: z.string().max(500).optional(),
  image_urls: z.array(z.string().url()).max(5).default([]),
  citizen_id: z.string().uuid().optional(),
});

export type SubmitComplaintInput = z.infer<typeof SubmitComplaintSchema>;

// ─── Complaint status update ──────────────────────────────────────────────────

export const UpdateStatusSchema = z.object({
  status: z.enum(COMPLAINT_STATUSES),
  notes: z.string().max(1000).optional(),
});

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

// ─── Admin complaint list query ───────────────────────────────────────────────

export const ListComplaintsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(COMPLAINT_STATUSES).optional(),
  category: z.enum(COMPLAINT_CATEGORIES).optional(),
  assigned_to: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  sort_by: z
    .enum(["created_at", "priority_score", "updated_at"])
    .default("created_at"),
  sort_dir: z.enum(["asc", "desc"]).default("desc"),
});

export type ListComplaintsQuery = z.infer<typeof ListComplaintsQuerySchema>;

// ─── Duplicate review ─────────────────────────────────────────────────────────

export const ReviewDuplicateSchema = z.object({
  action: z.enum(["confirm", "reject"]),
  master_issue_id: z.string().uuid().optional(), // required when action === 'confirm'
});

export type ReviewDuplicateInput = z.infer<typeof ReviewDuplicateSchema>;

// ─── Image upload ─────────────────────────────────────────────────────────────

export const ImageUploadQuerySchema = z.object({
  complaint_id: z.string().uuid().optional(),
  file_name: z.string().min(1).max(255),
  content_type: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});

export type ImageUploadQuery = z.infer<typeof ImageUploadQuerySchema>;
