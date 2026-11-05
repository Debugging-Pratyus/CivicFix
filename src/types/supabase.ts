/**
 * Supabase generated types placeholder.
 * Replace with the output of:  npx supabase gen types typescript --project-id <your-id> > src/types/supabase.ts
 * Until the database is provisioned, this stub keeps TypeScript happy.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "citizen" | "admin";
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "citizen" | "admin";
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "citizen" | "admin";
          full_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          tracking_id: string;
          citizen_id: string | null;
          category: string;
          status: string;
          title: string;
          description: string;
          location_text: string | null;
          latitude: number | null;
          longitude: number | null;
          landmark_clues: string | null;
          image_urls: string[];
          priority_score: number | null;
          priority_breakdown: Json | null;
          ai_classification_raw: Json | null;
          missing_info_flags: string[];
          requires_clarification: boolean;
          assigned_to: string | null;
          master_issue_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tracking_id: string;
          citizen_id?: string | null;
          category: string;
          status?: string;
          title: string;
          description: string;
          location_text?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          landmark_clues?: string | null;
          image_urls?: string[];
          priority_score?: number | null;
          priority_breakdown?: Json | null;
          ai_classification_raw?: Json | null;
          missing_info_flags?: string[];
          requires_clarification?: boolean;
          assigned_to?: string | null;
          master_issue_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          status?: string;
          title?: string;
          description?: string;
          location_text?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          landmark_clues?: string | null;
          image_urls?: string[];
          priority_score?: number | null;
          priority_breakdown?: Json | null;
          ai_classification_raw?: Json | null;
          missing_info_flags?: string[];
          requires_clarification?: boolean;
          assigned_to?: string | null;
          master_issue_id?: string | null;
          updated_at?: string;
        };
      };
      master_issues: {
        Row: {
          id: string;
          category: string;
          title: string;
          description: string;
          status: string;
          location_text: string | null;
          latitude: number | null;
          longitude: number | null;
          complaint_count: number;
          priority_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          title: string;
          description: string;
          status?: string;
          location_text?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          complaint_count?: number;
          priority_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          title?: string;
          description?: string;
          status?: string;
          location_text?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          complaint_count?: number;
          priority_score?: number | null;
          updated_at?: string;
        };
      };
      duplicate_suggestions: {
        Row: {
          id: string;
          source_complaint_id: string;
          target_complaint_id: string | null;
          master_issue_id: string | null;
          similarity_score: number;
          similarity_reasons: string[];
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_complaint_id: string;
          target_complaint_id?: string | null;
          master_issue_id?: string | null;
          similarity_score: number;
          similarity_reasons?: string[];
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
      };
      status_history: {
        Row: {
          id: string;
          complaint_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      sla_records: {
        Row: {
          id: string;
          complaint_id: string;
          category: string;
          priority_score: number;
          deadline_hours: number;
          deadline_at: string;
          resolved_at: string | null;
          is_overdue: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          category: string;
          priority_score: number;
          deadline_hours: number;
          deadline_at: string;
          resolved_at?: string | null;
          is_overdue?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resolved_at?: string | null;
          is_overdue?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_complaint_count: {
        Args: { issue_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}
