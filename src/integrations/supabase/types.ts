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
      clientes: {
        Row: {
          apellidos: string | null
          created_at: string | null
          email: string | null
          etiquetas: string[] | null
          giro: string | null
          id: string
          nombres: string | null
          notas: string | null
          razon_social: string | null
          rut: string
          telefono: string | null
          tipo: Database["public"]["Enums"]["tipo_cliente"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          apellidos?: string | null
          created_at?: string | null
          email?: string | null
          etiquetas?: string[] | null
          giro?: string | null
          id?: string
          nombres?: string | null
          notas?: string | null
          razon_social?: string | null
          rut: string
          telefono?: string | null
          tipo: Database["public"]["Enums"]["tipo_cliente"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          apellidos?: string | null
          created_at?: string | null
          email?: string | null
          etiquetas?: string[] | null
          giro?: string | null
          id?: string
          nombres?: string | null
          notas?: string | null
          razon_social?: string | null
          rut?: string
          telefono?: string | null
          tipo?: Database["public"]["Enums"]["tipo_cliente"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contactos: {
        Row: {
          cliente_id: string
          created_at: string | null
          email: string | null
          es_principal: boolean | null
          id: string
          nombre: string
          notas: string | null
          rol_contextual: string | null
          telefono: string | null
          tipo_contacto_empresa:
            | Database["public"]["Enums"]["tipo_contacto_empresa"]
            | null
          tipo_contacto_persona:
            | Database["public"]["Enums"]["tipo_contacto_persona"]
            | null
          ubicacion_id: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          email?: string | null
          es_principal?: boolean | null
          id?: string
          nombre: string
          notas?: string | null
          rol_contextual?: string | null
          telefono?: string | null
          tipo_contacto_empresa?:
            | Database["public"]["Enums"]["tipo_contacto_empresa"]
            | null
          tipo_contacto_persona?:
            | Database["public"]["Enums"]["tipo_contacto_persona"]
            | null
          ubicacion_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          email?: string | null
          es_principal?: boolean | null
          id?: string
          nombre?: string
          notas?: string | null
          rol_contextual?: string | null
          telefono?: string | null
          tipo_contacto_empresa?:
            | Database["public"]["Enums"]["tipo_contacto_empresa"]
            | null
          tipo_contacto_persona?:
            | Database["public"]["Enums"]["tipo_contacto_persona"]
            | null
          ubicacion_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contactos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_ubicacion_id_fkey"
            columns: ["ubicacion_id"]
            isOneToOne: false
            referencedRelation: "ubicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      ubicaciones: {
        Row: {
          alias: string
          ciudad: string
          cliente_id: string
          comuna: string
          created_at: string | null
          direccion: string
          id: string
          lat: number | null
          lng: number | null
          por_defecto: boolean | null
          region: string
          tipo: Database["public"]["Enums"]["tipo_ubicacion"]
          updated_at: string | null
        }
        Insert: {
          alias: string
          ciudad: string
          cliente_id: string
          comuna: string
          created_at?: string | null
          direccion: string
          id?: string
          lat?: number | null
          lng?: number | null
          por_defecto?: boolean | null
          region: string
          tipo: Database["public"]["Enums"]["tipo_ubicacion"]
          updated_at?: string | null
        }
        Update: {
          alias?: string
          ciudad?: string
          cliente_id?: string
          comuna?: string
          created_at?: string | null
          direccion?: string
          id?: string
          lat?: number | null
          lng?: number | null
          por_defecto?: boolean | null
          region?: string
          tipo?: Database["public"]["Enums"]["tipo_ubicacion"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ubicaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "cliente"
      tipo_cliente: "empresa" | "persona"
      tipo_contacto_empresa:
        | "administrador_sucursal"
        | "encargado_proyecto"
        | "otro"
      tipo_contacto_persona: "pareja" | "hijo" | "secundario" | "otro"
      tipo_ubicacion: "sucursal" | "domicilio"
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
      app_role: ["admin", "supervisor", "cliente"],
      tipo_cliente: ["empresa", "persona"],
      tipo_contacto_empresa: [
        "administrador_sucursal",
        "encargado_proyecto",
        "otro",
      ],
      tipo_contacto_persona: ["pareja", "hijo", "secundario", "otro"],
      tipo_ubicacion: ["sucursal", "domicilio"],
    },
  },
} as const
