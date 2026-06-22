import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { useGruposCotizacion } from "@/hooks/useGruposCotizacion";
import { useConfiguracionEmpresa } from "@/hooks/useConfiguracionEmpresa";
import { generarCotizacionPDF } from "@/lib/pdf/cotizacionPDF";
import type { CotizacionOpcion } from "@/hooks/useCotizacionOpciones";
import type { Cotizacion } from "@/hooks/useCotizaciones";

interface Props {
  cotizacion: Cotizacion;
  opcion: CotizacionOpcion;
}

const FORMATO_LABEL: Record<string, string> = {
  categorias: "Por categoría",
  items_por_categoria: "Items por categoría",
  items_por_categoria_padre: "Items por categoría padre",
};

export function VistaPreviaCotizacion({ cotizacion, opcion }: Props) {
  const moneda = cotizacion.moneda;
  const { items, grupos } = useGruposCotizacion(cotizacion.id, opcion.formato);
  const { data: empresa } = useConfiguracionEmpresa();
  const soloCategorias = opcion.formato === "categorias";

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    generarCotizacionPDF({
      numero: cotizacion.numero,
      created_at: cotizacion.created_at,
      estado: cotizacion.estado,
      moneda: cotizacion.moneda as any,
      subtotal: opcion.subtotal,
      iva: opcion.impuestos,
      total: opcion.total,
      notas: cotizacion.notas,
      condiciones: cotizacion.condiciones,
      opcionEtiqueta: opcion.etiqueta,
      cliente: cotizacion.cliente as any,
      items: (items ?? []).map((it: any) => ({
        descripcion: it.descripcion,
        cantidad: Number(it.cantidad) || 0,
        precio_unitario: Number(it.precio_unitario) || 0,
        descuento_pct: it.descuento_pct ?? 0,
        subtotal: Number(it.subtotal) || 0,
        tipo: it.tipo ?? null,
      })),
    });
  };

  const clienteNombre =
    cotizacion.cliente?.tipo === "empresa"
      ? cotizacion.cliente?.razon_social ?? ""
      : `${cotizacion.cliente?.nombres ?? ""} ${cotizacion.cliente?.apellidos ?? ""}`.trim();

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #vista-previa-cotizacion, #vista-previa-cotizacion * { visibility: visible !important; }
          #vista-previa-cotizacion { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .vp-no-print { display: none !important; }
        }
      `}</style>

      <div className="vp-no-print flex justify-end gap-2 mb-3">
        <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" /> Descargar PDF
        </Button>
        <Button size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir
        </Button>
      </div>

      <div id="vista-previa-cotizacion" className="bg-background text-foreground p-6 space-y-6">
        {/* Encabezado */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h2 className="text-xl font-bold">{empresa?.nombre || "Empresa"}</h2>
            {empresa?.rut && <p className="text-sm text-muted-foreground">RUT: {empresa.rut}</p>}
            {empresa?.direccion && <p className="text-sm text-muted-foreground">{empresa.direccion}</p>}
            {empresa?.telefono && <p className="text-sm text-muted-foreground">Tel: {empresa.telefono}</p>}
            {empresa?.email && <p className="text-sm text-muted-foreground">{empresa.email}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold">Cotización {cotizacion.numero}</h3>
            <p className="text-sm">Opción {opcion.etiqueta}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(cotizacion.fecha_emision), "dd/MM/yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              Validez: {cotizacion.validez_dias} días · Formato: {FORMATO_LABEL[opcion.formato] ?? opcion.formato}
            </p>
          </div>
        </div>

        {/* Cliente */}
        <div className="border-b pb-4">
          <p className="text-xs uppercase text-muted-foreground mb-1">Cliente</p>
          <p className="font-medium">{clienteNombre || "Sin cliente"}</p>
          {cotizacion.cliente?.rut && (
            <p className="text-sm text-muted-foreground">RUT: {cotizacion.cliente.rut}</p>
          )}
          {cotizacion.cliente?.email && (
            <p className="text-sm text-muted-foreground">{cotizacion.cliente.email}</p>
          )}
        </div>

        {/* Items agrupados */}
        <div className="space-y-3">
          {!items ? (
            <p className="text-sm text-muted-foreground">Cargando items…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin items.</p>
          ) : (
            grupos.map((g) => (
              <div key={g.nombre} className="border rounded-md">
                <div className="flex justify-between font-semibold px-3 py-2 bg-muted/50">
                  <span>{g.nombre}</span>
                  <span>{formatCurrency(g.subtotal, moneda as any)}</span>
                </div>
                {!soloCategorias && (
                  <table className="w-full text-sm">
                    <tbody>
                      {g.items.map((it) => (
                        <tr key={it.id} className="border-t">
                          <td className="px-3 py-1.5">{it.descripcion}</td>
                          <td className="px-3 py-1.5 text-center w-20">{it.cantidad}</td>
                          <td className="px-3 py-1.5 text-right w-32">
                            {formatCurrency(Number(it.precio_unitario) || 0, moneda as any)}
                          </td>
                          <td className="px-3 py-1.5 text-right w-32 font-medium">
                            {formatCurrency(Number(it.subtotal) || 0, moneda as any)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>

        {/* Totales */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(opcion.subtotal, moneda as any)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impuestos</span>
              <span>{formatCurrency(opcion.impuestos, moneda as any)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold text-base">
              <span>Total</span>
              <span>{formatCurrency(opcion.total, moneda as any)}</span>
            </div>
          </div>
        </div>

        {(cotizacion.notas || cotizacion.condiciones) && (
          <div className="border-t pt-3 text-sm space-y-2">
            {cotizacion.notas && (
              <div>
                <p className="font-medium">Notas</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{cotizacion.notas}</p>
              </div>
            )}
            {cotizacion.condiciones && (
              <div>
                <p className="font-medium">Condiciones</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{cotizacion.condiciones}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
