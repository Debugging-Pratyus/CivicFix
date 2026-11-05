import type { ComplaintCategory, ComplaintStatus } from "@/types";

export interface CategoryMeta {
  key: ComplaintCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgLight: string;
  borderLight: string;
  slaTargetHours: number;
}

export const CATEGORIES_META: Record<ComplaintCategory, CategoryMeta> = {
  pothole: {
    key: "pothole",
    label: "Roads & Potholes",
    description: "Craters, road cave-ins, asphalt erosion, and hazard craters on public streets.",
    icon: "Road",
    color: "text-amber-600",
    bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    borderLight: "border-amber-200",
    slaTargetHours: 48,
  },
  waste_accumulation: {
    key: "waste_accumulation",
    label: "Waste Accumulation",
    description: "Overflowing communal dumpsters, illegal trash dumping, and uncollected curbside bins.",
    icon: "Trash2",
    color: "text-emerald-600",
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderLight: "border-emerald-200",
    slaTargetHours: 24,
  },
  damaged_streetlight: {
    key: "damaged_streetlight",
    label: "Damaged Streetlight",
    description: "Flickering lights, exposed wiring, non-functional light poles, and dark transit corridors.",
    icon: "Lightbulb",
    color: "text-yellow-600",
    bgLight: "bg-yellow-50 text-yellow-700 border-yellow-200",
    borderLight: "border-yellow-200",
    slaTargetHours: 48,
  },
  blocked_drain: {
    key: "blocked_drain",
    label: "Blocked Drain",
    description: "Stormwater silt buildup, clogged sewer inlets, street flooding, and stagnant water.",
    icon: "Waves",
    color: "text-cyan-600",
    bgLight: "bg-cyan-50 text-cyan-700 border-cyan-200",
    borderLight: "border-cyan-200",
    slaTargetHours: 24,
  },
  water_leakage: {
    key: "water_leakage",
    label: "Water Leakage",
    description: "Broken municipal water mains, pipeline bursts, public hydrants leaking potable water.",
    icon: "Droplets",
    color: "text-blue-600",
    bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    borderLight: "border-blue-200",
    slaTargetHours: 12,
  },
};

export interface StatusMeta {
  key: ComplaintStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const STATUS_META: Record<ComplaintStatus, StatusMeta> = {
  pending: {
    key: "pending",
    label: "Pending Review",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    dotClass: "bg-slate-400",
  },
  in_progress: {
    key: "in_progress",
    label: "In Progress",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500 animate-pulse",
  },
  resolved: {
    key: "resolved",
    label: "Resolved",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  overdue: {
    key: "overdue",
    label: "SLA Overdue",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    dotClass: "bg-rose-500",
  },
  duplicate: {
    key: "duplicate",
    label: "Merged Duplicate",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
  },
};
