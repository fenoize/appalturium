-- 1) Estado 'borrador' en solicitudes_cotizacion
ALTER TABLE public.solicitudes_cotizacion
  DROP CONSTRAINT IF EXISTS solicitudes_cotizacion_estado_check;

ALTER TABLE public.solicitudes_cotizacion
  ADD CONSTRAINT solicitudes_cotizacion_estado_check
  CHECK (estado IN ('borrador','nueva','en_presupuesto','cotizada','negociacion','aceptada','cerrada_sin_acuerdo'));

-- 2) Políticas RLS para el bucket solicitud-adjuntos (creado vía Storage API)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname ILIKE '%solicitud-adjuntos%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "solicitud-adjuntos: anon puede leer"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'solicitud-adjuntos');

CREATE POLICY "solicitud-adjuntos: authenticated puede leer"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'solicitud-adjuntos');

CREATE POLICY "solicitud-adjuntos: authenticated puede subir"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'solicitud-adjuntos');

CREATE POLICY "solicitud-adjuntos: authenticated puede actualizar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'solicitud-adjuntos')
WITH CHECK (bucket_id = 'solicitud-adjuntos');

CREATE POLICY "solicitud-adjuntos: authenticated puede eliminar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'solicitud-adjuntos');