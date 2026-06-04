
DROP POLICY IF EXISTS "Lectura pública por token" ON public.cotizaciones;
DROP POLICY IF EXISTS "Actualización pública por token" ON public.cotizaciones;

DROP POLICY IF EXISTS "Lectura pública por código QR" ON public.equipos;
DROP POLICY IF EXISTS "Lectura pública intervenciones por equipo" ON public.equipos_intervenciones;
DROP POLICY IF EXISTS "Lectura pública movimientos por equipo" ON public.equipos_movimientos;

DROP POLICY IF EXISTS "Firmas son públicas" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Autenticados pueden ver firmas'
  ) THEN
    CREATE POLICY "Autenticados pueden ver firmas"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'firmas');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Autenticados pueden subir firmas'
  ) THEN
    CREATE POLICY "Autenticados pueden subir firmas"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'firmas');
  END IF;
END $$;
