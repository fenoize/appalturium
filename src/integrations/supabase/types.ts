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
      asignaciones_ot: {
        Row: {
          created_at: string | null
          horario_fin: string | null
          horario_inicio: string | null
          id: string
          notas: string | null
          ot_id: string
          personal_id: string
          rol_en_ot: Database["public"]["Enums"]["rol_en_ot"] | null
        }
        Insert: {
          created_at?: string | null
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          notas?: string | null
          ot_id: string
          personal_id: string
          rol_en_ot?: Database["public"]["Enums"]["rol_en_ot"] | null
        }
        Update: {
          created_at?: string | null
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          notas?: string | null
          ot_id?: string
          personal_id?: string
          rol_en_ot?: Database["public"]["Enums"]["rol_en_ot"] | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_ot_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
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
      informes_finales: {
        Row: {
          created_at: string | null
          evidencias_urls: Json | null
          firma_cliente: string | null
          geocierre_lat: number | null
          geocierre_lng: number | null
          geocierre_timestamp: string | null
          id: string
          lecturas_mediciones: Json | null
          materiales: Json | null
          observaciones_cliente: string | null
          ot_id: string
          pdf_url: string | null
          recomendaciones: string | null
          responsable_personal_id: string
          resumen_tecnico: string
          tareas_ejecutadas: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evidencias_urls?: Json | null
          firma_cliente?: string | null
          geocierre_lat?: number | null
          geocierre_lng?: number | null
          geocierre_timestamp?: string | null
          id?: string
          lecturas_mediciones?: Json | null
          materiales?: Json | null
          observaciones_cliente?: string | null
          ot_id: string
          pdf_url?: string | null
          recomendaciones?: string | null
          responsable_personal_id: string
          resumen_tecnico: string
          tareas_ejecutadas?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evidencias_urls?: Json | null
          firma_cliente?: string | null
          geocierre_lat?: number | null
          geocierre_lng?: number | null
          geocierre_timestamp?: string | null
          id?: string
          lecturas_mediciones?: Json | null
          materiales?: Json | null
          observaciones_cliente?: string | null
          ot_id?: string
          pdf_url?: string | null
          recomendaciones?: string | null
          responsable_personal_id?: string
          resumen_tecnico?: string
          tareas_ejecutadas?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "informes_finales_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: true
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_servicio: {
        Row: {
          adjuntos: Json | null
          cliente_id: string
          costos_estimado: number | null
          costos_real: number | null
          created_at: string | null
          created_by_user_id: string
          descripcion: string
          estado: string
          fecha_programada_fin: string | null
          fecha_programada_inicio: string | null
          id: string
          numero: string
          prioridad: Database["public"]["Enums"]["prioridad_ot"] | null
          tipo_trabajo: string
          ubicacion_id: string
          updated_at: string | null
        }
        Insert: {
          adjuntos?: Json | null
          cliente_id: string
          costos_estimado?: number | null
          costos_real?: number | null
          created_at?: string | null
          created_by_user_id: string
          descripcion: string
          estado?: string
          fecha_programada_fin?: string | null
          fecha_programada_inicio?: string | null
          id?: string
          numero: string
          prioridad?: Database["public"]["Enums"]["prioridad_ot"] | null
          tipo_trabajo: string
          ubicacion_id: string
          updated_at?: string | null
        }
        Update: {
          adjuntos?: Json | null
          cliente_id?: string
          costos_estimado?: number | null
          costos_real?: number | null
          created_at?: string | null
          created_by_user_id?: string
          descripcion?: string
          estado?: string
          fecha_programada_fin?: string | null
          fecha_programada_inicio?: string | null
          id?: string
          numero?: string
          prioridad?: Database["public"]["Enums"]["prioridad_ot"] | null
          tipo_trabajo?: string
          ubicacion_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_servicio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_ubicacion_id_fkey"
            columns: ["ubicacion_id"]
            isOneToOne: false
            referencedRelation: "ubicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_estado_logs: {
        Row: {
          cambio_realizado_por: string
          created_at: string | null
          estado_anterior: string | null
          estado_nuevo: string
          id: string
          notas: string | null
          ot_id: string
        }
        Insert: {
          cambio_realizado_por: string
          created_at?: string | null
          estado_anterior?: string | null
          estado_nuevo: string
          id?: string
          notas?: string | null
          ot_id: string
        }
        Update: {
          cambio_realizado_por?: string
          created_at?: string | null
          estado_anterior?: string | null
          estado_nuevo?: string
          id?: string
          notas?: string | null
          ot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ot_estado_logs_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_sistema: {
        Row: {
          activo: boolean | null
          categoria: string
          color: string | null
          created_at: string | null
          descripcion: string | null
          editable_por_admin: boolean | null
          icono: string | null
          id: string
          key: string
          label: string
          orden: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          editable_por_admin?: boolean | null
          icono?: string | null
          id?: string
          key: string
          label: string
          orden?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          editable_por_admin?: boolean | null
          icono?: string | null
          id?: string
          key?: string
          label?: string
          orden?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      generar_numero_ot: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
      prioridad_ot: "baja" | "media" | "alta" | "urgente"
      rol_en_ot: "tecnico" | "operario" | "despachador" | "otro"
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
      prioridad_ot: ["baja", "media", "alta", "urgente"],
      rol_en_ot: ["tecnico", "operario", "despachador", "otro"],
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
