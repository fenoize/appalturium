-- Drop any prior policies on objects for the firmas bucket
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%firma%' OR policyname ILIKE '%firmas%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Helper: extract ot_id from path. Path layouts used by the app:
--   {ot_id}/{timestamp}.png                       -> ot_id at folder[1]
--   evidencias/{ot_id}/{antes|despues}/{file}     -> ot_id at folder[2]
CREATE OR REPLACE FUNCTION public.fn_firmas_ot_id_from_path(_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  parts text[] := storage.foldername(_name);
  candidate text;
BEGIN
  IF parts IS NULL OR array_length(parts, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  IF parts[1] = 'evidencias' AND array_length(parts, 1) >= 2 THEN
    candidate := parts[2];
  ELSE
    candidate := parts[1];
  END IF;

  BEGIN
    RETURN candidate::uuid;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
END;
$$;

-- Admin / supervisor: full access
CREATE POLICY "firmas: admin/supervisor full access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'firmas'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'supervisor'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'firmas'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'supervisor'::app_role)
  )
);

-- Assigned personnel: SELECT
CREATE POLICY "firmas: personal asignado puede leer"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'firmas'
  AND EXISTS (
    SELECT 1 FROM public.asignaciones_ot a
    WHERE a.ot_id = public.fn_firmas_ot_id_from_path(name)
      AND a.personal_id = auth.uid()
  )
);

-- Assigned personnel: INSERT
CREATE POLICY "firmas: personal asignado puede subir"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'firmas'
  AND EXISTS (
    SELECT 1 FROM public.asignaciones_ot a
    WHERE a.ot_id = public.fn_firmas_ot_id_from_path(name)
      AND a.personal_id = auth.uid()
  )
);

-- Assigned personnel: UPDATE
CREATE POLICY "firmas: personal asignado puede actualizar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'firmas'
  AND EXISTS (
    SELECT 1 FROM public.asignaciones_ot a
    WHERE a.ot_id = public.fn_firmas_ot_id_from_path(name)
      AND a.personal_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'firmas'
  AND EXISTS (
    SELECT 1 FROM public.asignaciones_ot a
    WHERE a.ot_id = public.fn_firmas_ot_id_from_path(name)
      AND a.personal_id = auth.uid()
  )
);

-- Assigned personnel: DELETE
CREATE POLICY "firmas: personal asignado puede eliminar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'firmas'
  AND EXISTS (
    SELECT 1 FROM public.asignaciones_ot a
    WHERE a.ot_id = public.fn_firmas_ot_id_from_path(name)
      AND a.personal_id = auth.uid()
  )
);