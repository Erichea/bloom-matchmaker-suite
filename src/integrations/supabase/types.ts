export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_codes: {
        Row: {
          code: string
          created_at: string
          event_date: string | null
          event_name: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_by?: string | null
        }
        Relationships: []
      }
      match_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_data: Json | null
          interaction_type: string | null
          match_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string | null
          match_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string | null
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_interactions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          admin_notes: string | null
          compatibility_score: number | null
          created_at: string
          id: string
          profile_1_id: string
          profile_1_response: string | null
          profile_2_id: string
          profile_2_response: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          compatibility_score?: number | null
          created_at?: string
          id?: string
          profile_1_id: string
          profile_1_response?: string | null
          profile_2_id: string
          profile_2_response?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          compatibility_score?: number | null
          created_at?: string
          id?: string
          profile_1_id?: string
          profile_1_response?: string | null
          profile_2_id?: string
          profile_2_response?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_profile_1_id_fkey"
            columns: ["profile_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_profile_2_id_fkey"
            columns: ["profile_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          order_index: number | null
          photo_url: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          order_index?: number | null
          photo_url: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          order_index?: number | null
          photo_url?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about_me: string | null
          access_code_id: string | null
          achievements: string | null
          admin_notes: string | null
          approved_at: string | null
          city: string | null
          completion_percentage: number | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          education: Database["public"]["Enums"]["education_level"] | null
          email: string | null
          faith: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string
          income_level: Database["public"]["Enums"]["income_level"] | null
          interests: string[] | null
          last_name: string | null
          lifestyle: string[] | null
          nationality: string | null
          number_of_children: number | null
          phone: string | null
          preferred_gender: Database["public"]["Enums"]["gender_type"] | null
          preferred_location_radius: number | null
          preferred_max_age: number | null
          preferred_max_height: number | null
          preferred_min_age: number | null
          preferred_min_height: number | null
          profession: string | null
          rejected_at: string | null
          rejection_reason: string | null
          relationship_status:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          reviewed_by: string | null
          seeks_similar_values: boolean | null
          status: Database["public"]["Enums"]["profile_status"] | null
          submitted_for_review_at: string | null
          updated_at: string
          user_id: string | null
          wants_more_children: boolean | null
          weight_kg: number | null
        }
        Insert: {
          about_me?: string | null
          access_code_id?: string | null
          achievements?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          city?: string | null
          completion_percentage?: number | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: Database["public"]["Enums"]["education_level"] | null
          email?: string | null
          faith?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          income_level?: Database["public"]["Enums"]["income_level"] | null
          interests?: string[] | null
          last_name?: string | null
          lifestyle?: string[] | null
          nationality?: string | null
          number_of_children?: number | null
          phone?: string | null
          preferred_gender?: Database["public"]["Enums"]["gender_type"] | null
          preferred_location_radius?: number | null
          preferred_max_age?: number | null
          preferred_max_height?: number | null
          preferred_min_age?: number | null
          preferred_min_height?: number | null
          profession?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          reviewed_by?: string | null
          seeks_similar_values?: boolean | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          submitted_for_review_at?: string | null
          updated_at?: string
          user_id?: string | null
          wants_more_children?: boolean | null
          weight_kg?: number | null
        }
        Update: {
          about_me?: string | null
          access_code_id?: string | null
          achievements?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          city?: string | null
          completion_percentage?: number | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: Database["public"]["Enums"]["education_level"] | null
          email?: string | null
          faith?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          income_level?: Database["public"]["Enums"]["income_level"] | null
          interests?: string[] | null
          last_name?: string | null
          lifestyle?: string[] | null
          nationality?: string | null
          number_of_children?: number | null
          phone?: string | null
          preferred_gender?: Database["public"]["Enums"]["gender_type"] | null
          preferred_location_radius?: number | null
          preferred_max_age?: number | null
          preferred_max_height?: number | null
          preferred_min_age?: number | null
          preferred_min_height?: number | null
          profession?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          reviewed_by?: string | null
          seeks_similar_values?: boolean | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          submitted_for_review_at?: string | null
          updated_at?: string
          user_id?: string | null
          wants_more_children?: boolean | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_access_code_id_fkey"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_profile: {
        Args: { p_profile_id: string; p_admin_id: string }
        Returns: Json
      }
      calculate_profile_completion: {
        Args: { profile_id: string }
        Returns: number
      }
      calculate_questionnaire_completion: {
        Args: { p_user_id: string }
        Returns: number
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      reject_profile: {
        Args: { p_profile_id: string; p_admin_id: string; p_rejection_reason: string }
        Returns: Json
      }
      submit_profile_for_review: {
        Args: { p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      education_level: "high_school" | "bachelor" | "master" | "phd" | "other"
      gender_type: "male" | "female" | "non_binary" | "prefer_not_to_say"
      income_level:
        | "under_50k"
        | "50k_75k"
        | "75k_100k"
        | "100k_150k"
        | "150k_plus"
      profile_status:
        | "incomplete"
        | "pending_approval"
        | "approved"
        | "rejected"
      relationship_status: "single" | "divorced" | "widowed" | "separated"
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
  public: {
    Enums: {
      education_level: ["high_school", "bachelor", "master", "phd", "other"],
      gender_type: ["male", "female", "non_binary", "prefer_not_to_say"],
      income_level: [
        "under_50k",
        "50k_75k",
        "75k_100k",
        "100k_150k",
        "150k_plus",
      ],
      profile_status: [
        "incomplete",
        "pending_approval",
        "approved",
        "rejected",
      ],
      relationship_status: ["single", "divorced", "widowed", "separated"],
    },
  },
} as const
