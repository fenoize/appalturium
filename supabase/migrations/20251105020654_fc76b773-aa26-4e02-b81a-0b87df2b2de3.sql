-- Fase 10: Portal Cliente - Permisos adicionales para clientes

-- Permitir a clientes aprobar presupuestos (solo cambiar estado a aprobado)
CREATE POLICY "Clientes pueden aprobar presupuestos de sus OT"
ON public.presupuestos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM ordenes_servicio os
    JOIN clientes c ON c.id = os.cliente_id
    WHERE os.id = presupuestos.ot_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Solo permitir cambiar estado a aprobado
  estado = 'aprobado'::estado_presupuesto
  AND EXISTS (
    SELECT 1
    FROM ordenes_servicio os
    JOIN clientes c ON c.id = os.cliente_id
    WHERE os.id = presupuestos.ot_id
      AND c.user_id = auth.uid()
  )
);

-- Permitir a clientes crear solicitudes de mantención
CREATE POLICY "Clientes pueden crear solicitudes de mantención"
ON public.ordenes_servicio
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verificar que el cliente_id corresponde al user_id autenticado
  EXISTS (
    SELECT 1
    FROM clientes c
    WHERE c.id = cliente_id
      AND c.user_id = auth.uid()
  )
  -- El estado inicial debe ser 'draft'
  AND estado = 'draft'
);

-- Permitir a clientes actualizar OT en estado draft (solo las que crearon)
CREATE POLICY "Clientes pueden actualizar sus OT en borrador"
ON public.ordenes_servicio
FOR UPDATE
TO authenticated
USING (
  estado = 'draft'
  AND EXISTS (
    SELECT 1
    FROM clientes c
    WHERE c.id = cliente_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  estado = 'draft'
  AND EXISTS (
    SELECT 1
    FROM clientes c
    WHERE c.id = cliente_id
      AND c.user_id = auth.uid()
  )
);