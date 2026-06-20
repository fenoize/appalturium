import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Send, CheckCircle, XCircle } from "lucide-react";
import { useCotizacionOpciones } from "@/hooks/useCotizacionOpciones";

interface Props {
  cotizacionId: string;
}

type EventoTipo = "presentada" | "aceptada" | "rechazada";

const META: Record<EventoTipo, { label: string; icon: any; color: string }> = {
  presentada: { label: "presentada", icon: Send, color: "text-blue-600" },
  aceptada: { label: "aceptada", icon: CheckCircle, color: "text-green-600" },
  rechazada: { label: "rechazada", icon: XCircle, color: "text-red-600" },
};

export function BitacoraNegociacion({ cotizacionId }: Props) {
  const { data: opciones } = useCotizacionOpciones(cotizacionId);

  const eventos = (opciones ?? [])
    .flatMap((op) => {
      const out: { ts: string; etiqueta: string; tipo: EventoTipo }[] = [];
      if (op.presentada_ts) out.push({ ts: op.presentada_ts, etiqueta: op.etiqueta, tipo: "presentada" });
      if (op.aceptada_ts) out.push({ ts: op.aceptada_ts, etiqueta: op.etiqueta, tipo: "aceptada" });
      if (op.rechazada_ts) out.push({ ts: op.rechazada_ts, etiqueta: op.etiqueta, tipo: "rechazada" });
      return out;
    })
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bitácora de negociación</CardTitle>
      </CardHeader>
      <CardContent>
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad de negociación aún.</p>
        ) : (
          <ul className="space-y-2">
            {eventos.map((e, i) => {
              const m = META[e.tipo];
              const Icon = m.icon;
              return (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Icon className={`h-4 w-4 mt-0.5 ${m.color}`} />
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {format(new Date(e.ts), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                    <span className="mx-2">—</span>
                    <span>
                      Opción <strong>{e.etiqueta}</strong> {m.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
