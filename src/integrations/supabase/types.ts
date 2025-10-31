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
      billing_account_states: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      billing_accounts: {
        Row: {
          account_number: string
          amount: number
          billing_end_date: string | null
          billing_month: string
          billing_start_date: string | null
          comentario_supervisor: string | null
          contract_id: string
          created_at: string
          created_by: string
          enviado_el: string | null
          firma_url: string | null
          id: string
          notes: string | null
          planilla_fecha: string | null
          planilla_file_url: string | null
          planilla_numero: string | null
          planilla_valor: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_number: string
          amount: number
          billing_end_date?: string | null
          billing_month: string
          billing_start_date?: string | null
          comentario_supervisor?: string | null
          contract_id: string
          created_at?: string
          created_by: string
          enviado_el?: string | null
          firma_url?: string | null
          id?: string
          notes?: string | null
          planilla_fecha?: string | null
          planilla_file_url?: string | null
          planilla_numero?: string | null
          planilla_valor?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state_code?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          amount?: number
          billing_end_date?: string | null
          billing_month?: string
          billing_start_date?: string | null
          comentario_supervisor?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string
          enviado_el?: string | null
          firma_url?: string | null
          id?: string
          notes?: string | null
          planilla_fecha?: string | null
          planilla_file_url?: string | null
          planilla_numero?: string | null
          planilla_valor?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state_code?: string | null
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
          {
            foreignKeyName: "fk_billing_accounts_state"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "billing_account_states"
            referencedColumns: ["code"]
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
          {
            foreignKeyName: "billing_documents_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "v_billing_accounts_last_review"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_reviews: {
        Row: {
          action: string
          billing_account_id: string
          comentario: string | null
          comments: string | null
          created_at: string
          decision: string | null
          id: string
          reviewer_id: string
        }
        Insert: {
          action: string
          billing_account_id: string
          comentario?: string | null
          comments?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          reviewer_id: string
        }
        Update: {
          action?: string
          billing_account_id?: string
          comentario?: string | null
          comments?: string | null
          created_at?: string
          decision?: string | null
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
          {
            foreignKeyName: "billing_reviews_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "v_billing_accounts_last_review"
            referencedColumns: ["id"]
          },
        ]
      }
      contract: {
        Row: {
          CDP: string | null
          CONTRATO: string | null
          DESCRIP_TERCERO: string | null
          "FECHA CDP": string | null
          "FECHA RP": string | null
          MODIFIC_CREDITO: string | null
          MODIFIC_DEBITO: string | null
          "OBSERVACION RP": string | null
          RP: number | null
          "SALDO RP": string | null
          TERCERO: string | null
          "VALOR EJECUTADO": string | null
          VALOR_INICIAL: string | null
        }
        Insert: {
          CDP?: string | null
          CONTRATO?: string | null
          DESCRIP_TERCERO?: string | null
          "FECHA CDP"?: string | null
          "FECHA RP"?: string | null
          MODIFIC_CREDITO?: string | null
          MODIFIC_DEBITO?: string | null
          "OBSERVACION RP"?: string | null
          RP?: number | null
          "SALDO RP"?: string | null
          TERCERO?: string | null
          "VALOR EJECUTADO"?: string | null
          VALOR_INICIAL?: string | null
        }
        Update: {
          CDP?: string | null
          CONTRATO?: string | null
          DESCRIP_TERCERO?: string | null
          "FECHA CDP"?: string | null
          "FECHA RP"?: string | null
          MODIFIC_CREDITO?: string | null
          MODIFIC_DEBITO?: string | null
          "OBSERVACION RP"?: string | null
          RP?: number | null
          "SALDO RP"?: string | null
          TERCERO?: string | null
          "VALOR EJECUTADO"?: string | null
          VALOR_INICIAL?: string | null
        }
        Relationships: []
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
      contract_states: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: Database["public"]["Enums"]["contract_state"]
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: Database["public"]["Enums"]["contract_state"]
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: Database["public"]["Enums"]["contract_state"]
        }
        Relationships: []
      }
      contracts: {
        Row: {
          area_responsable: string | null
          bank_certification_mime: string | null
          bank_certification_path: string | null
          cdp: string | null
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
          contract_number_original: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          estado: Database["public"]["Enums"]["contract_state"] | null
          execution_period_days: number | null
          execution_period_months: number | null
          fecha_cdp: string | null
          fecha_rp: string | null
          hourly_rate: number | null
          id: string
          oid: number
          rp: string | null
          signed_contract_mime: string | null
          signed_contract_path: string | null
          start_date: string
          state_code: string | null
          status: Database["public"]["Enums"]["contract_status"]
          supervisor_asignado: string | null
          supervisor_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          area_responsable?: string | null
          bank_certification_mime?: string | null
          bank_certification_path?: string | null
          cdp?: string | null
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
          contract_number_original?: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          estado?: Database["public"]["Enums"]["contract_state"] | null
          execution_period_days?: number | null
          execution_period_months?: number | null
          fecha_cdp?: string | null
          fecha_rp?: string | null
          hourly_rate?: number | null
          id?: string
          oid?: number
          rp?: string | null
          signed_contract_mime?: string | null
          signed_contract_path?: string | null
          start_date: string
          state_code?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          supervisor_asignado?: string | null
          supervisor_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          area_responsable?: string | null
          bank_certification_mime?: string | null
          bank_certification_path?: string | null
          cdp?: string | null
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
          contract_number_original?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          estado?: Database["public"]["Enums"]["contract_state"] | null
          execution_period_days?: number | null
          execution_period_months?: number | null
          fecha_cdp?: string | null
          fecha_rp?: string | null
          hourly_rate?: number | null
          id?: string
          oid?: number
          rp?: string | null
          signed_contract_mime?: string | null
          signed_contract_path?: string | null
          start_date?: string
          state_code?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          supervisor_asignado?: string | null
          supervisor_id?: string | null
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
            foreignKeyName: "contracts_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_contracts_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contracts_state"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "contract_states"
            referencedColumns: ["code"]
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
      historial_estado_cuenta: {
        Row: {
          created_at: string
          cuenta_id: string
          estado_anterior: string | null
          estado_nuevo: string
          id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          cuenta_id: string
          estado_anterior?: string | null
          estado_nuevo: string
          id?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          cuenta_id?: string
          estado_anterior?: string | null
          estado_nuevo?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_estado_cuenta_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_estado_cuenta_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "v_billing_accounts_last_review"
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
      procesos: {
        Row: {
          created_at: string
          id: number
          nombre_proceso: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          nombre_proceso: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          nombre_proceso?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar: string | null
          bank_account: string | null
          bank_name: string | null
          created_at: string
          document_number: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          nit: string | null
          phone: string | null
          proceso_id: number | null
          role_id: string
          tax_regime: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar?: string | null
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          document_number?: string | null
          email: string
          id?: string
          last_login?: string | null
          name: string
          nit?: string | null
          phone?: string | null
          proceso_id?: number | null
          role_id: string
          tax_regime?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar?: string | null
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          document_number?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          nit?: string | null
          phone?: string | null
          proceso_id?: number | null
          role_id?: string
          tax_regime?: string | null
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
            foreignKeyName: "profiles_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos"
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
      v_billing_accounts_last_review: {
        Row: {
          contract_id: string | null
          estado: string | null
          fecha: string | null
          id: string | null
          last_comment: string | null
          last_decision: string | null
          last_review_at: string | null
          numero: string | null
          periodo: string | null
          valor: number | null
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
    }
    Functions: {
      generate_billing_account_number: { Args: never; Returns: string }
      generate_billing_number: { Args: never; Returns: string }
      generate_contract_number: { Args: never; Returns: string }
      get_billing_account_state: {
        Args: { state_code: string }
        Returns: {
          code: string
          description: string
          display_name: string
          name: string
        }[]
      }
      get_contract_state: {
        Args: { state_code: string }
        Returns: {
          code: string
          description: string
          display_name: string
          name: string
        }[]
      }
      get_current_user_proceso_id: { Args: never; Returns: number }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role_type"]
      }
      update_contract_statuses: { Args: never; Returns: undefined }
    }
    Enums: {
      contract_state:
        | "registrado"
        | "devuelto"
        | "en_ejecucion"
        | "completado"
        | "cancelado"
      contract_status:
        | "draft"
        | "active"
        | "completed"
        | "cancelled"
        | "returned"
      contract_type: "fixed_amount" | "variable_amount" | "contractor"
      user_role_type:
        | "super_admin"
        | "supervisor"
        | "admin"
        | "employee"
        | "treasury"
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
      contract_state: [
        "registrado",
        "devuelto",
        "en_ejecucion",
        "completado",
        "cancelado",
      ],
      contract_status: [
        "draft",
        "active",
        "completed",
        "cancelled",
        "returned",
      ],
      contract_type: ["fixed_amount", "variable_amount", "contractor"],
      user_role_type: [
        "super_admin",
        "supervisor",
        "admin",
        "employee",
        "treasury",
      ],
    },
  },
} as const
