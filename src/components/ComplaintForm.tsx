"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ComplaintCategory, ComplaintSubmissionResult } from "@/types";
import { CATEGORIES_META } from "@/lib/constants";
import { getCategoryIcon } from "@/components/CategoryBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Camera,
  RotateCcw,
  ShieldAlert,
  Loader2,
  Navigation,
} from "lucide-react";

interface ComplaintFormProps {
  initialCategory?: ComplaintCategory;
  onSuccess?: (result: ComplaintSubmissionResult) => void;
  className?: string;
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({
  initialCategory,
  onSuccess,
  className = "",
}) => {
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory | "">(initialCategory ?? "");
  const [locationText, setLocationText] = useState("");
  const [landmarkClues, setLandmarkClues] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<ComplaintSubmissionResult | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);

  // Quick sample images for quick testing
  const sampleImages = [
    { label: "Pothole sample", url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop" },
    { label: "Waste dump sample", url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop" },
    { label: "Broken streetlight sample", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop" },
  ];

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        if (!locationText) {
          setLocationText(`GPS: ${lat}, ${lng} (Coordinates detected)`);
        }
        setGeoLocating(false);
      },
      (err) => {
        console.warn("Geolocation warning:", err.message);
        setGeoLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 5) {
      errors.title = "Title must be at least 5 characters.";
    } else if (title.trim().length > 200) {
      errors.title = "Title cannot exceed 200 characters.";
    }

    if (!description.trim() || description.trim().length < 10) {
      errors.description = "Please describe the problem in at least 10 characters.";
    }

    if (!locationText.trim()) {
      errors.locationText = "Please provide an address, intersection, or area name.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setLoadingStep(1);

    // Visual feedback steps
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 900);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        location_text: locationText.trim(),
        landmark_clues: landmarkClues.trim() || undefined,
        image_urls: imageUrl.trim() ? [imageUrl.trim()] : [],
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      };

      if (category) {
        payload.category = category;
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      clearInterval(stepInterval);

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to submit complaint. Please check your inputs.");
      }

      setSubmissionResult(json.data);
      if (onSuccess) {
        onSuccess(json.data);
      }
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTrackingId(true);
    setTimeout(() => setCopiedTrackingId(false), 2500);
  };

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setCategory(initialCategory ?? "");
    setLocationText("");
    setLandmarkClues("");
    setImageUrl("");
    setLatitude(null);
    setLongitude(null);
    setSubmissionResult(null);
    setFormError(null);
    setValidationErrors({});
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (submissionResult) {
    return (
      <div className={`rounded-3xl border border-emerald-200 bg-white p-6 sm:p-10 shadow-xl ${className}`}>
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <span className="mt-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Complaint Registered Successfully
          </span>

          <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your civic issue is in the queue
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Keep this tracking ID safe to monitor municipal inspection, field crew assignment, and SLA resolution milestones.
          </p>

          {/* Tracking ID Hero Box */}
          <div className="mt-6 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/70 p-5 sm:p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              Official CivicFix Tracking ID
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-blue-900 tracking-wider">
                {submissionResult.tracking_id}
              </span>
              <button
                type="button"
                onClick={() => handleCopyTrackingId(submissionResult.tracking_id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                title="Copy Tracking ID"
              >
                {copiedTrackingId ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Triage Details Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                AI Category Classified
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl">
                  {getCategoryIcon(submissionResult.category, "w-5 h-5 text-blue-600")}
                </span>
                <span className="font-semibold text-slate-800 capitalize">
                  {CATEGORIES_META[submissionResult.category]?.label || submissionResult.category.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Computed Priority Score
              </span>
              <div className="mt-1">
                <PriorityBadge score={submissionResult.priority_score} size="md" />
              </div>
            </div>
          </div>

          {/* Clarification Alert if flagged */}
          {submissionResult.requires_clarification && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold mb-1 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Clarification Clues Flagged by AI</span>
              </div>
              <p className="text-amber-700">
                The report was saved, but our AI noted missing details:{" "}
                <span className="font-medium">
                  {submissionResult.missing_info_flags?.join(", ") || "Additional location details recommended"}
                </span>
                . Our triage team will review this shortly.
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/track?id=${submissionResult.tracking_id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-95"
            >
              <span>Track Resolution Progress</span>
              <ExternalLink className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4 text-slate-400" />
              <span>Submit Another Issue</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────────────
  return (
    <div className={`rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xl ${className}`}>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Powered by Gemini AI & SLA Engine</span>
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Report a Municipal Problem
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Provide issue details and location clues. AI will classify category, identify duplicates, and calculate priority.
        </p>
      </div>

      {formError && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to submit report</p>
            <p className="mt-0.5 text-xs text-rose-700">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="complaint-title" className="block text-sm font-semibold text-slate-800">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {title.length}/200
            </span>
          </div>
          <input
            id="complaint-title"
            type="text"
            required
            placeholder="e.g. Deep pothole causing skidding near Metro Station exit"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationErrors.title) {
                setValidationErrors((prev) => ({ ...prev, title: "" }));
              }
            }}
            className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-hidden focus:ring-2 ${
              validationErrors.title
                ? "border-rose-400 focus:ring-rose-200"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {validationErrors.title && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{validationErrors.title}</p>
          )}
        </div>

        {/* Category Pill Picker */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Category <span className="text-xs font-normal text-slate-500">(Optional — AI will classify if omitted)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                category === ""
                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Auto-Detect ✨</span>
            </button>

            {(Object.keys(CATEGORIES_META) as ComplaintCategory[]).map((catKey) => {
              const meta = CATEGORIES_META[catKey];
              const isSelected = category === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategory(catKey)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100 shadow-xs font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="shrink-0">{getCategoryIcon(catKey, "w-4 h-4 text-slate-600")}</span>
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="complaint-desc" className="block text-sm font-semibold text-slate-800">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {description.length} chars
            </span>
          </div>
          <textarea
            id="complaint-desc"
            required
            rows={4}
            placeholder="Describe what happened, how severe the hazard is, how many commuters or residents are impacted, and any noticeable safety risks..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (validationErrors.description) {
                setValidationErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-hidden focus:ring-2 ${
              validationErrors.description
                ? "border-rose-400 focus:ring-rose-200"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {validationErrors.description && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{validationErrors.description}</p>
          )}
        </div>

        {/* Location & Landmark Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="complaint-loc" className="block text-sm font-semibold text-slate-800">
                Location / Address <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={geoLocating}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                title="Detect GPS coordinates"
              >
                {geoLocating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                <span>{geoLocating ? "Detecting..." : "GPS Pin"}</span>
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="complaint-loc"
                type="text"
                required
                placeholder="Street address, junction, sector, or ward"
                value={locationText}
                onChange={(e) => {
                  setLocationText(e.target.value);
                  if (validationErrors.locationText) {
                    setValidationErrors((prev) => ({ ...prev, locationText: "" }));
                  }
                }}
                className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-hidden focus:ring-2 ${
                  validationErrors.locationText
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
            </div>
            {validationErrors.locationText && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{validationErrors.locationText}</p>
            )}
            {latitude && longitude && (
              <p className="mt-1 text-[11px] text-emerald-600 font-mono">
                ✓ Lat: {latitude}, Lng: {longitude}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="complaint-landmark" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Landmark / Clues <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              id="complaint-landmark"
              type="text"
              placeholder="e.g. Opposite State Bank ATM, beside bus shelter"
              value={landmarkClues}
              onChange={(e) => setLandmarkClues(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Image Attachment */}
        <div>
          <label htmlFor="complaint-img" className="block text-sm font-semibold text-slate-800 mb-1.5">
            Photo URL / Evidence <span className="text-xs font-normal text-slate-400">(Optional image link)</span>
          </label>
          <div className="relative">
            <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              id="complaint-img"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Quick preset links */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">Quick demo photos:</span>
            {sampleImages.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setImageUrl(s.url)}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition"
              >
                + {s.label}
              </button>
            ))}
          </div>

          {imageUrl && (
            <div className="mt-3 relative w-32 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Complaint preview"
                className="w-full h-full object-cover"
                onError={() => {
                  /* ignore broken preview */
                }}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 px-6 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-700 hover:to-blue-800 active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {loadingStep === 1 && "Analysing with Gemini AI..."}
                  {loadingStep === 2 && "Computing Multi-Factor Priority Score..."}
                  {loadingStep === 3 && "Registering SLA Guarantee & Issue ID..."}
                  {loadingStep === 0 && "Submitting..."}
                </span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Complaint for Immediate Triage</span>
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Reports are verified by municipal SLA policy. Transparent 0–100 scoring is calculated automatically.
          </p>
        </div>
      </form>
    </div>
  );
};
