
-- 1) categorias_inventario: parent column + self-parent guard
ALTER TABLE public.categorias_inventario
  ADD COLUMN IF NOT EXISTS categoria_padre_id uuid REFERENCES public.categorias_inventario(id);

ALTER TABLE public.categorias_inventario
  DROP CONSTRAINT IF EXISTS categorias_inventario_no_self_parent;
ALTER TABLE public.categorias_inventario
  ADD CONSTRAINT categorias_inventario_no_self_parent
  CHECK (categoria_padre_id IS NULL OR categoria_padre_id <> id);

-- 2) cotizaciones: new columns
ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS solicitud_cotizacion_id uuid REFERENCES public.solicitudes_cotizacion(id),
  ADD COLUMN IF NOT EXISTS opcion_actual_id uuid;

-- 3) cotizacion_opciones table
CREATE TABLE public.cotizacion_opciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  etiqueta text NOT NULL CHECK (etiqueta IN ('A','B','C')),
  orden int NOT NULL,
  margen_pct numeric NOT NULL,
  costo_base numeric NOT NULL DEFAULT 0,
  subtotal numeric GENERATED ALWAYS AS (costo_base * (1 + margen_pct/100)) STORED,
  impuestos numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  formato text NOT NULL DEFAULT 'items_por_categoria'
    CHECK (formato IN ('categorias','items_por_categoria','items_por_categoria_padre')),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','presentada','aceptada','rechazada','descartada')),
  presentada_ts timestamptz,
  aceptada_ts timestamptz,
  rechazada_ts timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cotizacion_id, etiqueta)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotizacion_opciones TO authenticated;
GRANT ALL ON public.cotizacion_opciones TO service_role;

ALTER TABLE public.cotizacion_opciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver opciones de cotizacion"
  ON public.cotizacion_opciones FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear opciones de cotizacion"
  ON public.cotizacion_opciones FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar opciones de cotizacion"
  ON public.cotizacion_opciones FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar opciones de cotizacion"
  ON public.cotizacion_opciones FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 4) Pending FK from cotizaciones.opcion_actual_id
ALTER TABLE public.cotizaciones
  ADD CONSTRAINT cotizaciones_opcion_actual_fk
  FOREIGN KEY (opcion_actual_id) REFERENCES public.cotizacion_opciones(id);
