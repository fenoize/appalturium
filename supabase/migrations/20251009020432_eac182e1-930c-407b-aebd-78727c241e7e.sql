-- Crear enums para facturación
CREATE TYPE public.estado_presupuesto AS ENUM ('borrador', 'enviado', 'aprobado', 'rechazado');
CREATE TYPE public.tipo_documento_venta AS ENUM ('boleta', 'factura', 'nota_credito', 'nota_debito', 'otro');
CREATE TYPE public.metodo_pago AS ENUM ('transferencia', 'tarjeta', 'efectivo', 'cheque', 'otro');

-- Tabla presupuestos
CREATE TABLE public.presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id UUID NOT NULL UNIQUE REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  mano_obra NUMERIC(10,2) NOT NULL DEFAULT 0,
  insumos NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  impuestos NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  validez_dias INTEGER NOT NULL DEFAULT 30,
  estado public.estado_presupuesto NOT NULL DEFAULT 'borrador',
  aprobado_por_contacto_id UUID REFERENCES public.contactos(id),
  aprobado_ts TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger para updated_at en presupuestos
CREATE TRIGGER update_presupuestos_updated_at
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla documentos_venta
CREATE TABLE public.documentos_venta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  tipo public.tipo_documento_venta NOT NULL,
  numero TEXT NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  saldo NUMERIC(10,2) NOT NULL,
  pdf_url TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger para updated_at en documentos_venta
CREATE TRIGGER update_documentos_venta_updated_at
  BEFORE UPDATE ON public.documentos_venta
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla pagos
CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES public.documentos_venta(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  metodo public.metodo_pago NOT NULL,
  referencia TEXT,
  notas TEXT,
  registrado_por_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Función para actualizar saldo de documento al registrar pago
CREATE OR REPLACE FUNCTION public.actualizar_saldo_documento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.documentos_venta
  SET saldo = saldo - NEW.monto,
      updated_at = now()
  WHERE id = NEW.documento_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para actualizar saldo después de insertar pago
CREATE TRIGGER trigger_actualizar_saldo_documento
  AFTER INSERT ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_saldo_documento();

-- Función para generar número de documento
CREATE OR REPLACE FUNCTION public.generar_numero_documento(_tipo public.tipo_documento_venta)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefijo TEXT;
  anio TEXT;
  secuencia TEXT;
  contador INTEGER;
BEGIN
  -- Determinar prefijo según tipo
  CASE _tipo
    WHEN 'boleta' THEN prefijo := 'BOL';
    WHEN 'factura' THEN prefijo := 'FAC';
    WHEN 'nota_credito' THEN prefijo := 'NCR';
    WHEN 'nota_debito' THEN prefijo := 'NDB';
    ELSE prefijo := 'DOC';
  END CASE;
  
  anio := EXTRACT(YEAR FROM now())::TEXT;
  
  -- Contar documentos del mismo tipo en el año actual
  SELECT COUNT(*) + 1 INTO contador
  FROM public.documentos_venta
  WHERE tipo = _tipo
    AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM now());
  
  secuencia := LPAD(contador::TEXT, 6, '0');
  
  RETURN prefijo || '-' || anio || '-' || secuencia;
END;
$$;

-- Función para bloquear modificación de presupuesto aprobado
CREATE OR REPLACE FUNCTION public.bloquear_presupuesto_aprobado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.estado = 'aprobado' AND (
    NEW.items IS DISTINCT FROM OLD.items OR
    NEW.mano_obra IS DISTINCT FROM OLD.mano_obra OR
    NEW.insumos IS DISTINCT FROM OLD.insumos OR
    NEW.subtotal IS DISTINCT FROM OLD.subtotal OR
    NEW.impuestos IS DISTINCT FROM OLD.impuestos OR
    NEW.total IS DISTINCT FROM OLD.total
  ) THEN
    RAISE EXCEPTION 'No se puede modificar montos o items de un presupuesto aprobado';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para bloquear modificación de presupuesto aprobado
CREATE TRIGGER trigger_bloquear_presupuesto_aprobado
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION public.bloquear_presupuesto_aprobado();

-- RLS para presupuestos
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y supervisors pueden gestionar presupuestos"
  ON public.presupuestos
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Personal asignado puede ver presupuestos de sus OT"
  ON public.presupuestos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.asignaciones_ot
      WHERE asignaciones_ot.ot_id = presupuestos.ot_id
        AND asignaciones_ot.personal_id = auth.uid()
    )
  );

CREATE POLICY "Personal asignado puede insertar presupuestos de sus OT"
  ON public.presupuestos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.asignaciones_ot
      WHERE asignaciones_ot.ot_id = presupuestos.ot_id
        AND asignaciones_ot.personal_id = auth.uid()
    )
  );

CREATE POLICY "Personal asignado puede actualizar presupuestos borradores de sus OT"
  ON public.presupuestos
  FOR UPDATE
  USING (
    estado = 'borrador' AND
    EXISTS (
      SELECT 1 FROM public.asignaciones_ot
      WHERE asignaciones_ot.ot_id = presupuestos.ot_id
        AND asignaciones_ot.personal_id = auth.uid()
    )
  );

CREATE POLICY "Clientes pueden ver presupuestos de sus OT"
  ON public.presupuestos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_servicio os
      JOIN public.clientes c ON c.id = os.cliente_id
      WHERE os.id = presupuestos.ot_id
        AND c.user_id = auth.uid()
    )
  );

-- RLS para documentos_venta
ALTER TABLE public.documentos_venta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y supervisors pueden gestionar documentos"
  ON public.documentos_venta
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Personal asignado puede ver documentos de sus OT"
  ON public.documentos_venta
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.asignaciones_ot
      WHERE asignaciones_ot.ot_id = documentos_venta.ot_id
        AND asignaciones_ot.personal_id = auth.uid()
    )
  );

CREATE POLICY "Clientes pueden ver documentos de sus OT"
  ON public.documentos_venta
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_servicio os
      JOIN public.clientes c ON c.id = os.cliente_id
      WHERE os.id = documentos_venta.ot_id
        AND c.user_id = auth.uid()
    )
  );

-- RLS para pagos
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y supervisors pueden gestionar pagos"
  ON public.pagos
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Personal asignado puede ver pagos de sus OT"
  ON public.pagos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documentos_venta dv
      JOIN public.asignaciones_ot a ON a.ot_id = dv.ot_id
      WHERE dv.id = pagos.documento_id
        AND a.personal_id = auth.uid()
    )
  );

CREATE POLICY "Clientes pueden ver pagos de sus documentos"
  ON public.pagos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documentos_venta dv
      JOIN public.ordenes_servicio os ON os.id = dv.ot_id
      JOIN public.clientes c ON c.id = os.cliente_id
      WHERE dv.id = pagos.documento_id
        AND c.user_id = auth.uid()
    )
  );