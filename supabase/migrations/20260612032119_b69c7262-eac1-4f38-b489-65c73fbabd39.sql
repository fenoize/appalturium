
-- Hacer ot_id opcional
ALTER TABLE public.presupuestos ALTER COLUMN ot_id DROP NOT NULL;

-- Agregar cotizacion_id
ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS cotizacion_id uuid REFERENCES public.cotizaciones(id) ON DELETE CASCADE;

-- Nuevos campos de costeo
ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS otros_costos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margen_pct numeric NOT NULL DEFAULT 30;

-- Columnas generadas (costo total y precio venta sugerido)
ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS costo_total numeric
    GENERATED ALWAYS AS (COALESCE(insumos,0) + COALESCE(mano_obra,0) + COALESCE(otros_costos,0)) STORED;

ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS precio_venta_sugerido numeric
    GENERATED ALWAYS AS (
      (COALESCE(insumos,0) + COALESCE(mano_obra,0) + COALESCE(otros_costos,0))
      * (1 + COALESCE(margen_pct,0)/100)
    ) STORED;

-- Validación: debe estar ligado a cotización u OT
ALTER TABLE public.presupuestos
  DROP CONSTRAINT IF EXISTS presupuestos_link_check;
ALTER TABLE public.presupuestos
  ADD CONSTRAINT presupuestos_link_check
  CHECK (cotizacion_id IS NOT NULL OR ot_id IS NOT NULL);

-- Único presupuesto por cotización
CREATE UNIQUE INDEX IF NOT EXISTS presupuestos_cotizacion_unique
  ON public.presupuestos(cotizacion_id) WHERE cotizacion_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS presupuestos_cotizacion_idx
  ON public.presupuestos(cotizacion_id);
