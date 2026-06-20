import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckCircle2, FileText, ExternalLink, Receipt, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OTPendiente {
  id: string;
  numero: string;
  cliente_id: string | null;
  descripcion: string | null;
  updated_at: string;
  clientes?: { razon_social: string | null } | null;
  informe?: {
    resumen_tecnico: string | null;
    recomendaciones: string | null;
    evidencias_urls: any;
  } | null;
  pago_pendiente: boolean;
  saldo_pendiente: number;
  compra_pendiente: boolean;
  compra_motivo: string | null;
}

export default function CierreAdministrativo() {
  const [ots, setOts] = useState<OTPendiente[] | null>(null);
  const [forms, setForms] = useState<Record<string, { conforme: boolean; cobro: string; obs: string; generarDoc: boolean; tipoDoc: string }>>({});
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = async () => {
    setOts(null);
    // OTs finalizadas
    const { data: finalizadas } = await supabase
      .from("ordenes_servicio")
      .select("id, numero, cliente_id, descripcion, updated_at, clientes(razon_social)")
      .eq("estado", "finalizado")
      .order("updated_at", { ascending: false });

    const ids = (finalizadas ?? []).map((o: any) => o.id);

    // Filter out those with cierre already
    const { data: cerradas } = await supabase
      .from("cierres_ot")
      .select("ot_id")
      .in("ot_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const cerradasSet = new Set((cerradas ?? []).map((c: any) => c.ot_id));

    const pendientes = (finalizadas ?? []).filter((o: any) => !cerradasSet.has(o.id));

    // Load informes for each
    const { data: informes } = await supabase
      .from("informes_finales")
      .select("ot_id, resumen_tecnico, recomendaciones, evidencias_urls")
      .in("ot_id", pendientes.map((o: any) => o.id).length > 0 ? pendientes.map((o: any) => o.id) : ["00000000-0000-0000-0000-000000000000"]);
    const infMap = new Map<string, any>((informes ?? []).map((i: any) => [i.ot_id, i]));

    const otIds = pendientes.map((o: any) => o.id);
    const safeIds = otIds.length > 0 ? otIds : ["00000000-0000-0000-0000-000000000000"];

    // Pago: documentos_venta con saldo > 0
    const { data: docs } = await supabase
      .from("documentos_venta")
      .select("ot_id, saldo")
      .in("ot_id", safeIds);
    const saldoMap = new Map<string, number>();
    (docs ?? []).forEach((d: any) => {
      saldoMap.set(d.ot_id, (saldoMap.get(d.ot_id) ?? 0) + Number(d.saldo ?? 0));
    });

    // Compra: cotizaciones -> solicitudes_compra -> oc
    const { data: cots } = await supabase
      .from("cotizaciones")
      .select("id, ot_id")
      .in("ot_id", safeIds);
    const cotByOt = new Map<string, string[]>();
    (cots ?? []).forEach((c: any) => {
      if (!c.ot_id) return;
      const arr = cotByOt.get(c.ot_id) ?? [];
      arr.push(c.id);
      cotByOt.set(c.ot_id, arr);
    });
    const allCotIds = (cots ?? []).map((c: any) => c.id);
    const safeCotIds = allCotIds.length > 0 ? allCotIds : ["00000000-0000-0000-0000-000000000000"];

    const { data: scs } = await supabase
      .from("solicitudes_compra")
      .select("id, cotizacion_id, estado")
      .in("cotizacion_id", safeCotIds);

    const allScIds = (scs ?? []).map((s: any) => s.id);
    const safeScIds = allScIds.length > 0 ? allScIds : ["00000000-0000-0000-0000-000000000000"];

    const { data: links } = await supabase
      .from("oc_solicitudes_compra")
      .select("solicitud_compra_id, orden_compra_id")
      .in("solicitud_compra_id", safeScIds);

    const allOcIds = Array.from(new Set((links ?? []).map((l: any) => l.orden_compra_id)));
    const safeOcIds = allOcIds.length > 0 ? allOcIds : ["00000000-0000-0000-0000-000000000000"];

    const { data: ocs } = await supabase
      .from("ordenes_compra")
      .select("id, estado")
      .in("id", safeOcIds);
    const ocEstadoMap = new Map<string, string>((ocs ?? []).map((o: any) => [o.id, o.estado]));

    const computeCompra = (otId: string): { pendiente: boolean; motivo: string | null } => {
      const cotIds = cotByOt.get(otId) ?? [];
      const scsOt = (scs ?? []).filter((s: any) => cotIds.includes(s.cotizacion_id));
      if (scsOt.length === 0) return { pendiente: false, motivo: null };
      const noConvertidas = scsOt.filter((s: any) => s.estado !== "convertida_oc").length;
      if (noConvertidas > 0) {
        return { pendiente: true, motivo: `${noConvertidas} solicitud(es) sin convertir a OC` };
      }
      const scIdsOt = scsOt.map((s: any) => s.id);
      const ocIdsOt = Array.from(
        new Set(
          (links ?? [])
            .filter((l: any) => scIdsOt.includes(l.solicitud_compra_id))
            .map((l: any) => l.orden_compra_id),
        ),
      );
      if (ocIdsOt.length === 0) return { pendiente: true, motivo: "OC no encontrada" };
      const noCompletadas = ocIdsOt.filter((id) => ocEstadoMap.get(id) !== "completada").length;
      if (noCompletadas > 0) {
        return { pendiente: true, motivo: `${noCompletadas} OC no completada(s)` };
      }
      return { pendiente: false, motivo: null };
    };

    const result: OTPendiente[] = pendientes.map((o: any) => {
      const saldo = saldoMap.get(o.id) ?? 0;
      const compra = computeCompra(o.id);
      return {
        ...o,
        informe: infMap.get(o.id) ?? null,
        pago_pendiente: saldo > 0,
        saldo_pendiente: saldo,
        compra_pendiente: compra.pendiente,
        compra_motivo: compra.motivo,
      };
    });

    setOts(result);

    const defaults: typeof forms = {};
    result.forEach((o) => {
      defaults[o.id] = { conforme: true, cobro: "", obs: "", generarDoc: false, tipoDoc: "factura" };
    });
    setForms(defaults);
  };

  useEffect(() => { cargar(); }, []);

  const updateForm = (otId: string, patch: Partial<typeof forms[string]>) => {
    setForms((prev) => ({ ...prev, [otId]: { ...prev[otId], ...patch } }));
  };

  const handleCerrar = async (ot: OTPendiente) => {
    const f = forms[ot.id];
    if (!f) return;
    const cobro = f.cobro ? Number(f.cobro) : null;
    if (f.cobro && (isNaN(cobro!) || cobro! < 0)) {
      toast.error("Cobro final inválido");
      return;
    }
    if (f.generarDoc && !cobro) {
      toast.error("Para generar documento debe ingresar un cobro final");
      return;
    }

    setGuardando(ot.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      if (f.generarDoc && cobro) {
        // Cierre atómico: documento de venta + pago + cierre en una sola transacción
        const { error: errRpc } = await supabase.rpc("fn_cerrar_ot_con_documento", {
          p_ot_id: ot.id,
          p_revisado_por: user.id,
          p_conforme: f.conforme,
          p_cobro_final: cobro,
          p_observaciones: f.obs || null,
          p_tipo_documento: f.tipoDoc as any,
          p_ot_numero: ot.numero,
        } as any);
        if (errRpc) throw errRpc;
      } else {
        const { error } = await supabase.from("cierres_ot").insert({
          ot_id: ot.id,
          revisado_por: user.id,
          conforme: f.conforme,
          cobro_final: cobro,
          observaciones: f.obs || null,
          documento_venta_id: null,
        } as any);
        if (error) throw error;
      }

      toast.success("Cierre administrativo registrado");
      await cargar();
    } catch (err: any) {
      toast.error("Error al cerrar", { description: err.message });
    } finally {
      setGuardando(null);
    }
  };

  if (ots === null) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold">Cierre administrativo</h1>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cierre administrativo</h1>
        <p className="text-muted-foreground">
          Revisa las Órdenes de Trabajo finalizadas, valida conformidad y genera el cobro final.
        </p>
      </div>

      {ots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success" />
            No hay OT pendientes de cierre administrativo.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ots.map((ot) => {
            const f = forms[ot.id] ?? { conforme: true, cobro: "", obs: "", generarDoc: false, tipoDoc: "factura" };
            const ev = ot.informe?.evidencias_urls ?? {};
            const antes: string[] = Array.isArray(ev.antes) ? ev.antes : [];
            const despues: string[] = Array.isArray(ev.despues) ? ev.despues : [];
            return (
              <Card key={ot.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-5 w-5" />
                      OT {ot.numero}
                      <Badge variant="outline">{ot.clientes?.razon_social ?? "—"}</Badge>
                      {ot.pago_pendiente && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Pago pendiente ({formatCurrency(ot.saldo_pendiente, "CLP")})
                        </Badge>
                      )}
                      {ot.compra_pendiente && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Compra a proveedor pendiente{ot.compra_motivo ? `: ${ot.compra_motivo}` : ""}
                        </Badge>
                      )}
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/ordenes-servicio/${ot.id}`}>
                        Ver OT <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ot.descripcion && (
                    <p className="text-sm text-muted-foreground">{ot.descripcion}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Finalizada: {format(new Date(ot.updated_at), "dd MMM yyyy HH:mm", { locale: es })}
                  </p>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Informe del técnico</h4>
                    {ot.informe ? (
                      <div className="space-y-3 text-sm">
                        {ot.informe.resumen_tecnico && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Resumen</p>
                            <p className="whitespace-pre-line">{ot.informe.resumen_tecnico}</p>
                          </div>
                        )}
                        {ot.informe.recomendaciones && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Recomendaciones</p>
                            <p className="whitespace-pre-line">{ot.informe.recomendaciones}</p>
                          </div>
                        )}
                        {(antes.length > 0 || despues.length > 0) && (
                          <div className="grid grid-cols-2 gap-3">
                            {antes.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Antes</p>
                                <div className="grid grid-cols-3 gap-1">
                                  {antes.map((u) => (
                                    <a key={u} href={u} target="_blank" rel="noreferrer">
                                      <img src={u} alt="antes" className="w-full h-16 object-cover rounded border" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {despues.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Después</p>
                                <div className="grid grid-cols-3 gap-1">
                                  {despues.map((u) => (
                                    <a key={u} href={u} target="_blank" rel="noreferrer">
                                      <img src={u} alt="después" className="w-full h-16 object-cover rounded border" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sin informe del técnico.</p>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`conf-${ot.id}`}
                        checked={f.conforme}
                        onCheckedChange={(v) => updateForm(ot.id, { conforme: v === true })}
                      />
                      <Label htmlFor={`conf-${ot.id}`} className="cursor-pointer">
                        Marcar como conforme
                      </Label>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`cobro-${ot.id}`}>Cobro final (CLP)</Label>
                      <Input
                        id={`cobro-${ot.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={f.cobro}
                        onChange={(e) => updateForm(ot.id, { cobro: e.target.value })}
                        placeholder="Opcional"
                      />
                      {f.cobro && !isNaN(Number(f.cobro)) && (
                        <p className="text-xs text-muted-foreground">{formatCurrency(Number(f.cobro), "CLP")}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`obs-${ot.id}`}>Observaciones</Label>
                    <Textarea
                      id={`obs-${ot.id}`}
                      rows={2}
                      value={f.obs}
                      onChange={(e) => updateForm(ot.id, { obs: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`gen-${ot.id}`}
                        checked={f.generarDoc}
                        onCheckedChange={(v) => updateForm(ot.id, { generarDoc: v === true })}
                      />
                      <Label htmlFor={`gen-${ot.id}`} className="cursor-pointer flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Generar documento de venta por el cobro final
                      </Label>
                    </div>
                    {f.generarDoc && (
                      <div className="space-y-1 ml-6">
                        <Label htmlFor={`tipo-${ot.id}`}>Tipo</Label>
                        <select
                          id={`tipo-${ot.id}`}
                          value={f.tipoDoc}
                          onChange={(e) => updateForm(ot.id, { tipoDoc: e.target.value })}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="boleta">Boleta</option>
                          <option value="factura">Factura</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {(ot.pago_pendiente || ot.compra_pendiente) && (
                      <p className="text-xs text-destructive text-right">
                        No se puede cerrar mientras existan dependencias pendientes.
                      </p>
                    )}
                    <Button
                      onClick={() => handleCerrar(ot)}
                      disabled={
                        guardando === ot.id || ot.pago_pendiente || ot.compra_pendiente
                      }
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {guardando === ot.id ? "Cerrando..." : "Cerrar OT"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
