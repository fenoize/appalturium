INSERT INTO storage.buckets (id, name, public)
VALUES ('firmas', 'firmas', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Firmas son públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'firmas');

CREATE POLICY "Usuarios autenticados pueden subir firmas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'firmas');

CREATE POLICY "Usuarios autenticados pueden actualizar firmas"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'firmas');