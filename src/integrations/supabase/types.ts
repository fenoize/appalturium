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
          color: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
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
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_presupuesto"]
          id: string
          impuestos: number
          insumos: number
          items: Json
          mano_obra: number
          moneda: Database["public"]["Enums"]["tipo_moneda"]
          ot_id: string
          pdf_url: string | null
          subtotal: number
          total: number
          updated_at: string | null
          validez_dias: number
        }
        Insert: {
          aprobado_por_contacto_id?: string | null
          aprobado_ts?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          id?: string
          impuestos?: number
          insumos?: number
          items?: Json
          mano_obra?: number
          moneda?: Database["public"]["Enums"]["tipo_moneda"]
          ot_id: string
          pdf_url?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          validez_dias?: number
        }
        Update: {
          aprobado_por_contacto_id?: string | null
          aprobado_ts?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          id?: string
          impuestos?: number
          insumos?: number
          items?: Json
          mano_obra?: number
          moneda?: Database["public"]["Enums"]["tipo_moneda"]
          ot_id?: string
          pdf_url?: string | null
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
        ]
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
      tareas: {
        Row: {
          adjuntos: Json | null
          asignado_a: string | null
          created_at: string | null
          created_by: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_tarea"]
          etiquetas: string[] | null
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
          titulo: string
          updated_at: string | null
        }
        Insert: {
          adjuntos?: Json | null
          asignado_a?: string | null
          created_at?: string | null
          created_by: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_tarea"]
          etiquetas?: string[] | null
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
          titulo: string
          updated_at?: string | null
        }
        Update: {
          adjuntos?: Json | null
          asignado_a?: string | null
          created_at?: string | null
          created_by?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_tarea"]
          etiquetas?: string[] | null
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
      generar_numero_documento: {
        Args: { _tipo: Database["public"]["Enums"]["tipo_documento_venta"] }
        Returns: string
      }
      generar_numero_oc: { Args: never; Returns: string }
      generar_numero_ot: { Args: never; Returns: string }
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
      estado_tarea:
        | "pendiente"
        | "en_progreso"
        | "revision"
        | "completada"
        | "cancelada"
      estatus_comunicacion: "pendiente" | "resuelto"
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
      tipo_item_inventario: "material" | "producto" | "servicio"
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
      estado_tarea: [
        "pendiente",
        "en_progreso",
        "revision",
        "completada",
        "cancelada",
      ],
      estatus_comunicacion: ["pendiente", "resuelto"],
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
      tipo_item_inventario: ["material", "producto", "servicio"],
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
      tipo_ubicacion: ["sucursal", "domicilio"],
    },
  },
} as const
