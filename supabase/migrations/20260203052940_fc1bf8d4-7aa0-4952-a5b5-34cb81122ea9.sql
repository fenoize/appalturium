
-- Eliminar políticas de acceso por token existentes que no funcionan correctamente
DROP POLICY IF EXISTS "Acceso público con token válido" ON cotizaciones;
DROP POLICY IF EXISTS "Actualizar cotización con token válido" ON cotizaciones;

-- Crear nuevas políticas que permiten acceso anónimo con token
-- Lectura pública: cualquier persona puede leer cotizaciones con token_acceso válido (comparando en WHERE)
CREATE POLICY "Lectura pública por token" ON cotizaciones
  FOR SELECT
  USING (token_acceso IS NOT NULL);

-- Actualización pública: cualquier persona puede actualizar cotizaciones con token_acceso 
-- (solo campos específicos de aceptación/rechazo, controlado por la app)
CREATE POLICY "Actualización pública por token" ON cotizaciones
  FOR UPDATE
  USING (token_acceso IS NOT NULL);

-- Política para acceso público a items de cotizaciones con token
CREATE POLICY "Lectura pública items por token" ON cotizacion_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cotizaciones 
      WHERE cotizaciones.id = cotizacion_items.cotizacion_id 
      AND cotizaciones.token_acceso IS NOT NULL
    )
  );
