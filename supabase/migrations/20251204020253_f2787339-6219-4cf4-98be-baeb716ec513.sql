-- Enum para estado de orden de compra
CREATE TYPE public.estado_orden_compra AS ENUM ('borrador', 'enviada', 'parcial', 'completada', 'cancelada');

-- Enum para tipo de movimiento de inventario
CREATE TYPE public.tipo_movimiento_inventario AS ENUM ('entrada', 'salida', 'ajuste', 'transferencia');

-- Enum para tipo de item de inventario
CREATE TYPE public.tipo_item_inventario AS ENUM ('material', 'producto', 'servicio');

-- Tabla de proveedores
CREATE TABLE public.proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL UNIQUE,
  razon_social TEXT NOT NULL,
  nombre_fantasia TEXT,
  giro TEXT,
  direccion TEXT,
  ciudad TEXT,
  region TEXT,
  telefono TEXT,
  email TEXT,
  sitio_web TEXT,
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  contacto_email TEXT,
  condiciones_pago public.condiciones_pago DEFAULT 'contado',
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de categorías de inventario
CREATE TABLE public.categorias_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  color TEXT DEFAULT '#6366f1',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla principal de inventario
CREATE TABLE public.inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo public.tipo_item_inventario NOT NULL DEFAULT 'material',
  categoria_id UUID REFERENCES public.categorias_inventario(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
  unidad_medida TEXT DEFAULT 'unidad',
  precio_compra NUMERIC(12,2) DEFAULT 0,
  precio_venta NUMERIC(12,2) DEFAULT 0,
  stock_actual NUMERIC(12,2) DEFAULT 0,
  stock_minimo NUMERIC(12,2) DEFAULT 0,
  stock_maximo NUMERIC(12,2),
  ubicacion_bodega TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de movimientos de inventario
CREATE TABLE public.movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  tipo public.tipo_movimiento_inventario NOT NULL,
  cantidad NUMERIC(12,2) NOT NULL,
  stock_anterior NUMERIC(12,2) NOT NULL,
  stock_nuevo NUMERIC(12,2) NOT NULL,
  costo_unitario NUMERIC(12,2),
  referencia_tipo TEXT,
  referencia_id UUID,
  notas TEXT,
  registrado_por UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de órdenes de compra
CREATE TABLE public.ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
  estado public.estado_orden_compra DEFAULT 'borrador',
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_esperada DATE,
  fecha_recepcion DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  impuestos NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  moneda public.tipo_moneda DEFAULT 'CLP',
  notas TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de items de orden de compra
CREATE TABLE public.items_orden_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE RESTRICT,
  cantidad_solicitada NUMERIC(12,2) NOT NULL,
  cantidad_recibida NUMERIC(12,2) DEFAULT 0,
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_orden_compra ENABLE ROW LEVEL SECURITY;

-- Políticas para proveedores
CREATE POLICY "Admins y supervisors pueden gestionar proveedores"
ON public.proveedores FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Todos autenticados pueden ver proveedores activos"
ON public.proveedores FOR SELECT
USING (activo = true AND auth.uid() IS NOT NULL);

-- Políticas para categorias_inventario
CREATE POLICY "Admins y supervisors pueden gestionar categorías"
ON public.categorias_inventario FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Todos autenticados pueden ver categorías activas"
ON public.categorias_inventario FOR SELECT
USING (activa = true AND auth.uid() IS NOT NULL);

-- Políticas para inventario
CREATE POLICY "Admins y supervisors pueden gestionar inventario"
ON public.inventario FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Todos autenticados pueden ver inventario activo"
ON public.inventario FOR SELECT
USING (activo = true AND auth.uid() IS NOT NULL);

-- Políticas para movimientos_inventario
CREATE POLICY "Admins y supervisors pueden gestionar movimientos"
ON public.movimientos_inventario FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Usuarios pueden ver movimientos"
ON public.movimientos_inventario FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Políticas para ordenes_compra
CREATE POLICY "Admins y supervisors pueden gestionar órdenes de compra"
ON public.ordenes_compra FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Usuarios pueden ver órdenes de compra"
ON public.ordenes_compra FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Políticas para items_orden_compra
CREATE POLICY "Admins y supervisors pueden gestionar items de OC"
ON public.items_orden_compra FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Usuarios pueden ver items de OC"
ON public.items_orden_compra FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Triggers para updated_at
CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_inventario_updated_at
  BEFORE UPDATE ON public.categorias_inventario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventario_updated_at
  BEFORE UPDATE ON public.inventario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordenes_compra_updated_at
  BEFORE UPDATE ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función para generar número de orden de compra
CREATE OR REPLACE FUNCTION public.generar_numero_oc()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anio TEXT;
  secuencia TEXT;
  contador INTEGER;
BEGIN
  anio := EXTRACT(YEAR FROM now())::TEXT;
  SELECT COUNT(*) + 1 INTO contador
  FROM public.ordenes_compra
  WHERE EXTRACT(YEAR FROM fecha_emision) = EXTRACT(YEAR FROM now());
  secuencia := LPAD(contador::TEXT, 6, '0');
  RETURN 'OC-' || anio || '-' || secuencia;
END;
$$;

-- Función para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_stock_inventario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.inventario
  SET stock_actual = NEW.stock_nuevo,
      updated_at = now()
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_actualizar_stock
  AFTER INSERT ON public.movimientos_inventario
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_inventario();

-- Insertar algunas categorías por defecto
INSERT INTO public.categorias_inventario (nombre, descripcion, color) VALUES
('Repuestos', 'Repuestos y partes de equipos', '#ef4444'),
('Materiales', 'Materiales de instalación y consumibles', '#3b82f6'),
('Herramientas', 'Herramientas y equipos de trabajo', '#22c55e'),
('Servicios', 'Servicios profesionales y mano de obra', '#f59e0b');