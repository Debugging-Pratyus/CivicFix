"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ComplaintForm } from "@/components/ComplaintForm";
import type { ComplaintCategory } from "@/types";
import { Sparkles, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function ReportFormContent() {
  const searchParams = useSearchParams();
  const rawCat = searchParams.get("category");
  const validCategories: ComplaintCategory[] = [
    "pothole",
    "waste_accumulation",
    "damaged_streetlight",
    "blocked_drain",
    "water_leakage",
  ];

  const initialCategory: ComplaintCategory | undefined =
    rawCat && validCategories.includes(rawCat as ComplaintCategory)
      ? (rawCat as ComplaintCategory)
      : undefined;

  return <ComplaintForm initialCategory={initialCategory} />;
}

export default function ReportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Breadcrumb / Back Link */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-3 text-sm text-slate-500">Loading complaint submission form...</p>
              </div>
            }
          >
            <ReportFormContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
