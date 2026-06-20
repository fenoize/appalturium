CREATE POLICY "Personal asignado puede actualizar informes de sus OT"
ON public.informes_finales
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE asignaciones_ot.ot_id = informes_finales.ot_id
      AND asignaciones_ot.personal_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE asignaciones_ot.ot_id = informes_finales.ot_id
      AND asignaciones_ot.personal_id = auth.uid()
  )
);