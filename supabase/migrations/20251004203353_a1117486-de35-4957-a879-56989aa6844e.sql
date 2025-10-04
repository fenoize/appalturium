-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_one_default_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.por_defecto = true THEN
    UPDATE public.ubicaciones
    SET por_defecto = false
    WHERE cliente_id = NEW.cliente_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_one_principal_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.es_principal = true THEN
    UPDATE public.contactos
    SET es_principal = false
    WHERE cliente_id = NEW.cliente_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;