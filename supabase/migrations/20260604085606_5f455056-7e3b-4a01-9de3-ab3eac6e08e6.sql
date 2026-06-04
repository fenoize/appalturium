-- Políticas RLS para bucket 'firmas': solo usuarios autenticados
DROP POLICY IF EXISTS "Firmas: lectura autenticada" ON storage.objects;
DROP POLICY IF EXISTS "Firmas: insertar autenticada" ON storage.objects;
DROP POLICY IF EXISTS "Firmas: actualizar autenticada" ON storage.objects;
DROP POLICY IF EXISTS "Firmas: eliminar autenticada" ON storage.objects;

CREATE POLICY "Firmas: lectura autenticada"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'firmas');

CREATE POLICY "Firmas: insertar autenticada"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'firmas');

CREATE POLICY "Firmas: actualizar autenticada"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'firmas')
WITH CHECK (bucket_id = 'firmas');

CREATE POLICY "Firmas: eliminar autenticada"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'firmas');