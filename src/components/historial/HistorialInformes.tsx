import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  clienteId?: string;
  equipoId?: string;
}

interface Informe {
  id: string;
  created_at: string;
  resumen_tecnico: string | null;
  evidencias_urls: any;
  ot_id: string;
  ordenes_servicio?: { numero: string | null } | null;
}

export function HistorialInformes({ clienteId, equipoId }: Props) {
  const [informes, setInformes] = useState<Informe[] | null>(null);

  useEffect(() => {
    (async () => {
      let q = supabase
        .from("informes_finales")
        .select("id, created_at, resumen_tecnico, evidencias_urls, ot_id, ordenes_servicio(numero)")
        .order("created_at", { ascending: false });
      if (clienteId) q = q.eq("cliente_id", clienteId);
      if (equipoId) q = q.eq("equipo_id", equipoId);
      const { data } = await q;
      setInformes((data as any) ?? []);
    })();
  }, [clienteId, equipoId]);

  if (informes === null) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (informes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sin informes registrados aún.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {informes.map((inf) => {
        const ev = inf.evidencias_urls ?? {};
        const antes: string[] = Array.isArray(ev.antes) ? ev.antes : [];
        const despues: string[] = Array.isArray(ev.despues) ? ev.despues : [];
        return (
          <Card key={inf.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>
                  OT {inf.ordenes_servicio?.numero ?? inf.ot_id.slice(0, 8)}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {format(new Date(inf.created_at), "dd MMM yyyy", { locale: es })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inf.resumen_tecnico && (
                <p className="text-sm whitespace-pre-line">{inf.resumen_tecnico}</p>
              )}
              {(antes.length > 0 || despues.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {antes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Antes</p>
                      <div className="grid grid-cols-3 gap-1">
                        {antes.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="Antes" className="w-full h-20 object-cover rounded border" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {despues.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Después</p>
                      <div className="grid grid-cols-3 gap-1">
                        {despues.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="Después" className="w-full h-20 object-cover rounded border" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
