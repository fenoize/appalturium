
CREATE TABLE public.plan_pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_venta_id uuid NOT NULL REFERENCES public.documentos_venta(id) ON DELETE CASCADE,
  numero_cuota int NOT NULL CHECK (numero_cuota IN (1,2)),
  monto_esperado numeric NOT NULL CHECK (monto_esperado > 0),
  fecha_esperada date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','vencida')),
  pago_id uuid REFERENCES public.pagos(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (documento_venta_id, numero_cuota)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_pagos TO authenticated;
GRANT ALL ON public.plan_pagos TO service_role;

ALTER TABLE public.plan_pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver cuotas"
  ON public.plan_pagos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden crear cuotas"
  ON public.plan_pagos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar cuotas"
  ON public.plan_pagos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden eliminar cuotas"
  ON public.plan_pagos FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trigger: when a payment is registered and linked to an installment, mark it as paid.
CREATE OR REPLACE FUNCTION public.actualizar_estado_cuota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.plan_pagos
  SET estado = 'pagada',
      pago_id = NEW.id
  WHERE pago_id = NEW.id
    AND estado <> 'pagada';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_actualizar_estado_cuota ON public.pagos;
CREATE TRIGGER trg_actualizar_estado_cuota
  AFTER INSERT ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_estado_cuota();
