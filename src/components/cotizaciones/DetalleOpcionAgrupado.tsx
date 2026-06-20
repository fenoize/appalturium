import { formatCurrency } from "@/lib/formatCurrency";
import { useGruposCotizacion } from "@/hooks/useGruposCotizacion";
import type { FormatoOpcion } from "@/hooks/useCotizacionOpciones";

interface Props {
  cotizacionId: string;
  formato: FormatoOpcion;
  moneda?: string;
}

export function DetalleOpcionAgrupado({ cotizacionId, formato, moneda = "CLP" }: Props) {
  const { items, grupos } = useGruposCotizacion(cotizacionId, formato);

  if (!items) return <p className="text-sm text-muted-foreground">Cargando detalle…</p>;
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">Sin items en la cotización.</p>;

  const soloCategorias = formato === "categorias";

  return (
    <div className="space-y-3 text-sm">
      {grupos.map((g) => (
        <div key={g.nombre} className="border rounded-md p-2">
          <div className="flex justify-between font-medium">
            <span>{g.nombre}</span>
            <span>{formatCurrency(g.subtotal, moneda as any)}</span>
          </div>
          {!soloCategorias && (
            <ul className="mt-2 space-y-1">
              {g.items.map((it) => (
                <li key={it.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate pr-2">
                    {it.cantidad} × {it.descripcion}
                  </span>
                  <span>{formatCurrency(Number(it.subtotal) || 0, moneda as any)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
