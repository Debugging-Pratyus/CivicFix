import React from "react";
import type { ComplaintCategory } from "@/types";
import { CATEGORIES_META } from "@/lib/constants";
import {
  Cone,
  Trash2,
  Lightbulb,
  Waves,
  Droplets,
  AlertCircle,
} from "lucide-react";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function getCategoryIcon(category: string, className = "w-4 h-4") {
  switch (category) {
    case "pothole":
      return <Cone className={className} />;
    case "waste_accumulation":
      return <Trash2 className={className} />;
    case "damaged_streetlight":
      return <Lightbulb className={className} />;
    case "blocked_drain":
      return <Waves className={className} />;
    case "water_leakage":
      return <Droplets className={className} />;
    default:
      return <AlertCircle className={className} />;
  }
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = "md",
  showIcon = true,
}) => {
  const meta = CATEGORIES_META[category as ComplaintCategory];
  const label = meta ? meta.label : category.replace(/_/g, " ");

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5",
    lg: "px-3 py-1.5 text-sm font-semibold gap-2",
  }[size];

  const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${
        meta?.bgLight || "bg-slate-100 text-slate-700 border-slate-200"
      } ${sizeClasses}`}
    >
      {showIcon && getCategoryIcon(category, iconSize)}
      <span>{label}</span>
    </span>
  );
};
