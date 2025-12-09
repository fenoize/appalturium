-- Create enum for service status
CREATE TYPE estado_servicio AS ENUM ('activo', 'pausado', 'cancelado', 'finalizado');

-- Create enum for service type
CREATE TYPE tipo_servicio AS ENUM ('mantencion', 'consultoria', 'soporte', 'desarrollo', 'instalacion', 'capacitacion', 'otro');

-- Create enum for billing frequency
CREATE TYPE frecuencia_facturacion AS ENUM ('unico', 'mensual', 'trimestral', 'semestral', 'anual');

-- Create servicios table
CREATE TABLE public.servicios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo tipo_servicio NOT NULL DEFAULT 'otro',
  proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
  proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE SET NULL,
  estado estado_servicio NOT NULL DEFAULT 'activo',
  
  -- Contract fields
  numero_contrato TEXT,
  fecha_inicio_contrato DATE,
  fecha_fin_contrato DATE,
  renovacion_automatica BOOLEAN DEFAULT false,
  
  -- Billing fields
  frecuencia_facturacion frecuencia_facturacion DEFAULT 'mensual',
  monto_base NUMERIC DEFAULT 0,
  moneda tipo_moneda DEFAULT 'CLP',
  
  -- SLA fields
  sla_tiempo_respuesta_horas INTEGER,
  sla_tiempo_resolucion_horas INTEGER,
  
  -- Additional fields
  contacto_nombre TEXT,
  contacto_email TEXT,
  contacto_telefono TEXT,
  notas TEXT,
  etiquetas TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create index for better query performance
CREATE INDEX idx_servicios_proveedor ON public.servicios(proveedor_id);
CREATE INDEX idx_servicios_proyecto ON public.servicios(proyecto_id);
CREATE INDEX idx_servicios_estado ON public.servicios(estado);
CREATE INDEX idx_servicios_tipo ON public.servicios(tipo);

-- Enable RLS
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins y supervisors pueden gestionar servicios"
  ON public.servicios
  FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Todos autenticados pueden ver servicios activos"
  ON public.servicios
  FOR SELECT
  USING (activo = true AND auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_servicios_updated_at
  BEFORE UPDATE ON public.servicios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();