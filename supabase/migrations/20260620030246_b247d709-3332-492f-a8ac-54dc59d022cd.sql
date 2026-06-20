
CREATE POLICY "Tecnico asignado puede ver cliente de su OT"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ordenes_servicio os
    JOIN public.asignaciones_ot a ON a.ot_id = os.id
    WHERE os.cliente_id = clientes.id
      AND a.personal_id = auth.uid()
  )
);

CREATE POLICY "Tecnico asignado puede ver ubicacion de su OT"
ON public.ubicaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ordenes_servicio os
    JOIN public.asignaciones_ot a ON a.ot_id = os.id
    WHERE os.ubicacion_id = ubicaciones.id
      AND a.personal_id = auth.uid()
  )
);
