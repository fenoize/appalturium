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
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "asignaciones_ot_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_inventario: {
        Row: {
          activa: boolean | null
          categoria_padre_id: string | null
          color: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          categoria_padre_id?: string | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          categoria_padre_id?: string | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_inventario_categoria_padre_id_fkey"
            columns: ["categoria_padre_id"]
            isOneToOne: false
            referencedRelation: "categorias_inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      cierres_ot: {
        Row: {
          cobro_final: number | null
          conforme: boolean | null
          created_at: string
          documento_venta_id: string | null
          fecha_revision: string
          id: string
          observaciones: string | null
          ot_id: string
          revisado_por: string
          updated_at: string
        }
        Insert: {
          cobro_final?: number | null
          conforme?: boolean | null
          created_at?: string
          documento_venta_id?: string | null
          fecha_revision?: string
          id?: string
          observaciones?: string | null
          ot_id: string
          revisado_por: string
          updated_at?: string
        }
        Update: {
          cobro_final?: number | null
          conforme?: boolean | null
          created_at?: string
          documento_venta_id?: string | null
          fecha_revision?: string
          id?: string
          observaciones?: string | null
          ot_id?: string
          revisado_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cierres_ot_documento_venta_id_fkey"
            columns: ["documento_venta_id"]
            isOneToOne: false
            referencedRelation: "documentos_venta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_ot_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: true
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "cierres_ot_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: true
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          actualizado_por_user_id: string | null
          apellidos: string | null
          condiciones_pago:
            | Database["public"]["Enums"]["condiciones_pago"]
            | null
          creado_por_user_id: string | null
          created_at: string | null
          credito_aprobado: boolean | null
          credito_monto_max: number | null
          descuento_acordado_pct: number | null
          email: string | null
          estado_cliente: Database["public"]["Enums"]["estado_cliente"] | null
          etiquetas: string[] | null
          giro: string | null
          id: string
          industria: string | null
          lista_precios: string | null
          nombres: string | null
          notas: string | null
          noti_email: boolean | null
          noti_resumen_mensual: boolean | null
          noti_whatsapp: boolean | null
          razon_social: string | null
          rut: string
          segmento: Database["public"]["Enums"]["segmento_cliente"] | null
          sitio_web: string | null
          sla_prioridad: Database["public"]["Enums"]["sla_prioridad"] | null
          telefono: string | null
          tipo: Database["public"]["Enums"]["tipo_cliente"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actualizado_por_user_id?: string | null
          apellidos?: string | null
          condiciones_pago?:
            | Database["public"]["Enums"]["condiciones_pago"]
            | null
          creado_por_user_id?: string | null
          created_at?: string | null
          credito_aprobado?: boolean | null
          credito_monto_max?: number | null
          descuento_acordado_pct?: number | null
          email?: string | null
          estado_cliente?: Database["public"]["Enums"]["estado_cliente"] | null
          etiquetas?: string[] | null
          giro?: string | null
          id?: string
          industria?: string | null
          lista_precios?: string | null
          nombres?: string | null
          notas?: string | null
          noti_email?: boolean | null
          noti_resumen_mensual?: boolean | null
          noti_whatsapp?: boolean | null
          razon_social?: string | null
          rut: string
          segmento?: Database["public"]["Enums"]["segmento_cliente"] | null
          sitio_web?: string | null
          sla_prioridad?: Database["public"]["Enums"]["sla_prioridad"] | null
          telefono?: string | null
          tipo: Database["public"]["Enums"]["tipo_cliente"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actualizado_por_user_id?: string | null
          apellidos?: string | null
          condiciones_pago?:
            | Database["public"]["Enums"]["condiciones_pago"]
            | null
          creado_por_user_id?: string | null
          created_at?: string | null
          credito_aprobado?: boolean | null
          credito_monto_max?: number | null
          descuento_acordado_pct?: number | null
          email?: string | null
          estado_cliente?: Database["public"]["Enums"]["estado_cliente"] | null
          etiquetas?: string[] | null
          giro?: string | null
          id?: string
          industria?: string | null
          lista_precios?: string | null
          nombres?: string | null
          notas?: string | null
          noti_email?: boolean | null
          noti_resumen_mensual?: boolean | null
          noti_whatsapp?: boolean | null
          razon_social?: string | null
          rut?: string
          segmento?: Database["public"]["Enums"]["segmento_cliente"] | null
          sitio_web?: string | null
          sla_prioridad?: Database["public"]["Enums"]["sla_prioridad"] | null
          telefono?: string | null
          tipo?: Database["public"]["Enums"]["tipo_cliente"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clientes_documentos: {
        Row: {
          archivo_url: string | null
          cliente_id: string
          created_at: string | null
          id: string
          tipo: string
          titulo: string
          updated_at: string | null
          vence_el: string | null
        }
        Insert: {
          archivo_url?: string | null
          cliente_id: string
          created_at?: string | null
          id?: string
          tipo: string
          titulo: string
          updated_at?: string | null
          vence_el?: string | null
        }
        Update: {
          archivo_url?: string | null
          cliente_id?: string
          created_at?: string | null
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
          vence_el?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_documentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios_tarea: {
        Row: {
          contenido: string
          created_at: string | null
          id: string
          tarea_id: string
          usuario_id: string
        }
        Insert: {
          contenido: string
          created_at?: string | null
          id?: string
          tarea_id: string
          usuario_id: string
        }
        Update: {
          contenido?: string
          created_at?: string | null
          id?: string
          tarea_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_tarea_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicaciones: {
        Row: {
          adjuntos: Json | null
          canal: Database["public"]["Enums"]["canal_comunicacion"]
          created_at: string | null
          destinatario: string
          emisor_user_id: string | null
          estatus: Database["public"]["Enums"]["estatus_comunicacion"]
          fecha: string
          id: string
          ot_id: string
          requiere_respuesta: boolean | null
          resumen: string
          updated_at: string | null
        }
        Insert: {
          adjuntos?: Json | null
          canal: Database["public"]["Enums"]["canal_comunicacion"]
          created_at?: string | null
          destinatario: string
          emisor_user_id?: string | null
          estatus?: Database["public"]["Enums"]["estatus_comunicacion"]
          fecha?: string
          id?: string
          ot_id: string
          requiere_respuesta?: boolean | null
          resumen: string
          updated_at?: string | null
        }
        Update: {
          adjuntos?: Json | null
          canal?: Database["public"]["Enums"]["canal_comunicacion"]
          created_at?: string | null
          destinatario?: string
          emisor_user_id?: string | null
          estatus?: Database["public"]["Enums"]["estatus_comunicacion"]
          fecha?: string
          id?: string
          ot_id?: string
          requiere_respuesta?: boolean | null
          resumen?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunicaciones_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "comunicaciones_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
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
          recibe_notificaciones: boolean | null
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
          recibe_notificaciones?: boolean | null
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
          recibe_notificaciones?: boolean | null
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
      cotizacion_items: {
        Row: {
          cantidad: number
          cotizacion_id: string
          created_at: string
          descripcion: string
          descuento_pct: number
          id: string
          item_inventario_id: string | null
          orden: number
          precio_unitario: number
          servicio_id: string | null
          subtotal: number
          tipo: string
        }
        Insert: {
          cantidad?: number
          cotizacion_id: string
          created_at?: string
          descripcion: string
          descuento_pct?: number
          id?: string
          item_inventario_id?: string | null
          orden?: number
          precio_unitario?: number
          servicio_id?: string | null
          subtotal?: number
          tipo: string
        }
        Update: {
          cantidad?: number
          cotizacion_id?: string
          created_at?: string
          descripcion?: string
          descuento_pct?: number
          id?: string
          item_inventario_id?: string | null
          orden?: number
          precio_unitario?: number
          servicio_id?: string | null
          subtotal?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_items_item_inventario_id_fkey"
            columns: ["item_inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_items_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizacion_opciones: {
        Row: {
          aceptada_ts: string | null
          costo_base: number
          cotizacion_id: string
          created_at: string
          estado: string
          etiqueta: string
          formato: string
          id: string
          impuestos: number
          margen_pct: number
          orden: number
          presentada_ts: string | null
          rechazada_ts: string | null
          subtotal: number | null
          total: number
        }
        Insert: {
          aceptada_ts?: string | null
          costo_base?: number
          cotizacion_id: string
          created_at?: string
          estado?: string
          etiqueta: string
          formato?: string
          id?: string
          impuestos?: number
          margen_pct: number
          orden: number
          presentada_ts?: string | null
          rechazada_ts?: string | null
          subtotal?: number | null
          total?: number
        }
        Update: {
          aceptada_ts?: string | null
          costo_base?: number
          cotizacion_id?: string
          created_at?: string
          estado?: string
          etiqueta?: string
          formato?: string
          id?: string
          impuestos?: number
          margen_pct?: number
          orden?: number
          presentada_ts?: string | null
          rechazada_ts?: string | null
          subtotal?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_opciones_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          aceptada_por_email: string | null
          aceptada_por_nombre: string | null
          aceptada_ts: string | null
          cliente_id: string | null
          condiciones: string | null
          created_at: string
          created_by: string
          estado: Database["public"]["Enums"]["estado_cotizacion"]
          fecha_emision: string
          fecha_vencimiento: string
          id: string
          impuestos: number
          moneda: Database["public"]["Enums"]["tipo_moneda"]
          notas: string | null
          numero: string
          opcion_actual_id: string | null
          ot_id: string | null
          rechazada_ts: string | null
          rechazo_motivo: string | null
          solicitud_cotizacion_id: string | null
          subtotal: number
          token_acceso: string | null
          total: number
          ubicacion_id: string | null
          updated_at: string
          validez_dias: number
        }
        Insert: {
          aceptada_por_email?: string | null
          aceptada_por_nombre?: string | null
          aceptada_ts?: string | null
          cliente_id?: string | null
          condiciones?: string | null
          created_at?: string
          created_by: string
          estado?: Database["public"]["Enums"]["estado_cotizacion"]
          fecha_emision?: string
          fecha_vencimiento?: string
          id?: string
          impuestos?: number
          moneda?: Database["public"]["Enums"]["tipo_moneda"]
          notas?: string | null
          numero: string
          opcion_actual_id?: string | null
          ot_id?: string | null
          rechazada_ts?: string | null
          rechazo_motivo?: string | null
          solicitud_cotizacion_id?: string | null
          subtotal?: number
          token_acceso?: string | null
          total?: number
          ubicacion_id?: string | null
          updated_at?: string
          validez_dias?: number
        }
        Update: {
          aceptada_por_email?: string | null
          aceptada_por_nombre?: string | null
          aceptada_ts?: string | null
          cliente_id?: string | null
          condiciones?: string | null
          created_at?: string
          created_by?: string
          estado?: Database["public"]["Enums"]["estado_cotizacion"]
          fecha_emision?: string
          fecha_vencimiento?: string
          id?: string
          impuestos?: number
          moneda?: Database["public"]["Enums"]["tipo_moneda"]
          notas?: string | null
          numero?: string
          opcion_actual_id?: string | null
          ot_id?: string | null
          rechazada_ts?: string | null
          rechazo_motivo?: string | null
          solicitud_cotizacion_id?: string | null
          subtotal?: number
          token_acceso?: string | null
          total?: number
          ubicacion_id?: string | null
          updated_at?: string
          validez_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_opcion_actual_fk"
            columns: ["opcion_actual_id"]
            isOneToOne: false
            referencedRelation: "cotizacion_opciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "cotizaciones_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_solicitud_cotizacion_id_fkey"
            columns: ["solicitud_cotizacion_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_cotizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_ubicacion_id_fkey"
            columns: ["ubicacion_id"]
            isOneToOne: false
            referencedRelation: "ubicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_venta: {
        Row: {
          created_at: string | null
          fecha: string
          id: string
          moneda: Database["public"]["Enums"]["tipo_moneda"]
          notas: string | null
          numero: string
          ot_id: string
          pdf_url: string | null
          saldo: number
          tipo: Database["public"]["Enums"]["tipo_documento_venta"]
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fecha: string
          id?: string
          moneda?: Database["public"]["Enums"]["tipo_moneda"]
          notas?: string | null
          numero: string
          ot_id: string
          pdf_url?: string | null
          saldo: number
          tipo: Database["public"]["Enums"]["tipo_documento_venta"]
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id?: string
          moneda?: Database["public"]["Enums"]["tipo_moneda"]
          notas?: string | null
          numero?: string
          ot_id?: string
          pdf_url?: string | null
          saldo?: number
          tipo?: Database["public"]["Enums"]["tipo_documento_venta"]
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_venta_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "documentos_venta_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          activo: boolean | null
          cliente_id: string | null
          codigo_qr: string
          costo_adquisicion: number | null
          created_at: string | null
          created_by: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_equipo"]
          fecha_compra: string | null
          fecha_garantia_fin: string | null
          id: string
          item_inventario_id: string | null
          marca: string | null
          modelo: string | null
          notas: string | null
          numero_serie: string | null
          proveedor_id: string | null
          tecnico_asignado_id: string | null
          ubicacion_actual: string | null
          ubicacion_cliente_id: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          cliente_id?: string | null
          codigo_qr: string
          costo_adquisicion?: number | null
          created_at?: string | null
          created_by: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_equipo"]
          fecha_compra?: string | null
          fecha_garantia_fin?: string | null
          id?: string
          item_inventario_id?: string | null
          marca?: string | null
          modelo?: string | null
          notas?: string | null
          numero_serie?: string | null
          proveedor_id?: string | null
          tecnico_asignado_id?: string | null
          ubicacion_actual?: string | null
          ubicacion_cliente_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          cliente_id?: string | null
          codigo_qr?: string
          costo_adquisicion?: number | null
          created_at?: string | null
          created_by?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_equipo"]
          fecha_compra?: string | null
          fecha_garantia_fin?: string | null
          id?: string
          item_inventario_id?: string | null
          marca?: string | null
          modelo?: string | null
          notas?: string | null
          numero_serie?: string | null
          proveedor_id?: string | null
          tecnico_asignado_id?: string | null
          ubicacion_actual?: string | null
          ubicacion_cliente_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_item_inventario_id_fkey"
            columns: ["item_inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_tecnico_asignado_id_fkey"
            columns: ["tecnico_asignado_id"]
            isOneToOne: false
            referencedRelation: "personal_fichas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_ubicacion_cliente_id_fkey"
            columns: ["ubicacion_cliente_id"]
            isOneToOne: false
            referencedRelation: "ubicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos_intervenciones: {
        Row: {
          created_at: string | null
          descripcion: string
          equipo_id: string
          estado_antes: string | null
          estado_despues: string | null
          evidencias_urls: Json | null
          fecha: string | null
          id: string
          observaciones: string | null
          ot_id: string | null
          registrado_por: string
          tecnico_id: string | null
          tipo: Database["public"]["Enums"]["tipo_intervencion_equipo"]
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          equipo_id: string
          estado_antes?: string | null
          estado_despues?: string | null
          evidencias_urls?: Json | null
          fecha?: string | null
          id?: string
          observaciones?: string | null
          ot_id?: string | null
          registrado_por: string
          tecnico_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_intervencion_equipo"]
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          equipo_id?: string
          estado_antes?: string | null
          estado_despues?: string | null
          evidencias_urls?: Json | null
          fecha?: string | null
          id?: string
          observaciones?: string | null
          ot_id?: string | null
          registrado_por?: string
          tecnico_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_intervencion_equipo"]
        }
        Relationships: [
          {
            foreignKeyName: "equipos_intervenciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_intervenciones_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "equipos_intervenciones_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_intervenciones_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "personal_fichas"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos_materiales: {
        Row: {
          activo: boolean | null
          cantidad: number
          created_at: string | null
          equipo_id: string
          fecha_asociacion: string | null
          id: string
          item_inventario_id: string
          notas: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          cantidad?: number
          created_at?: string | null
          equipo_id: string
          fecha_asociacion?: string | null
          id?: string
          item_inventario_id: string
          notas?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          cantidad?: number
          created_at?: string | null
          equipo_id?: string
          fecha_asociacion?: string | null
          id?: string
          item_inventario_id?: string
          notas?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_materiales_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_materiales_item_inventario_id_fkey"
            columns: ["item_inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos_movimientos: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          equipo_id: string
          fecha: string | null
          id: string
          notas: string | null
          ot_id: string | null
          registrado_por: string
          tecnico_id: string | null
          tipo: string
          ubicacion_destino: string | null
          ubicacion_origen: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          equipo_id: string
          fecha?: string | null
          id?: string
          notas?: string | null
          ot_id?: string | null
          registrado_por: string
          tecnico_id?: string | null
          tipo: string
          ubicacion_destino?: string | null
          ubicacion_origen?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          equipo_id?: string
          fecha?: string | null
          id?: string
          notas?: string | null
          ot_id?: string | null
          registrado_por?: string
          tecnico_id?: string | null
          tipo?: string
          ubicacion_destino?: string | null
          ubicacion_origen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_movimientos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_movimientos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_movimientos_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "equipos_movimientos_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_movimientos_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "personal_fichas"
            referencedColumns: ["id"]
          },
        ]
      }
      fases_proyecto: {
        Row: {
          created_at: string
          created_by: string
          estado: Database["public"]["Enums"]["estado_fase"]
          fecha_fin_estimada: string | null
          fecha_inicio: string | null
          id: string
          nombre: string
          orden: number
          proyecto_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          estado?: Database["public"]["Enums"]["estado_fase"]
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre: string
          orden?: number
          proyecto_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          estado?: Database["public"]["Enums"]["estado_fase"]
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre?: string
          orden?: number
          proyecto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fases_proyecto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      informes_finales: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          equipo_id: string | null
          especificaciones_equipo: Json
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
          cliente_id?: string | null
          created_at?: string | null
          equipo_id?: string | null
          especificaciones_equipo?: Json
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
          cliente_id?: string | null
          created_at?: string | null
          equipo_id?: string | null
          especificaciones_equipo?: Json
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
            foreignKeyName: "informes_finales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "informes_finales_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "informes_finales_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: true
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "informes_finales_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: true
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          activo: boolean | null
          categoria_id: string | null
          codigo: string
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          precio_compra: number | null
          precio_venta: number | null
          proveedor_id: string | null
          stock_actual: number | null
          stock_maximo: number | null
          stock_minimo: number | null
          tipo: Database["public"]["Enums"]["tipo_item_inventario"]
          ubicacion_bodega: string | null
          unidad_medida: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria_id?: string | null
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          precio_compra?: number | null
          precio_venta?: number | null
          proveedor_id?: string | null
          stock_actual?: number | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          tipo?: Database["public"]["Enums"]["tipo_item_inventario"]
          ubicacion_bodega?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria_id?: string | null
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          precio_compra?: number | null
          precio_venta?: number | null
          proveedor_id?: string | null
          stock_actual?: number | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          tipo?: Database["public"]["Enums"]["tipo_item_inventario"]
          ubicacion_bodega?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      items_orden_compra: {
        Row: {
          cantidad_recibida: number | null
          cantidad_solicitada: number
          created_at: string | null
          id: string
          item_id: string
          orden_id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad_recibida?: number | null
          cantidad_solicitada: number
          created_at?: string | null
          id?: string
          item_id: string
          orden_id: string
          precio_unitario: number
          subtotal: number
        }
        Update: {
          cantidad_recibida?: number | null
          cantidad_solicitada?: number
          created_at?: string | null
          id?: string
          item_id?: string
          orden_id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_orden_compra_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_orden_compra_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      items_solicitud_compra: {
        Row: {
          cantidad: number
          cantidad_en_oc: number
          costo_unitario_estimado: number | null
          id: string
          item_inventario_id: string
          proveedor_sugerido_id: string | null
          solicitud_compra_id: string
        }
        Insert: {
          cantidad: number
          cantidad_en_oc?: number
          costo_unitario_estimado?: number | null
          id?: string
          item_inventario_id: string
          proveedor_sugerido_id?: string | null
          solicitud_compra_id: string
        }
        Update: {
          cantidad?: number
          cantidad_en_oc?: number
          costo_unitario_estimado?: number | null
          id?: string
          item_inventario_id?: string
          proveedor_sugerido_id?: string | null
          solicitud_compra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_solicitud_compra_item_inventario_id_fkey"
            columns: ["item_inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_solicitud_compra_proveedor_sugerido_id_fkey"
            columns: ["proveedor_sugerido_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_solicitud_compra_solicitud_compra_id_fkey"
            columns: ["solicitud_compra_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          costo_unitario: number | null
          created_at: string | null
          id: string
          item_id: string
          notas: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          registrado_por: string
          stock_anterior: number
          stock_nuevo: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_inventario"]
        }
        Insert: {
          cantidad: number
          costo_unitario?: number | null
          created_at?: string | null
          id?: string
          item_id: string
          notas?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          registrado_por: string
          stock_anterior: number
          stock_nuevo: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_inventario"]
        }
        Update: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string | null
          id?: string
          item_id?: string
          notas?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          registrado_por?: string
          stock_anterior?: number
          stock_nuevo?: number
          tipo?: Database["public"]["Enums"]["tipo_movimiento_inventario"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_log: {
        Row: {
          asunto: string | null
          canal: string
          contenido: string | null
          created_at: string | null
          destinatario_email: string | null
          destinatario_user_id: string
          enviado_exitosamente: boolean | null
          error_mensaje: string | null
          id: string
          intentos: number | null
          metadata: Json | null
          ot_id: string | null
          tipo_evento: string
        }
        Insert: {
          asunto?: string | null
          canal: string
          contenido?: string | null
          created_at?: string | null
          destinatario_email?: string | null
          destinatario_user_id: string
          enviado_exitosamente?: boolean | null
          error_mensaje?: string | null
          id?: string
          intentos?: number | null
          metadata?: Json | null
          ot_id?: string | null
          tipo_evento: string
        }
        Update: {
          asunto?: string | null
          canal?: string
          contenido?: string | null
          created_at?: string | null
          destinatario_email?: string | null
          destinatario_user_id?: string
          enviado_exitosamente?: boolean | null
          error_mensaje?: string | null
          id?: string
          intentos?: number | null
          metadata?: Json | null
          ot_id?: string | null
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_log_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "notificaciones_log_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      oc_solicitudes_compra: {
        Row: {
          id: string
          orden_compra_id: string
          solicitud_compra_id: string
        }
        Insert: {
          id?: string
          orden_compra_id: string
          solicitud_compra_id: string
        }
        Update: {
          id?: string
          orden_compra_id?: string
          solicitud_compra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oc_solicitudes_compra_orden_compra_id_fkey"
            columns: ["orden_compra_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oc_solicitudes_compra_solicitud_compra_id_fkey"
            columns: ["solicitud_compra_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_compra: {
        Row: {
          created_at: string | null
          created_by: string
          estado: Database["public"]["Enums"]["estado_orden_compra"] | null
          fecha_emision: string
          fecha_entrega_esperada: string | null
          fecha_recepcion: string | null
          id: string
          impuestos: number | null
          moneda: Database["public"]["Enums"]["tipo_moneda"] | null
          notas: string | null
          numero: string
          proveedor_id: string
          subtotal: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          estado?: Database["public"]["Enums"]["estado_orden_compra"] | null
          fecha_emision?: string
          fecha_entrega_esperada?: string | null
          fecha_recepcion?: string | null
          id?: string
          impuestos?: number | null
          moneda?: Database["public"]["Enums"]["tipo_moneda"] | null
          notas?: string | null
          numero: string
          proveedor_id: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          estado?: Database["public"]["Enums"]["estado_orden_compra"] | null
          fecha_emision?: string
          fecha_entrega_esperada?: string | null
          fecha_recepcion?: string | null
          id?: string
          impuestos?: number | null
          moneda?: Database["public"]["Enums"]["tipo_moneda"] | null
          notas?: string | null
          numero?: string
          proveedor_id?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
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
          equipo_id: string | null
          estado: string
          fase_id: string | null
          fecha_programada_fin: string | null
          fecha_programada_inicio: string | null
          id: string
          numero: string
          prioridad: Database["public"]["Enums"]["prioridad_ot"] | null
          proyecto_id: string | null
          solicitud_cotizacion_id: string | null
          tarea_id: string | null
          tipo_trabajo: string
          trabajo_id: string | null
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
          equipo_id?: string | null
          estado?: string
          fase_id?: string | null
          fecha_programada_fin?: string | null
          fecha_programada_inicio?: string | null
          id?: string
          numero: string
          prioridad?: Database["public"]["Enums"]["prioridad_ot"] | null
          proyecto_id?: string | null
          solicitud_cotizacion_id?: string | null
          tarea_id?: string | null
          tipo_trabajo: string
          trabajo_id?: string | null
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
          equipo_id?: string | null
          estado?: string
          fase_id?: string | null
          fecha_programada_fin?: string | null
          fecha_programada_inicio?: string | null
          id?: string
          numero?: string
          prioridad?: Database["public"]["Enums"]["prioridad_ot"] | null
          proyecto_id?: string | null
          solicitud_cotizacion_id?: string | null
          tarea_id?: string | null
          tipo_trabajo?: string
          trabajo_id?: string | null
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
            foreignKeyName: "ordenes_servicio_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "fases_proyecto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_solicitud_cotizacion_id_fkey"
            columns: ["solicitud_cotizacion_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_cotizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_trabajo_id_fkey"
            columns: ["trabajo_id"]
            isOneToOne: false
            referencedRelation: "trabajos"
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
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "ot_estado_logs_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          created_at: string | null
          documento_id: string
          fecha: string
          id: string
          metodo: Database["public"]["Enums"]["metodo_pago"]
          monto: number
          notas: string | null
          referencia: string | null
          registrado_por_user_id: string
        }
        Insert: {
          created_at?: string | null
          documento_id: string
          fecha: string
          id?: string
          metodo: Database["public"]["Enums"]["metodo_pago"]
          monto: number
          notas?: string | null
          referencia?: string | null
          registrado_por_user_id: string
        }
        Update: {
          created_at?: string | null
          documento_id?: string
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"]
          monto?: number
          notas?: string | null
          referencia?: string | null
          registrado_por_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_venta"
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
      personal_fichas: {
        Row: {
          activo: boolean
          comentarios: string | null
          contacto_emergencia: Json | null
          created_at: string
          documentos_urls: Json | null
          domicilio: string | null
          escolaridad: string | null
          especialidad: string[] | null
          estado_civil: Database["public"]["Enums"]["estado_civil"] | null
          etiquetas: string[] | null
          fecha_ingreso: string
          fecha_termino: string | null
          id: string
          nombre_completo: string
          rol_operativo: Database["public"]["Enums"]["rol_operativo"]
          rut: string
          sexo: Database["public"]["Enums"]["sexo"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          comentarios?: string | null
          contacto_emergencia?: Json | null
          created_at?: string
          documentos_urls?: Json | null
          domicilio?: string | null
          escolaridad?: string | null
          especialidad?: string[] | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          etiquetas?: string[] | null
          fecha_ingreso?: string
          fecha_termino?: string | null
          id?: string
          nombre_completo: string
          rol_operativo?: Database["public"]["Enums"]["rol_operativo"]
          rut: string
          sexo?: Database["public"]["Enums"]["sexo"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          comentarios?: string | null
          contacto_emergencia?: Json | null
          created_at?: string
          documentos_urls?: Json | null
          domicilio?: string | null
          escolaridad?: string | null
          especialidad?: string[] | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          etiquetas?: string[] | null
          fecha_ingreso?: string
          fecha_termino?: string | null
          id?: string
          nombre_completo?: string
          rol_operativo?: Database["public"]["Enums"]["rol_operativo"]
          rut?: string
          sexo?: Database["public"]["Enums"]["sexo"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_ubicacion: {
        Row: {
          captured_at: string
          created_at: string | null
          estado_app: Database["public"]["Enums"]["estado_app"]
          id: string
          lat: number
          lng: number
          personal_id: string
          precision_m: number | null
        }
        Insert: {
          captured_at?: string
          created_at?: string | null
          estado_app?: Database["public"]["Enums"]["estado_app"]
          id?: string
          lat: number
          lng: number
          personal_id: string
          precision_m?: number | null
        }
        Update: {
          captured_at?: string
          created_at?: string | null
          estado_app?: Database["public"]["Enums"]["estado_app"]
          id?: string
          lat?: number
          lng?: number
          personal_id?: string
          precision_m?: number | null
        }
        Relationships: []
      }
      plan_pagos: {
        Row: {
          created_at: string
          documento_venta_id: string
          estado: string
          fecha_esperada: string | null
          id: string
          monto_esperado: number
          numero_cuota: number
          pago_id: string | null
        }
        Insert: {
          created_at?: string
          documento_venta_id: string
          estado?: string
          fecha_esperada?: string | null
          id?: string
          monto_esperado: number
          numero_cuota: number
          pago_id?: string | null
        }
        Update: {
          created_at?: string
          documento_venta_id?: string
          estado?: string
          fecha_esperada?: string | null
          id?: string
          monto_esperado?: number
          numero_cuota?: number
          pago_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_pagos_documento_venta_id_fkey"
            columns: ["documento_venta_id"]
            isOneToOne: false
            referencedRelation: "documentos_venta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_pagos_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_mantenimiento: {
        Row: {
          activo: boolean
          created_at: string
          equipo_id: string
          frecuencia: string
          id: string
          notas: string | null
          proxima_fecha: string
          ultimo_ot_id: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          equipo_id: string
          frecuencia: string
          id?: string
          notas?: string | null
          proxima_fecha: string
          ultimo_ot_id?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          equipo_id?: string
          frecuencia?: string
          id?: string
          notas?: string | null
          proxima_fecha?: string
          ultimo_ot_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_mantenimiento_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: true
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_mantenimiento_ultimo_ot_id_fkey"
            columns: ["ultimo_ot_id"]
            isOneToOne: false
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "planes_mantenimiento_ultimo_ot_id_fkey"
            columns: ["ultimo_ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_email: {
        Row: {
          activa: boolean | null
          asunto: string
          contenido_html: string
          created_at: string | null
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_plantilla_email"]
          updated_at: string | null
          variables_disponibles: string[] | null
        }
        Insert: {
          activa?: boolean | null
          asunto: string
          contenido_html: string
          created_at?: string | null
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_plantilla_email"]
          updated_at?: string | null
          variables_disponibles?: string[] | null
        }
        Update: {
          activa?: boolean | null
          asunto?: string
          contenido_html?: string
          created_at?: string | null
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_plantilla_email"]
          updated_at?: string | null
          variables_disponibles?: string[] | null
        }
        Relationships: []
      }
      presupuestos: {
        Row: {
          aprobado_por_contacto_id: string | null
          aprobado_ts: string | null
          costo_total: number | null
          cotizacion_id: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_presupuesto"]
          id: string
          impuestos: number
          insumos: number
          items: Json
          mano_obra: number
          margen_pct: number
          moneda: Database["public"]["Enums"]["tipo_moneda"]
          ot_id: string | null
          otros_costos: number
          pdf_url: string | null
          precio_venta_sugerido: number | null
          solicitud_cotizacion_id: string | null
          subtotal: number
          total: number
          updated_at: string | null
          validez_dias: number
        }
        Insert: {
          aprobado_por_contacto_id?: string | null
          aprobado_ts?: string | null
          costo_total?: number | null
          cotizacion_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          id?: string
          impuestos?: number
          insumos?: number
          items?: Json
          mano_obra?: number
          margen_pct?: number
          moneda?: Database["public"]["Enums"]["tipo_moneda"]
          ot_id?: string | null
          otros_costos?: number
          pdf_url?: string | null
          precio_venta_sugerido?: number | null
          solicitud_cotizacion_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          validez_dias?: number
        }
        Update: {
          aprobado_por_contacto_id?: string | null
          aprobado_ts?: string | null
          costo_total?: number | null
          cotizacion_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          id?: string
          impuestos?: number
          insumos?: number
          items?: Json
          mano_obra?: number
          margen_pct?: number
          moneda?: Database["public"]["Enums"]["tipo_moneda"]
          ot_id?: string | null
          otros_costos?: number
          pdf_url?: string | null
          precio_venta_sugerido?: number | null
          solicitud_cotizacion_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          validez_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_aprobado_por_contacto_id_fkey"
            columns: ["aprobado_por_contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: true
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "presupuestos_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: true
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_solicitud_cotizacion_id_fkey"
            columns: ["solicitud_cotizacion_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_cotizacion"
            referencedColumns: ["id"]
          },
        ]
      }
      project_cost_entries: {
        Row: {
          created_at: string
          descripcion: string
          fecha: string
          fuente: Database["public"]["Enums"]["fuente_costo"]
          id: string
          monto: number
          proyecto_id: string
          ref_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          fecha?: string
          fuente: Database["public"]["Enums"]["fuente_costo"]
          id?: string
          monto: number
          proyecto_id: string
          ref_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          fecha?: string
          fuente?: Database["public"]["Enums"]["fuente_costo"]
          id?: string
          monto?: number
          proyecto_id?: string
          ref_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_cost_entries_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string
          descripcion: string | null
          id: string
          nombre: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by: string
          descripcion?: string | null
          id?: string
          nombre: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean | null
          ciudad: string | null
          condiciones_pago:
            | Database["public"]["Enums"]["condiciones_pago"]
            | null
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          giro: string | null
          id: string
          nombre_fantasia: string | null
          notas: string | null
          razon_social: string
          region: string | null
          rut: string
          sitio_web: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          ciudad?: string | null
          condiciones_pago?:
            | Database["public"]["Enums"]["condiciones_pago"]
            | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          giro?: string | null
          id?: string
          nombre_fantasia?: string | null
          notas?: string | null
          razon_social: string
          region?: string | null
          rut: string
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          ciudad?: string | null
          condiciones_pago?:
            | Database["public"]["Enums"]["condiciones_pago"]
            | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          giro?: string | null
          id?: string
          nombre_fantasia?: string | null
          notas?: string | null
          razon_social?: string
          region?: string | null
          rut?: string
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proyectos: {
        Row: {
          cliente_id: string | null
          costo_real: number | null
          created_at: string | null
          created_by: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_proyecto"]
          etiquetas: string[] | null
          fecha_fin_estimada: string | null
          fecha_fin_real: string | null
          fecha_inicio: string | null
          id: string
          nombre: string
          notas: string | null
          presupuesto: number | null
          prioridad: Database["public"]["Enums"]["prioridad_tarea"] | null
          progreso: number | null
          responsable_id: string | null
          template_id: string | null
          trabajo_id: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          costo_real?: number | null
          created_at?: string | null
          created_by: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          etiquetas?: string[] | null
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre: string
          notas?: string | null
          presupuesto?: number | null
          prioridad?: Database["public"]["Enums"]["prioridad_tarea"] | null
          progreso?: number | null
          responsable_id?: string | null
          template_id?: string | null
          trabajo_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          costo_real?: number | null
          created_at?: string | null
          created_by?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          etiquetas?: string[] | null
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          presupuesto?: number | null
          prioridad?: Database["public"]["Enums"]["prioridad_tarea"] | null
          progreso?: number | null
          responsable_id?: string | null
          template_id?: string | null
          trabajo_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_fichas"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proyectos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_trabajo_id_fkey"
            columns: ["trabajo_id"]
            isOneToOne: false
            referencedRelation: "trabajos"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rutas_dia: {
        Row: {
          created_at: string | null
          fecha: string
          id: string
          paradas: Json | null
          personal_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fecha?: string
          id?: string
          paradas?: Json | null
          personal_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id?: string
          paradas?: Json | null
          personal_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      servicios: {
        Row: {
          activo: boolean | null
          codigo: string
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          created_at: string | null
          created_by: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_servicio"]
          etiquetas: string[] | null
          fecha_fin_contrato: string | null
          fecha_inicio_contrato: string | null
          frecuencia_facturacion:
            | Database["public"]["Enums"]["frecuencia_facturacion"]
            | null
          id: string
          moneda: Database["public"]["Enums"]["tipo_moneda"] | null
          monto_base: number | null
          nombre: string
          notas: string | null
          numero_contrato: string | null
          proveedor_id: string | null
          proyecto_id: string | null
          renovacion_automatica: boolean | null
          sla_tiempo_resolucion_horas: number | null
          sla_tiempo_respuesta_horas: number | null
          tipo: Database["public"]["Enums"]["tipo_servicio"]
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string | null
          created_by: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_servicio"]
          etiquetas?: string[] | null
          fecha_fin_contrato?: string | null
          fecha_inicio_contrato?: string | null
          frecuencia_facturacion?:
            | Database["public"]["Enums"]["frecuencia_facturacion"]
            | null
          id?: string
          moneda?: Database["public"]["Enums"]["tipo_moneda"] | null
          monto_base?: number | null
          nombre: string
          notas?: string | null
          numero_contrato?: string | null
          proveedor_id?: string | null
          proyecto_id?: string | null
          renovacion_automatica?: boolean | null
          sla_tiempo_resolucion_horas?: number | null
          sla_tiempo_respuesta_horas?: number | null
          tipo?: Database["public"]["Enums"]["tipo_servicio"]
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string | null
          created_by?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_servicio"]
          etiquetas?: string[] | null
          fecha_fin_contrato?: string | null
          fecha_inicio_contrato?: string | null
          frecuencia_facturacion?:
            | Database["public"]["Enums"]["frecuencia_facturacion"]
            | null
          id?: string
          moneda?: Database["public"]["Enums"]["tipo_moneda"] | null
          monto_base?: number | null
          nombre?: string
          notas?: string | null
          numero_contrato?: string | null
          proveedor_id?: string | null
          proyecto_id?: string | null
          renovacion_automatica?: boolean | null
          sla_tiempo_resolucion_horas?: number | null
          sla_tiempo_respuesta_horas?: number | null
          tipo?: Database["public"]["Enums"]["tipo_servicio"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicios_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_compra: {
        Row: {
          cliente_id: string
          cotizacion_id: string
          cotizacion_opcion_id: string
          created_at: string
          estado: string
          id: string
          notas: string | null
          numero: string
          revisado_por: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          cotizacion_id: string
          cotizacion_opcion_id: string
          created_at?: string
          estado?: string
          id?: string
          notas?: string | null
          numero: string
          revisado_por?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          cotizacion_id?: string
          cotizacion_opcion_id?: string
          created_at?: string
          estado?: string
          id?: string
          notas?: string | null
          numero?: string
          revisado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_compra_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_compra_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_compra_cotizacion_opcion_id_fkey"
            columns: ["cotizacion_opcion_id"]
            isOneToOne: false
            referencedRelation: "cotizacion_opciones"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_cotizacion: {
        Row: {
          archivos_adjuntos: Json
          cliente_id: string
          created_at: string
          descripcion_necesidad: string
          detalle_requerimiento: Json
          ejecutivo_id: string
          estado: string
          fecha_visita_tecnica: string | null
          id: string
          numero: string
          tipo_servicio: string | null
          ubicacion_id: string | null
          updated_at: string
        }
        Insert: {
          archivos_adjuntos?: Json
          cliente_id: string
          created_at?: string
          descripcion_necesidad: string
          detalle_requerimiento?: Json
          ejecutivo_id: string
          estado?: string
          fecha_visita_tecnica?: string | null
          id?: string
          numero: string
          tipo_servicio?: string | null
          ubicacion_id?: string | null
          updated_at?: string
        }
        Update: {
          archivos_adjuntos?: Json
          cliente_id?: string
          created_at?: string
          descripcion_necesidad?: string
          detalle_requerimiento?: Json
          ejecutivo_id?: string
          estado?: string
          fecha_visita_tecnica?: string | null
          id?: string
          numero?: string
          tipo_servicio?: string | null
          ubicacion_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_cotizacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_cotizacion_ubicacion_id_fkey"
            columns: ["ubicacion_id"]
            isOneToOne: false
            referencedRelation: "ubicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          adjuntos: Json | null
          asignado_a: string | null
          cost_entry_id: string | null
          costo_aplicado: number | null
          created_at: string | null
          created_by: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_tarea"]
          etiquetas: string[] | null
          fase_id: string | null
          fecha_completada: string | null
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          horas_estimadas: number | null
          horas_reales: number | null
          id: string
          orden: number | null
          prioridad: Database["public"]["Enums"]["prioridad_tarea"] | null
          proyecto_id: string
          tarea_padre_id: string | null
          task_type_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          adjuntos?: Json | null
          asignado_a?: string | null
          cost_entry_id?: string | null
          costo_aplicado?: number | null
          created_at?: string | null
          created_by: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_tarea"]
          etiquetas?: string[] | null
          fase_id?: string | null
          fecha_completada?: string | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          horas_estimadas?: number | null
          horas_reales?: number | null
          id?: string
          orden?: number | null
          prioridad?: Database["public"]["Enums"]["prioridad_tarea"] | null
          proyecto_id: string
          tarea_padre_id?: string | null
          task_type_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          adjuntos?: Json | null
          asignado_a?: string | null
          cost_entry_id?: string | null
          costo_aplicado?: number | null
          created_at?: string | null
          created_by?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_tarea"]
          etiquetas?: string[] | null
          fase_id?: string | null
          fecha_completada?: string | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          horas_estimadas?: number | null
          horas_reales?: number | null
          id?: string
          orden?: number | null
          prioridad?: Database["public"]["Enums"]["prioridad_tarea"] | null
          proyecto_id?: string
          tarea_padre_id?: string | null
          task_type_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "personal_fichas"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tareas_cost_entry_id_fkey"
            columns: ["cost_entry_id"]
            isOneToOne: false
            referencedRelation: "project_cost_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "fases_proyecto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_tarea_padre_id_fkey"
            columns: ["tarea_padre_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          activo: boolean
          costo_estandar: number
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          costo_estandar?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          costo_estandar?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_fases: {
        Row: {
          created_at: string
          duracion_dias: number | null
          id: string
          nombre: string
          orden: number
          template_id: string
        }
        Insert: {
          created_at?: string
          duracion_dias?: number | null
          id?: string
          nombre: string
          orden?: number
          template_id: string
        }
        Update: {
          created_at?: string
          duracion_dias?: number | null
          id?: string
          nombre?: string
          orden?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_fases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_tareas: {
        Row: {
          created_at: string
          descripcion: string | null
          duracion_dias: number | null
          id: string
          orden: number
          prioridad: Database["public"]["Enums"]["prioridad_tarea"]
          template_fase_id: string
          titulo: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          duracion_dias?: number | null
          id?: string
          orden?: number
          prioridad?: Database["public"]["Enums"]["prioridad_tarea"]
          template_fase_id: string
          titulo: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          duracion_dias?: number | null
          id?: string
          orden?: number
          prioridad?: Database["public"]["Enums"]["prioridad_tarea"]
          template_fase_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_tareas_template_fase_id_fkey"
            columns: ["template_fase_id"]
            isOneToOne: false
            referencedRelation: "template_fases"
            referencedColumns: ["id"]
          },
        ]
      }
      tiempos_reales: {
        Row: {
          asignacion_id: string | null
          created_at: string | null
          en_proceso_fin: string | null
          en_proceso_inicio: string | null
          en_ruta_fin: string | null
          en_ruta_inicio: string | null
          fecha_creacion: string
          id: string
          ot_id: string
          tiempo_respuesta_min: number | null
          tiempo_servicio_min: number | null
          updated_at: string | null
        }
        Insert: {
          asignacion_id?: string | null
          created_at?: string | null
          en_proceso_fin?: string | null
          en_proceso_inicio?: string | null
          en_ruta_fin?: string | null
          en_ruta_inicio?: string | null
          fecha_creacion: string
          id?: string
          ot_id: string
          tiempo_respuesta_min?: number | null
          tiempo_servicio_min?: number | null
          updated_at?: string | null
        }
        Update: {
          asignacion_id?: string | null
          created_at?: string | null
          en_proceso_fin?: string | null
          en_proceso_inicio?: string | null
          en_ruta_fin?: string | null
          en_ruta_inicio?: string | null
          fecha_creacion?: string
          id?: string
          ot_id?: string
          tiempo_respuesta_min?: number | null
          tiempo_servicio_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tiempos_reales_asignacion_id_fkey"
            columns: ["asignacion_id"]
            isOneToOne: false
            referencedRelation: "asignaciones_ot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiempos_reales_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "kpis_reportes"
            referencedColumns: ["ot_id"]
          },
          {
            foreignKeyName: "tiempos_reales_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      trabajos: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_trabajo"]
          fecha_fin_estimada: string | null
          fecha_inicio_estimada: string | null
          id: string
          nombre_trabajo: string
          oportunidad_id: string | null
          origen: string
          tipo_trabajo: Database["public"]["Enums"]["tipo_trabajo"]
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_trabajo"]
          fecha_fin_estimada?: string | null
          fecha_inicio_estimada?: string | null
          id?: string
          nombre_trabajo: string
          oportunidad_id?: string | null
          origen?: string
          tipo_trabajo?: Database["public"]["Enums"]["tipo_trabajo"]
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_trabajo"]
          fecha_fin_estimada?: string | null
          fecha_inicio_estimada?: string | null
          id?: string
          nombre_trabajo?: string
          oportunidad_id?: string | null
          origen?: string
          tipo_trabajo?: Database["public"]["Enums"]["tipo_trabajo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trabajos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ubicaciones: {
        Row: {
          activo: boolean | null
          alias: string
          ciudad: string
          cliente_id: string
          comuna: string
          created_at: string | null
          direccion: string
          es_principal: boolean | null
          horario_atencion: string | null
          id: string
          lat: number | null
          lng: number | null
          por_defecto: boolean | null
          referencia: string | null
          region: string
          tipo: Database["public"]["Enums"]["tipo_ubicacion"]
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          alias: string
          ciudad: string
          cliente_id: string
          comuna: string
          created_at?: string | null
          direccion: string
          es_principal?: boolean | null
          horario_atencion?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          por_defecto?: boolean | null
          referencia?: string | null
          region: string
          tipo: Database["public"]["Enums"]["tipo_ubicacion"]
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          alias?: string
          ciudad?: string
          cliente_id?: string
          comuna?: string
          created_at?: string | null
          direccion?: string
          es_principal?: boolean | null
          horario_atencion?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          por_defecto?: boolean | null
          referencia?: string | null
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
      user_notification_prefs: {
        Row: {
          created_at: string | null
          email_asignacion: boolean | null
          email_cambio_estado: boolean | null
          email_ot_creada: boolean | null
          email_recordatorio: boolean | null
          id: string
          push_asignacion: boolean | null
          push_cambio_estado: boolean | null
          push_recordatorio: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_asignacion?: boolean | null
          email_cambio_estado?: boolean | null
          email_ot_creada?: boolean | null
          email_recordatorio?: boolean | null
          id?: string
          push_asignacion?: boolean | null
          push_cambio_estado?: boolean | null
          push_recordatorio?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_asignacion?: boolean | null
          email_cambio_estado?: boolean | null
          email_ot_creada?: boolean | null
          email_recordatorio?: boolean | null
          id?: string
          push_asignacion?: boolean | null
          push_cambio_estado?: boolean | null
          push_recordatorio?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      kpis_reportes: {
        Row: {
          ciudad: string | null
          cliente_nombre: string | null
          cliente_razon_social: string | null
          comuna: string | null
          costos: number | null
          en_proceso_fin: string | null
          en_proceso_inicio: string | null
          en_ruta_inicio: string | null
          estado: string | null
          facturado: number | null
          fecha_creacion: string | null
          fecha_programada_inicio: string | null
          margen: number | null
          ot_id: string | null
          ot_numero: string | null
          personal_id: string | null
          region: string | null
          rol_en_ot: Database["public"]["Enums"]["rol_en_ot"] | null
          semaforo: string | null
          tiempo_respuesta_min: number | null
          tiempo_servicio_min: number | null
          tipo_trabajo: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_distancia_haversine: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calcular_semaforo_tiempo: {
        Args: { tiempo_servicio_min: number; tipo_trabajo: string }
        Returns: string
      }
      fn_aceptar_opcion: {
        Args: {
          p_montos?: number[]
          p_num_cuotas?: number
          p_opcion_id: string
        }
        Returns: Json
      }
      fn_convertir_sc_a_oc: {
        Args: { p_proveedor_id: string; p_sc_ids: string[] }
        Returns: string
      }
      fn_generar_opciones_cotizacion: {
        Args: { p_cotizacion_id: string }
        Returns: undefined
      }
      fn_obtener_iva_pct: { Args: never; Returns: number }
      fn_presentar_opcion: { Args: { p_opcion_id: string }; Returns: string }
      generar_codigo_equipo: { Args: never; Returns: string }
      generar_numero_cotizacion: { Args: never; Returns: string }
      generar_numero_documento: {
        Args: { _tipo: Database["public"]["Enums"]["tipo_documento_venta"] }
        Returns: string
      }
      generar_numero_oc: { Args: never; Returns: string }
      generar_numero_ot: { Args: never; Returns: string }
      generar_numero_solicitud_compra: { Args: never; Returns: string }
      generar_numero_solicitud_cotizacion: { Args: never; Returns: string }
      get_dashboard_metrics: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      limpiar_ubicaciones_antiguas: {
        Args: { _limite?: number }
        Returns: undefined
      }
      obtener_ultima_ubicacion: {
        Args: { _personal_id: string }
        Returns: {
          captured_at: string
          estado_app: Database["public"]["Enums"]["estado_app"]
          lat: number
          lng: number
          precision_m: number
        }[]
      }
      refresh_kpis_reportes: { Args: never; Returns: undefined }
      update_project_progress: {
        Args: { p_project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "cliente"
      canal_comunicacion: "email" | "telefono" | "whatsapp" | "nota"
      condiciones_pago: "contado" | "15d" | "30d" | "45d" | "60d" | "otro"
      estado_app: "offline" | "online" | "en_ruta" | "en_proceso"
      estado_civil:
        | "soltero"
        | "casado"
        | "viudo"
        | "divorciado"
        | "union_libre"
      estado_cliente: "activo" | "suspendido" | "inactivo"
      estado_cotizacion:
        | "borrador"
        | "en_revision"
        | "aceptada"
        | "rechazada"
        | "asignada_ot"
      estado_equipo:
        | "en_bodega"
        | "asignado_tecnico"
        | "instalado"
        | "en_mantenimiento"
        | "dado_de_baja"
      estado_fase: "pendiente" | "en_progreso" | "completada"
      estado_orden_compra:
        | "borrador"
        | "enviada"
        | "parcial"
        | "completada"
        | "cancelada"
      estado_presupuesto: "borrador" | "enviado" | "aprobado" | "rechazado"
      estado_proyecto:
        | "planificacion"
        | "en_progreso"
        | "pausado"
        | "completado"
        | "cancelado"
      estado_servicio: "activo" | "pausado" | "cancelado" | "finalizado"
      estado_tarea:
        | "pendiente"
        | "en_progreso"
        | "revision"
        | "completada"
        | "cancelada"
      estado_trabajo: "pendiente" | "en_ejecucion" | "finalizado" | "cancelado"
      estatus_comunicacion: "pendiente" | "resuelto"
      frecuencia_facturacion:
        | "unico"
        | "mensual"
        | "trimestral"
        | "semestral"
        | "anual"
      fuente_costo: "compra" | "servicio" | "tarea_estandar" | "ajuste"
      metodo_pago: "transferencia" | "tarjeta" | "efectivo" | "cheque" | "otro"
      prioridad_ot: "baja" | "media" | "alta" | "urgente"
      prioridad_tarea: "baja" | "media" | "alta" | "urgente"
      rol_en_ot: "tecnico" | "operario" | "despachador" | "otro"
      rol_operativo:
        | "tecnico"
        | "operario"
        | "despachador"
        | "supervisor"
        | "administrador"
        | "otro"
      segmento_cliente: "B2B" | "B2C" | "Mixto"
      sexo: "masculino" | "femenino" | "otro"
      sla_prioridad: "normal" | "prioritario" | "critico"
      tipo_cliente: "empresa" | "persona"
      tipo_contacto_empresa:
        | "administrador_sucursal"
        | "encargado_proyecto"
        | "otro"
      tipo_contacto_persona: "pareja" | "hijo" | "secundario" | "otro"
      tipo_documento_venta:
        | "boleta"
        | "factura"
        | "nota_credito"
        | "nota_debito"
        | "otro"
      tipo_intervencion_equipo:
        | "instalacion"
        | "mantenimiento_preventivo"
        | "mantenimiento_correctivo"
        | "cambio_equipo"
        | "retiro"
      tipo_item_inventario: "material" | "producto" | "servicio" | "equipo"
      tipo_moneda: "CLP" | "UF" | "USD"
      tipo_movimiento_inventario:
        | "entrada"
        | "salida"
        | "ajuste"
        | "transferencia"
      tipo_plantilla_email:
        | "ot_creada"
        | "asignacion_personal"
        | "cambio_estado"
        | "recordatorio_mantencion"
      tipo_servicio:
        | "mantencion"
        | "consultoria"
        | "soporte"
        | "desarrollo"
        | "instalacion"
        | "capacitacion"
        | "otro"
      tipo_trabajo: "simple" | "complejo" | "mantencion"
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
      canal_comunicacion: ["email", "telefono", "whatsapp", "nota"],
      condiciones_pago: ["contado", "15d", "30d", "45d", "60d", "otro"],
      estado_app: ["offline", "online", "en_ruta", "en_proceso"],
      estado_civil: ["soltero", "casado", "viudo", "divorciado", "union_libre"],
      estado_cliente: ["activo", "suspendido", "inactivo"],
      estado_cotizacion: [
        "borrador",
        "en_revision",
        "aceptada",
        "rechazada",
        "asignada_ot",
      ],
      estado_equipo: [
        "en_bodega",
        "asignado_tecnico",
        "instalado",
        "en_mantenimiento",
        "dado_de_baja",
      ],
      estado_fase: ["pendiente", "en_progreso", "completada"],
      estado_orden_compra: [
        "borrador",
        "enviada",
        "parcial",
        "completada",
        "cancelada",
      ],
      estado_presupuesto: ["borrador", "enviado", "aprobado", "rechazado"],
      estado_proyecto: [
        "planificacion",
        "en_progreso",
        "pausado",
        "completado",
        "cancelado",
      ],
      estado_servicio: ["activo", "pausado", "cancelado", "finalizado"],
      estado_tarea: [
        "pendiente",
        "en_progreso",
        "revision",
        "completada",
        "cancelada",
      ],
      estado_trabajo: ["pendiente", "en_ejecucion", "finalizado", "cancelado"],
      estatus_comunicacion: ["pendiente", "resuelto"],
      frecuencia_facturacion: [
        "unico",
        "mensual",
        "trimestral",
        "semestral",
        "anual",
      ],
      fuente_costo: ["compra", "servicio", "tarea_estandar", "ajuste"],
      metodo_pago: ["transferencia", "tarjeta", "efectivo", "cheque", "otro"],
      prioridad_ot: ["baja", "media", "alta", "urgente"],
      prioridad_tarea: ["baja", "media", "alta", "urgente"],
      rol_en_ot: ["tecnico", "operario", "despachador", "otro"],
      rol_operativo: [
        "tecnico",
        "operario",
        "despachador",
        "supervisor",
        "administrador",
        "otro",
      ],
      segmento_cliente: ["B2B", "B2C", "Mixto"],
      sexo: ["masculino", "femenino", "otro"],
      sla_prioridad: ["normal", "prioritario", "critico"],
      tipo_cliente: ["empresa", "persona"],
      tipo_contacto_empresa: [
        "administrador_sucursal",
        "encargado_proyecto",
        "otro",
      ],
      tipo_contacto_persona: ["pareja", "hijo", "secundario", "otro"],
      tipo_documento_venta: [
        "boleta",
        "factura",
        "nota_credito",
        "nota_debito",
        "otro",
      ],
      tipo_intervencion_equipo: [
        "instalacion",
        "mantenimiento_preventivo",
        "mantenimiento_correctivo",
        "cambio_equipo",
        "retiro",
      ],
      tipo_item_inventario: ["material", "producto", "servicio", "equipo"],
      tipo_moneda: ["CLP", "UF", "USD"],
      tipo_movimiento_inventario: [
        "entrada",
        "salida",
        "ajuste",
        "transferencia",
      ],
      tipo_plantilla_email: [
        "ot_creada",
        "asignacion_personal",
        "cambio_estado",
        "recordatorio_mantencion",
      ],
      tipo_servicio: [
        "mantencion",
        "consultoria",
        "soporte",
        "desarrollo",
        "instalacion",
        "capacitacion",
        "otro",
      ],
      tipo_trabajo: ["simple", "complejo", "mantencion"],
      tipo_ubicacion: ["sucursal", "domicilio"],
    },
  },
} as const
