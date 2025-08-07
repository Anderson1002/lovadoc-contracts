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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activities_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_accounts: {
        Row: {
          account_number: string
          amount: number
          billing_end_date: string | null
          billing_month: string
          billing_start_date: string | null
          contract_id: string
          created_at: string
          created_by: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_number: string
          amount: number
          billing_end_date?: string | null
          billing_month: string
          billing_start_date?: string | null
          contract_id: string
          created_at?: string
          created_by: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          amount?: number
          billing_end_date?: string | null
          billing_month?: string
          billing_start_date?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_accounts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_activities: {
        Row: {
          actions_developed: string
          activity_name: string
          activity_order: number
          billing_account_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          actions_developed: string
          activity_name: string
          activity_order?: number
          billing_account_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          actions_developed?: string
          activity_name?: string
          activity_order?: number
          billing_account_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_activity_evidence: {
        Row: {
          billing_activity_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          billing_activity_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          billing_activity_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_activity_evidence_billing_activity_id_fkey"
            columns: ["billing_activity_id"]
            isOneToOne: false
            referencedRelation: "billing_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_documents: {
        Row: {
          billing_account_id: string
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          billing_account_id: string
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          billing_account_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_documents_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_reviews: {
        Row: {
          action: string
          billing_account_id: string
          comments: string | null
          created_at: string
          id: string
          reviewer_id: string
        }
        Insert: {
          action: string
          billing_account_id: string
          comments?: string | null
          created_at?: string
          id?: string
          reviewer_id: string
        }
        Update: {
          action?: string
          billing_account_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_reviews_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_payments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contract_payments_contract_id"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contract_payments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_state_history: {
        Row: {
          changed_by: string
          comentarios: string | null
          contract_id: string
          created_at: string
          estado_anterior: Database["public"]["Enums"]["contract_state"] | null
          estado_nuevo: Database["public"]["Enums"]["contract_state"]
          id: string
        }
        Insert: {
          changed_by: string
          comentarios?: string | null
          contract_id: string
          created_at?: string
          estado_anterior?: Database["public"]["Enums"]["contract_state"] | null
          estado_nuevo: Database["public"]["Enums"]["contract_state"]
          id?: string
        }
        Update: {
          changed_by?: string
          comentarios?: string | null
          contract_id?: string
          created_at?: string
          estado_anterior?: Database["public"]["Enums"]["contract_state"] | null
          estado_nuevo?: Database["public"]["Enums"]["contract_state"]
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_state_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          area_responsable: string | null
          client_account_number: string | null
          client_address: string | null
          client_bank_name: string | null
          client_document_number: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          comentarios_devolucion: string | null
          consecutivo_numero: number | null
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          estado: Database["public"]["Enums"]["contract_state"] | null
          hourly_rate: number | null
          id: string
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          supervisor_asignado: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          area_responsable?: string | null
          client_account_number?: string | null
          client_address?: string | null
          client_bank_name?: string | null
          client_document_number?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          comentarios_devolucion?: string | null
          consecutivo_numero?: number | null
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          estado?: Database["public"]["Enums"]["contract_state"] | null
          hourly_rate?: number | null
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          supervisor_asignado?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          area_responsable?: string | null
          client_account_number?: string | null
          client_address?: string | null
          client_bank_name?: string | null
          client_document_number?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          comentarios_devolucion?: string | null
          consecutivo_numero?: number | null
          contract_number?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          estado?: Database["public"]["Enums"]["contract_state"] | null
          hourly_rate?: number | null
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          supervisor_asignado?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contracts_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          contract_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_contract_id"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          id: string
          module: string
          role_id: string
        }
        Insert: {
          action: string
          id?: string
          module: string
          role_id: string
        }
        Update: {
          action?: string
          id?: string
          module?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_permissions_role_id"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          name: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_role_id"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          name: Database["public"]["Enums"]["user_role_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          name: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          name?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_billing_account_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_billing_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_contract_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role_type"]
      }
      update_contract_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      contract_state: "registrado" | "devuelto" | "en_ejecucion" | "completado"
      contract_status:
        | "draft"
        | "active"
        | "completed"
        | "cancelled"
        | "returned"
      contract_type: "fixed_amount" | "variable_amount" | "contractor"
      user_role_type: "super_admin" | "supervisor" | "admin" | "employee"
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
      contract_state: ["registrado", "devuelto", "en_ejecucion", "completado"],
      contract_status: [
        "draft",
        "active",
        "completed",
        "cancelled",
        "returned",
      ],
      contract_type: ["fixed_amount", "variable_amount", "contractor"],
      user_role_type: ["super_admin", "supervisor", "admin", "employee"],
    },
  },
} as const
