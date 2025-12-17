-- Drop existing policies for ubicaciones
DROP POLICY IF EXISTS "Admins and supervisors can manage locations" ON public.ubicaciones;
DROP POLICY IF EXISTS "Clients can manage their own locations" ON public.ubicaciones;
DROP POLICY IF EXISTS "Users can view locations of accessible clients" ON public.ubicaciones;

-- Create separate policies for each operation

-- SELECT: Users can view locations of accessible clients
CREATE POLICY "ubicaciones_select_policy" ON public.ubicaciones
FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor') OR
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = ubicaciones.cliente_id AND c.user_id = auth.uid()
  )
);

-- INSERT: Admins, supervisors can insert locations for any client
CREATE POLICY "ubicaciones_insert_admin" ON public.ubicaciones
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
);

-- INSERT: Clients can insert locations for their own clients
CREATE POLICY "ubicaciones_insert_client" ON public.ubicaciones
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = cliente_id AND c.user_id = auth.uid()
  )
);

-- UPDATE: Admins, supervisors can update any location
CREATE POLICY "ubicaciones_update_admin" ON public.ubicaciones
FOR UPDATE USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
);

-- UPDATE: Clients can update their own locations
CREATE POLICY "ubicaciones_update_client" ON public.ubicaciones
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = ubicaciones.cliente_id AND c.user_id = auth.uid()
  )
);

-- DELETE: Admins, supervisors can delete any location
CREATE POLICY "ubicaciones_delete_admin" ON public.ubicaciones
FOR DELETE USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
);

-- DELETE: Clients can delete their own locations  
CREATE POLICY "ubicaciones_delete_client" ON public.ubicaciones
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = ubicaciones.cliente_id AND c.user_id = auth.uid()
  )
);

-- Also fix contactos policies for the same pattern
DROP POLICY IF EXISTS "Admins and supervisors can manage contacts" ON public.contactos;
DROP POLICY IF EXISTS "Clients can manage their own contacts" ON public.contactos;

-- SELECT for contactos
CREATE POLICY "contactos_select_policy" ON public.contactos
FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor') OR
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = contactos.cliente_id AND c.user_id = auth.uid()
  )
);

-- INSERT for contactos (admin/supervisor)
CREATE POLICY "contactos_insert_admin" ON public.contactos
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
);

-- INSERT for contactos (client)
CREATE POLICY "contactos_insert_client" ON public.contactos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = cliente_id AND c.user_id = auth.uid()
  )
);

-- UPDATE for contactos
CREATE POLICY "contactos_update_admin" ON public.contactos
FOR UPDATE USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "contactos_update_client" ON public.contactos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = contactos.cliente_id AND c.user_id = auth.uid()
  )
);

-- DELETE for contactos
CREATE POLICY "contactos_delete_admin" ON public.contactos
FOR DELETE USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "contactos_delete_client" ON public.contactos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = contactos.cliente_id AND c.user_id = auth.uid()
  )
);