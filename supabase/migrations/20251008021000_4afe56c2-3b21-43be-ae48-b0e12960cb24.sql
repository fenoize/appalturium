-- Arreglar función calcular_distancia_haversine con search_path seguro
CREATE OR REPLACE FUNCTION public.calcular_distancia_haversine(
  lat1 NUMERIC,
  lng1 NUMERIC,
  lat2 NUMERIC,
  lng2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  radio_tierra NUMERIC := 6371; -- Radio de la Tierra en km
  dlat NUMERIC;
  dlng NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlng/2) * sin(dlng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN radio_tierra * c;
END;
$$;