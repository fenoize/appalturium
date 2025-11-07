-- Agregar tipos enum necesarios
DO $$ BEGIN
  CREATE TYPE condiciones_pago AS ENUM ('contado', '15d', '30d', '45d', '60d', 'otro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE segmento_cliente AS ENUM ('B2B', 'B2C', 'Mixto');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_cliente AS ENUM ('activo', 'suspendido', 'inactivo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sla_prioridad AS ENUM ('normal', 'prioritario', 'critico');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Agregar columnas faltantes a la tabla clientes
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS sitio_web TEXT,
ADD COLUMN IF NOT EXISTS industria TEXT,
ADD COLUMN IF NOT EXISTS segmento segmento_cliente DEFAULT 'B2B',
ADD COLUMN IF NOT EXISTS estado_cliente estado_cliente DEFAULT 'activo',
ADD COLUMN IF NOT EXISTS condiciones_pago condiciones_pago DEFAULT 'contado',
ADD COLUMN IF NOT EXISTS credito_aprobado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credito_monto_max NUMERIC,
ADD COLUMN IF NOT EXISTS lista_precios TEXT,
ADD COLUMN IF NOT EXISTS descuento_acordado_pct NUMERIC,
ADD COLUMN IF NOT EXISTS sla_prioridad sla_prioridad DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS noti_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS noti_whatsapp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS noti_resumen_mensual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS creado_por_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS actualizado_por_user_id UUID REFERENCES auth.users(id);

-- Agregar columnas faltantes a la tabla ubicaciones
ALTER TABLE public.ubicaciones
ADD COLUMN IF NOT EXISTS referencia TEXT,
ADD COLUMN IF NOT EXISTS es_principal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS horario_atencion TEXT,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Agregar columnas faltantes a la tabla contactos
ALTER TABLE public.contactos
ADD COLUMN IF NOT EXISTS recibe_notificaciones BOOLEAN DEFAULT true;

-- Crear función para asegurar solo una ubicación principal por cliente
CREATE OR REPLACE FUNCTION public.ensure_one_default_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.por_defecto = true THEN
    UPDATE public.ubicaciones
    SET por_defecto = false
    WHERE cliente_id = NEW.cliente_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger para ubicaciones por_defecto
DROP TRIGGER IF EXISTS trigger_ensure_one_default_location ON public.ubicaciones;
CREATE TRIGGER trigger_ensure_one_default_location
BEFORE INSERT OR UPDATE ON public.ubicaciones
FOR EACH ROW
EXECUTE FUNCTION public.ensure_one_default_location();

-- Crear función para asegurar solo una ubicación es_principal por cliente  
CREATE OR REPLACE FUNCTION public.ensure_one_principal_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.es_principal = true THEN
    UPDATE public.ubicaciones
    SET es_principal = false
    WHERE cliente_id = NEW.cliente_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger para ubicaciones es_principal
DROP TRIGGER IF EXISTS trigger_ensure_one_principal_location ON public.ubicaciones;
CREATE TRIGGER trigger_ensure_one_principal_location
BEFORE INSERT OR UPDATE ON public.ubicaciones
FOR EACH ROW
EXECUTE FUNCTION public.ensure_one_principal_location();

-- Crear función para asegurar solo un contacto principal por cliente
CREATE OR REPLACE FUNCTION public.ensure_one_principal_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.es_principal = true THEN
    UPDATE public.contactos
    SET es_principal = false
    WHERE cliente_id = NEW.cliente_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger para contactos principal
DROP TRIGGER IF EXISTS trigger_ensure_one_principal_contact ON public.contactos;
CREATE TRIGGER trigger_ensure_one_principal_contact
BEFORE INSERT OR UPDATE ON public.contactos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_one_principal_contact();

-- Crear tabla clientes_documentos
CREATE TABLE IF NOT EXISTS public.clientes_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('contrato', 'certificacion', 'orden_compra', 'otro')),
  titulo TEXT NOT NULL,
  archivo_url TEXT,
  vence_el DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_clientes_documentos_cliente_id ON public.clientes_documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON public.clientes(estado_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_segmento ON public.clientes(segmento);
CREATE INDEX IF NOT EXISTS idx_clientes_industria ON public.clientes(industria);

-- Habilitar RLS para clientes_documentos
ALTER TABLE public.clientes_documentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes_documentos
CREATE POLICY "Admins y supervisors pueden gestionar documentos de clientes"
ON public.clientes_documentos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Clientes pueden ver sus propios documentos"
ON public.clientes_documentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = clientes_documentos.cliente_id 
    AND c.user_id = auth.uid()
  )
);