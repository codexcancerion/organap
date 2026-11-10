export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          display_name: string
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          display_name?: string
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          display_name?: string
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          acronym: string
          slug: string
          description: string | null
          category: string
          logo_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          acronym: string
          slug: string
          description?: string | null
          category?: string
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          acronym?: string
          slug?: string
          description?: string | null
          category?: string
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          org_role: string
          position_title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          org_role?: string
          position_title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          org_role?: string
          position_title?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      venues: {
        Row: {
          id: string
          name: string
          location: string | null
          capacity: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          capacity?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          capacity?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      event_proposals: {
        Row: {
          id: string
          organization_id: string
          created_by: string
          title: string
          purpose: string
          activities_desc: string
          venue_id: string
          start_time: string
          end_time: string
          registration_deadline: string
          capacity: number
          status: Database["public"]["Enums"]["proposal_status"]
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          created_by: string
          title: string
          purpose: string
          activities_desc: string
          venue_id: string
          start_time: string
          end_time: string
          registration_deadline: string
          capacity: number
          status?: Database["public"]["Enums"]["proposal_status"]
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          created_by?: string
          title?: string
          purpose?: string
          activities_desc?: string
          venue_id?: string
          start_time?: string
          end_time?: string
          registration_deadline?: string
          capacity?: number
          status?: Database["public"]["Enums"]["proposal_status"]
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      proposal_reviews: {
        Row: {
          id: string
          proposal_id: string
          reviewer_id: string
          decision: string
          remarks: string | null
          stage: string
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          reviewer_id: string
          decision: string
          remarks?: string | null
          stage: string
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          reviewer_id?: string
          decision?: string
          remarks?: string | null
          stage?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_reviews_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          }
        ]
      }
      event_registrations: {
        Row: {
          id: string
          proposal_id: string
          student_id: string
          status: string
          registered_at: string
          withdrawn_at: string | null
        }
        Insert: {
          id?: string
          proposal_id: string
          student_id: string
          status?: string
          registered_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          id?: string
          proposal_id?: string
          student_id?: string
          status?: string
          registered_at?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          id: string
          proposal_id: string
          registration_id: string
          student_id: string
          verified_by: string
          method: string
          checked_in_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          registration_id: string
          student_id: string
          verified_by: string
          method?: string
          checked_in_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          registration_id?: string
          student_id?: string
          verified_by?: string
          method?: string
          checked_in_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "superadmin" | "student_affairs" | "adviser" | "officer" | "student"
      proposal_status:
        | "draft"
        | "pending_adviser"
        | "returned_by_adviser"
        | "rejected_by_adviser"
        | "pending_student_affairs"
        | "returned_by_student_affairs"
        | "rejected_by_student_affairs"
        | "approved"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
