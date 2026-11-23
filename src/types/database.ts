export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attachment_types: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_required: boolean
          name: string
          template_file_name: string | null
          template_file_path: string | null
          template_file_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          name: string
          template_file_name?: string | null
          template_file_path?: string | null
          template_file_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          name?: string
          template_file_name?: string | null
          template_file_path?: string | null
          template_file_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          check_in_at: string
          check_in_method: string
          id: string
          proposal_id: string
          registration_id: string
          student_id: string
          verification_method: string | null
          verified_at: string | null
          verified_by: string
        }
        Insert: {
          check_in_at?: string
          check_in_method?: string
          id?: string
          proposal_id: string
          registration_id: string
          student_id: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by: string
        }
        Update: {
          check_in_at?: string
          check_in_method?: string
          id?: string
          proposal_id?: string
          registration_id?: string
          student_id?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_attachments: {
        Row: {
          attachment_type_id: string | null
          created_at: string
          file_name: string
          file_path: string
          file_url: string
          id: string
          mime_type: string | null
          proposal_id: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          attachment_type_id?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_url: string
          id?: string
          mime_type?: string | null
          proposal_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          attachment_type_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          proposal_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attachments_attachment_type_id_fkey"
            columns: ["attachment_type_id"]
            isOneToOne: false
            referencedRelation: "attachment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attachments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_proposals: {
        Row: {
          activities_desc: string | null
          activity_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          capacity: number
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          organization_id: string
          purpose: string
          registration_deadline: string
          semester_id: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          activities_desc?: string | null
          activity_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          capacity: number
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          organization_id: string
          purpose: string
          registration_deadline: string
          semester_id?: string | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          activities_desc?: string | null
          activity_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          capacity?: number
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          organization_id?: string
          purpose?: string
          registration_deadline?: string
          semester_id?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_proposals_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          qr_token: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          qr_token: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          qr_token?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_permissions: {
        Row: {
          created_at: string
          group_id: string
          permission_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          permission_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          is_adviser: boolean
          is_officer: boolean
          organization_id: string
          position: string | null
          position_title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_adviser?: boolean
          is_officer?: boolean
          organization_id: string
          position?: string | null
          position_title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_adviser?: boolean
          is_officer?: boolean
          organization_id?: string
          position?: string | null
          position_title?: string | null
          user_id?: string
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
          },
        ]
      }
      organizations: {
        Row: {
          acronym: string
          adviser_id: string | null
          category: string
          created_at: string
          description: string | null
          governor_id: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          acronym: string
          adviser_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          governor_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          acronym?: string
          adviser_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          governor_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_adviser_id_fkey"
            columns: ["adviser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_governor_id_fkey"
            columns: ["governor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_staff: boolean
          is_superuser: boolean
          preferences: Json
          school_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          is_staff?: boolean
          is_superuser?: boolean
          preferences?: Json
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_staff?: boolean
          is_superuser?: boolean
          preferences?: Json
          school_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          code: string
          created_at: string
          department_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_reviews: {
        Row: {
          created_at: string
          decision: string
          id: string
          proposal_id: string
          remarks: string | null
          reviewer_id: string
          stage: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          proposal_id: string
          remarks?: string | null
          reviewer_id: string
          stage: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          proposal_id?: string
          remarks?: string | null
          reviewer_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_reviews_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string
          group_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_organization_member: {
        Args: {
          p_caller_id?: string
          p_is_adviser?: boolean
          p_is_officer?: boolean
          p_org_id: string
          p_position?: string
          p_user_id: string
        }
        Returns: Json
      }
      approve_event_proposal: {
        Args: {
          p_proposal_id: string
          p_remarks?: string
          p_reviewer_id: string
        }
        Returns: Json
      }
      can_user_delete_org: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_user_update_org: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: boolean
      }
      cancel_approved_event: {
        Args: {
          p_cancelled_by: string
          p_proposal_id: string
          p_reason: string
        }
        Returns: Json
      }
      check_venue_conflict: {
        Args: {
          p_end_time: string
          p_exclude_proposal_id?: string
          p_start_time: string
          p_venue_id: string
        }
        Returns: boolean
      }
      create_organization: {
        Args: {
          p_acronym: string
          p_adviser_id?: string
          p_caller_id?: string
          p_category: string
          p_description?: string
          p_governor_id?: string
          p_logo_url?: string
          p_name: string
          p_slug: string
        }
        Returns: Json
      }
      delete_organization: {
        Args: { p_caller_id?: string; p_org_id: string }
        Returns: Json
      }
      get_event_registration_counts: {
        Args: { p_proposal_ids: string[] }
        Returns: {
          proposal_id: string
          registered_count: number
        }[]
      }
      get_user_groups: {
        Args: { p_user_id?: string }
        Returns: {
          group_id: string
          group_name: string
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id?: string }
        Returns: {
          permission_code: string
        }[]
      }
      has_any_perm: {
        Args: { p_codes: string[]; p_user_id?: string }
        Returns: boolean
      }
      has_perm: {
        Args: { p_code: string; p_user_id?: string }
        Returns: boolean
      }
      is_org_adviser: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_org_officer: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_staff: { Args: { p_user_id?: string }; Returns: boolean }
      is_superuser: { Args: { p_user_id?: string }; Returns: boolean }
      record_attendance_entry: {
        Args: {
          p_method?: string
          p_proposal_id: string
          p_token_or_student_id: string
          p_verified_by: string
        }
        Returns: Json
      }
      register_for_event: {
        Args: { p_proposal_id: string; p_student_id: string }
        Returns: Json
      }
      remove_organization_member: {
        Args: { p_caller_id?: string; p_member_id: string }
        Returns: Json
      }
      update_member_position: {
        Args: { p_member_id: string; p_position: string; p_user_id?: string }
        Returns: Json
      }
      update_organization_info: {
        Args: {
          p_acronym: string
          p_caller_id?: string
          p_category: string
          p_description?: string
          p_is_active?: boolean
          p_logo_url?: string
          p_name: string
          p_org_id: string
          p_slug: string
        }
        Returns: Json
      }
      update_organization_leaders: {
        Args: {
          p_adviser_id: string
          p_caller_id?: string
          p_governor_id: string
          p_org_id: string
        }
        Returns: Json
      }
      withdraw_from_event: {
        Args: { p_registration_id: string; p_student_id: string }
        Returns: Json
      }
    }
    Enums: {
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      proposal_status: [
        "draft",
        "pending_adviser",
        "returned_by_adviser",
        "rejected_by_adviser",
        "pending_student_affairs",
        "returned_by_student_affairs",
        "rejected_by_student_affairs",
        "approved",
        "cancelled",
      ],
    },
  },
} as const

