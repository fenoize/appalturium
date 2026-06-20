import { supabase } from "@/integrations/supabase/client";

export interface ConflictoAsignacion {
  ot_id: string;
  numero: string;
  fecha_inicio: string;
  fecha_fin: string;
}

/**
 * Detecta si alguno de los técnicos en `personalIds` tiene otra OT (distinta de
 * `otIdExcluida`) cuyo rango fecha_programada_inicio/fin se superpone con
 * [inicio, fin]. Devuelve la lista de conflictos (vacía si no hay).
 */
export async function detectarConflictosAsignacion(params: {
  personalIds: string[];
  inicio: Date;
  fin: Date;
  otIdExcluida?: string;
}): Promise<ConflictoAsignacion[]> {
  const { personalIds, inicio, fin, otIdExcluida } = params;
  if (personalIds.length === 0) return [];

  let query = supabase
    .from("asignaciones_ot")
    .select(`
      ot_id,
      ordenes_servicio!inner(
        id,
        numero,
        fecha_programada_inicio,
        fecha_programada_fin
      )
    `)
    .in("personal_id", personalIds)
    .not("ordenes_servicio.fecha_programada_inicio", "is", null)
    .not("ordenes_servicio.fecha_programada_fin", "is", null);

  if (otIdExcluida) query = query.neq("ot_id", otIdExcluida);

  const { data, error } = await query;
  if (error) throw error;

  const conflictos: ConflictoAsignacion[] = [];
  const seen = new Set<string>();
  for (const row of (data as any[]) ?? []) {
    const os = row.ordenes_servicio;
    if (!os) continue;
    const oInicio = new Date(os.fecha_programada_inicio);
    const oFin = new Date(os.fecha_programada_fin);
    const overlap = inicio < oFin && fin > oInicio;
    if (overlap && !seen.has(os.id)) {
      seen.add(os.id);
      conflictos.push({
        ot_id: os.id,
        numero: os.numero,
        fecha_inicio: os.fecha_programada_inicio,
        fecha_fin: os.fecha_programada_fin,
      });
    }
  }
  return conflictos;
}
