-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'cliente');
CREATE TYPE public.tipo_cliente AS ENUM ('empresa', 'persona');
CREATE TYPE public.tipo_ubicacion AS ENUM ('sucursal', 'domicilio');
CREATE TYPE public.tipo_contacto_empresa AS ENUM ('administrador_sucursal', 'encargado_proyecto', 'otro');
CREATE TYPE public.tipo_contacto_persona AS ENUM ('pareja', 'hijo', 'secundario', 'otro');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_cliente NOT NULL,
  razon_social TEXT,
  giro TEXT,
  nombres TEXT,
  apellidos TEXT,
  rut TEXT NOT NULL UNIQUE,
  email TEXT,
  telefono TEXT,
  notas TEXT,
  etiquetas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT empresa_campos CHECK (
    tipo = 'persona' OR (razon_social IS NOT NULL)
  ),
  CONSTRAINT persona_campos CHECK (
    tipo = 'empresa' OR (nombres IS NOT NULL AND apellidos IS NOT NULL)
  )
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Ubicaciones table
CREATE TABLE public.ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_ubicacion NOT NULL,
  alias TEXT NOT NULL,
  direccion TEXT NOT NULL,
  comuna TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  region TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  por_defecto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;

-- Contactos table
CREATE TABLE public.contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  ubicacion_id UUID REFERENCES public.ubicaciones(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  rol_contextual TEXT,
  tipo_contacto_empresa tipo_contacto_empresa,
  tipo_contacto_persona tipo_contacto_persona,
  es_principal BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for clientes
CREATE POLICY "Admins and supervisors can view all clients"
  ON public.clientes FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Clients can view their own data"
  ON public.clientes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and supervisors can insert clients"
  ON public.clientes FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admins and supervisors can update clients"
  ON public.clientes FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Clients can update their own data"
  ON public.clientes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete clients"
  ON public.clientes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ubicaciones
CREATE POLICY "Users can view locations of accessible clients"
  ON public.ubicaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_id AND (
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'supervisor') OR
        c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and supervisors can manage locations"
  ON public.ubicaciones FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Clients can manage their own locations"
  ON public.ubicaciones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_id AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for contactos
CREATE POLICY "Users can view contacts of accessible clients"
  ON public.contactos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_id AND (
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'supervisor') OR
        c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and supervisors can manage contacts"
  ON public.contactos FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Clients can manage their own contacts"
  ON public.contactos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_id AND c.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ubicaciones_updated_at
  BEFORE UPDATE ON public.ubicaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contactos_updated_at
  BEFORE UPDATE ON public.contactos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to ensure only one default location per client
CREATE OR REPLACE FUNCTION public.ensure_one_default_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.por_defecto = true THEN
    UPDATE public.ubicaciones
    SET por_defecto = false
    WHERE cliente_id = NEW.cliente_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_default_location_trigger
  BEFORE INSERT OR UPDATE ON public.ubicaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_one_default_location();

-- Trigger to ensure only one principal contact per client
CREATE OR REPLACE FUNCTION public.ensure_one_principal_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_principal = true THEN
    UPDATE public.contactos
    SET es_principal = false
    WHERE cliente_id = NEW.cliente_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_principal_contact_trigger
  BEFORE INSERT OR UPDATE ON public.contactos
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_one_principal_contact();

-- Create indexes for performance
CREATE INDEX idx_clientes_tipo ON public.clientes(tipo);
CREATE INDEX idx_clientes_rut ON public.clientes(rut);
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_ubicaciones_cliente_id ON public.ubicaciones(cliente_id);
CREATE INDEX idx_ubicaciones_comuna ON public.ubicaciones(comuna);
CREATE INDEX idx_contactos_cliente_id ON public.contactos(cliente_id);
CREATE INDEX idx_contactos_ubicacion_id ON public.contactos(ubicacion_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);