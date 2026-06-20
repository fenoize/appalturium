DROP POLICY IF EXISTS "Personal asignado puede actualizar informes de sus OT" ON public.informes_finales;

CREATE POLICY "Personal asignado puede actualizar informes de sus OT"
ON public.informes_finales
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot a
    WHERE a.ot_id = informes_finales.ot_id
      AND a.personal_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.ordenes_servicio os
    WHERE os.id = informes_finales.ot_id
      AND os.estado = 'finalizado'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot a
    WHERE a.ot_id = informes_finales.ot_id
      AND a.personal_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.ordenes_servicio os
    WHERE os.id = informes_finales.ot_id
      AND os.estado = 'finalizado'
  )
);