
ALTER TABLE public.ordenes_servicio
  ADD COLUMN IF NOT EXISTS solicitud_cotizacion_id uuid REFERENCES public.solicitudes_cotizacion(id),
  ADD COLUMN IF NOT EXISTS equipo_id uuid REFERENCES public.equipos(id);

ALTER TABLE public.ordenes_servicio DISABLE TRIGGER USER;

UPDATE public.ordenes_servicio SET estado = CASE estado
  WHEN 'draft' THEN 'pendiente'
  WHEN 'scheduled' THEN 'pendiente'
  WHEN 'assigned' THEN 'pendiente'
  WHEN 'in_progress' THEN 'en_curso'
  WHEN 'completed' THEN 'finalizado'
  WHEN 'closed' THEN 'finalizado'
  WHEN 'cancelled' THEN 'cancelado'
  WHEN 'canceled' THEN 'cancelado'
  ELSE 'pendiente'
END
WHERE estado NOT IN ('pendiente','en_curso','en_pausa','finalizado','cancelado');

ALTER TABLE public.ordenes_servicio ENABLE TRIGGER USER;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.ordenes_servicio'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%estado%'
  LOOP
    EXECUTE format('ALTER TABLE public.ordenes_servicio DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.ordenes_servicio
  ADD CONSTRAINT ordenes_servicio_estado_check
  CHECK (estado IN ('pendiente','en_curso','en_pausa','finalizado','cancelado'));

ALTER TABLE public.ordenes_servicio ALTER COLUMN estado SET DEFAULT 'pendiente';

DELETE FROM public.parametros_sistema WHERE categoria = 'service_statuses';
INSERT INTO public.parametros_sistema (categoria, key, label, color, orden, activo) VALUES
  ('service_statuses', 'pendiente',  'Pendiente',  'slate',  1, true),
  ('service_statuses', 'en_curso',   'En curso',   'blue',   2, true),
  ('service_statuses', 'en_pausa',   'En pausa',   'yellow', 3, true),
  ('service_statuses', 'finalizado', 'Finalizado', 'green',  4, true),
  ('service_statuses', 'cancelado',  'Cancelado',  'red',    5, true);

CREATE OR REPLACE FUNCTION public.validar_estado_completado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.estado = 'finalizado' AND (OLD.estado IS NULL OR OLD.estado <> 'finalizado') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.informes_finales
      WHERE ot_id = NEW.id
        AND firma_cliente IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'No se puede marcar como finalizado sin informe final y firma del cliente';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
