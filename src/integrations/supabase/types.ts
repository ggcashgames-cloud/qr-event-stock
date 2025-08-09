export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      budget_items: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          event_id: string
          id: string
          name: string
          quantity: number
          status: string
          supplier: string | null
          total_price: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id: string
          id?: string
          name: string
          quantity?: number
          status?: string
          supplier?: string | null
          total_price?: number | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          quantity?: number
          status?: string
          supplier?: string | null
          total_price?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_products: {
        Row: {
          event_id: string
          id: string
          notes: string | null
          product_id: string
          quantity_sent: number
          sent_at: string
        }
        Insert: {
          event_id: string
          id?: string
          notes?: string | null
          product_id: string
          quantity_sent?: number
          sent_at?: string
        }
        Update: {
          event_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity_sent?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_products_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          budget_items: Json | null
          budget_total: number | null
          created_at: string
          date: string
          description: string | null
          id: string
          location: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          budget_items?: Json | null
          budget_total?: number | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget_items?: Json | null
          budget_total?: number | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json | null
          event_id: string | null
          id: string
          period_end: string
          period_start: string
          report_type: string
          status: string
          title: string
          total_budget: number | null
          total_remaining: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          event_id?: string | null
          id?: string
          period_end: string
          period_start: string
          report_type: string
          status?: string
          title: string
          total_budget?: number | null
          total_remaining?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          event_id?: string | null
          id?: string
          period_end?: string
          period_start?: string
          report_type?: string
          status?: string
          title?: string
          total_budget?: number | null
          total_remaining?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number | null
          qr_code: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number | null
          qr_code?: string | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          qr_code?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_user_approved: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "financial_admin" | "user"
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
      user_role: ["admin", "financial_admin", "user"],
    },
  },
} as const
