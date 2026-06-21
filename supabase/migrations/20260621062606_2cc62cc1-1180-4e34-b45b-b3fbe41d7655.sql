
CREATE OR REPLACE FUNCTION public.fn_tecnico_asignado_a_cliente(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ordenes_servicio os
    JOIN public.asignaciones_ot a ON a.ot_id = os.id
    WHERE os.cliente_id = _cliente_id
      AND a.personal_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "Tecnico asignado puede ver cliente de su OT" ON public.clientes;

CREATE POLICY "Tecnico asignado puede ver cliente de su OT"
ON public.clientes
FOR SELECT
TO authenticated
USING (public.fn_tecnico_asignado_a_cliente(auth.uid(), id));
