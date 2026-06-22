import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useClientes } from "@/hooks/useClientes";
import { useInventario } from "@/hooks/useInventario";
import { useServicios } from "@/hooks/useServicios";
import {
  useCrearSolicitud,
  useActualizarSolicitud,
  type EstadoSolicitud,
} from "@/hooks/useSolicitudesCotizacion";
import {
  getRegionNames,
  getCiudadesByRegion,
  getComunasByRegion,
} from "@/lib/chile-data";
import { formatCurrency } from "@/lib/formatCurrency";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileQuestion,
  Search,
  Package,
  Wrench,
  Edit3,
  Upload,
  Paperclip,
  ImageIcon,
  Film,
  FileText,
} from "lucide-react";

const TIPOS_SERVICIO = ["Instalación", "Mantención", "Servicio", "Garantía"] as const;
const BUCKET = "solicitud-adjuntos";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

interface ItemReferencial {
  tipo: "producto" | "servicio" | "personalizado";
  descripcion: string;
  cantidad: number;
  valor_estimado: number;
  item_inventario_id?: string | null;
  servicio_id?: string | null;
}

interface AdjuntoRef {
  path: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

function formatCliente(c: any | null | undefined) {
  if (!c) return "—";
  if (c.razon_social) return c.razon_social;
  return [c.nombres, c.apellidos].filter(Boolean).join(" ") || c.rut;
}

export default function SolicitudCotizacionNueva() {
  const navigate = useNavigate();
  const params = useParams();
  const editId = params.id ?? null;
  const isEditing = !!editId;

  const queryClient = useQueryClient();
  const crear = useCrearSolicitud();
  const actualizar = useActualizarSolicitud();

  // --- Estado del formulario ---
  const [clienteId, setClienteId] = useState<string>("");
  const [ubicacionId, setUbicacionId] = useState<string>("");
  const [tipoServicio, setTipoServicio] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [fechaVisita, setFechaVisita] = useState<string>("");
  const [items, setItems] = useState<ItemReferencial[]>([]);
  const [adjuntos, setAdjuntos] = useState<AdjuntoRef[]>([]);

  // --- Nueva ubicación inline ---
  const [showNuevaUbicacion, setShowNuevaUbicacion] = useState(false);
  const [nuevaUbic, setNuevaUbic] = useState({
    alias: "",
    direccion: "",
    numeracion: "",
    region: "",
    comuna: "",
    lat: null as number | null,
    lng: null as number | null,
  });
  const [creandoUbicacion, setCreandoUbicacion] = useState(false);

  // --- Diálogo agregar ítem ---
  const [showAgregarItem, setShowAgregarItem] = useState(false);
  const [tipoItem, setTipoItem] = useState<"producto" | "servicio" | "personalizado">(
    "producto"
  );
  const [busquedaItem, setBusquedaItem] = useState("");
  const [nuevoItemPers, setNuevoItemPers] = useState({
    descripcion: "",
    cantidad: 1,
    valor_estimado: 0,
  });

  // --- Subida de adjuntos ---
  const [subiendo, setSubiendo] = useState(false);

  // --- Catálogos ---
  const { data: clientesData } = useClientes({ pageSize: 200 });
  const clientes = clientesData?.data ?? [];
  const { data: inventario } = useInventario();
  const { data: servicios } = useServicios();

  const { data: ubicacionesCliente, refetch: refetchUbicaciones } = useQuery({
    queryKey: ["ubicaciones_cliente_solicitud", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = await supabase
        .from("ubicaciones")
        .select("id, alias, direccion, comuna, region, es_principal")
        .eq("cliente_id", clienteId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!clienteId,
  });

  // --- Cargar solicitud en modo edición ---
  const { data: solicitudExistente, isLoading: cargandoSolicitud } = useQuery({
    queryKey: ["solicitud_cotizacion_edit", editId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("solicitudes_cotizacion")
        .select("*")
        .eq("id", editId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (!solicitudExistente) return;
    setClienteId(solicitudExistente.cliente_id ?? "");
    setUbicacionId(solicitudExistente.ubicacion_id ?? "");
    setTipoServicio(solicitudExistente.tipo_servicio ?? "");
    setDescripcion(solicitudExistente.descripcion_necesidad ?? "");
    setFechaVisita(
      solicitudExistente.fecha_visita_tecnica
        ? new Date(solicitudExistente.fecha_visita_tecnica).toISOString().slice(0, 16)
        : ""
    );
    const det = (solicitudExistente.detalle_requerimiento ?? {}) as any;
    if (Array.isArray(det.items)) setItems(det.items as ItemReferencial[]);
    const adj = solicitudExistente.archivos_adjuntos;
    if (Array.isArray(adj)) {
      setAdjuntos(
        adj
          .map((a: any) =>
            typeof a === "object" && a
              ? {
                  path: a.path ?? "",
                  url: a.url ?? "",
                  name: a.name ?? a.nombre ?? "archivo",
                  type: a.type ?? "",
                  size: a.size ?? 0,
                }
              : null
          )
          .filter(Boolean) as AdjuntoRef[]
      );
    }
  }, [solicitudExistente]);

  // --- Derivados ---
  const productosFiltrados = (inventario ?? []).filter(
    (p: any) =>
      p.activo &&
      (p.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) ||
        (p.codigo ?? "").toLowerCase().includes(busquedaItem.toLowerCase()))
  );
  const serviciosFiltrados = (servicios ?? []).filter(
    (s: any) =>
      s.activo &&
      (s.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) ||
        (s.codigo ?? "").toLowerCase().includes(busquedaItem.toLowerCase()))
  );

  const ciudadesNuevaUbic = useMemo(
    () => (nuevaUbic.region ? getCiudadesByRegion(nuevaUbic.region) : []),
    [nuevaUbic.region]
  );
  const comunasNuevaUbic = useMemo(
    () => (nuevaUbic.region ? getComunasByRegion(nuevaUbic.region) : []),
    [nuevaUbic.region]
  );

  const totalReferencial = items.reduce(
    (acc, it) => acc + (it.cantidad || 0) * (it.valor_estimado || 0),
    0
  );

  // --- Handlers ítems ---
  const agregarProducto = (p: any) => {
    setItems((prev) => [
      ...prev,
      {
        tipo: "producto",
        item_inventario_id: p.id,
        descripcion: p.nombre,
        cantidad: 1,
        valor_estimado: Number(p.precio_venta) || 0,
      },
    ]);
    setShowAgregarItem(false);
    setBusquedaItem("");
  };
  const agregarServicio = (s: any) => {
    setItems((prev) => [
      ...prev,
      {
        tipo: "servicio",
        servicio_id: s.id,
        descripcion: s.nombre,
        cantidad: 1,
        valor_estimado: Number(s.monto_base) || 0,
      },
    ]);
    setShowAgregarItem(false);
    setBusquedaItem("");
  };
  const agregarPersonalizado = () => {
    if (!nuevoItemPers.descripcion.trim()) {
      toast({ title: "Ingresa una descripción", variant: "destructive" });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        tipo: "personalizado",
        descripcion: nuevoItemPers.descripcion,
        cantidad: nuevoItemPers.cantidad || 1,
        valor_estimado: nuevoItemPers.valor_estimado || 0,
      },
    ]);
    setShowAgregarItem(false);
    setNuevoItemPers({ descripcion: "", cantidad: 1, valor_estimado: 0 });
  };
  const actualizarItem = (idx: number, campo: keyof ItemReferencial, valor: any) => {
    setItems((prev) => {
      const next = [...prev];
      (next[idx] as any)[campo] = valor;
      return next;
    });
  };
  const eliminarItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Handler nueva ubicación inline ---
  const handleCrearUbicacion = async () => {
    if (!clienteId) {
      toast({ title: "Selecciona primero un cliente", variant: "destructive" });
      return;
    }
    if (!nuevaUbic.direccion.trim() || !nuevaUbic.region || !nuevaUbic.comuna) {
      toast({
        title: "Completa dirección, región y comuna",
        variant: "destructive",
      });
      return;
    }
    setCreandoUbicacion(true);
    try {
      const direccionCompleta = nuevaUbic.numeracion
        ? `${nuevaUbic.direccion} ${nuevaUbic.numeracion}`
        : nuevaUbic.direccion;
      const ciudadDefault = ciudadesNuevaUbic[0] ?? nuevaUbic.region;
      const { data, error } = await supabase
        .from("ubicaciones")
        .insert({
          cliente_id: clienteId,
          alias: nuevaUbic.alias || nuevaUbic.comuna,
          direccion: direccionCompleta,
          comuna: nuevaUbic.comuna,
          ciudad: ciudadDefault,
          region: nuevaUbic.region,
          lat: nuevaUbic.lat,
          lng: nuevaUbic.lng,
          tipo: "sucursal",
          es_principal: false,
          por_defecto: false,
          activo: true,
        })
        .select("id, alias, direccion, comuna")
        .single();
      if (error) throw error;
      await refetchUbicaciones();
      setUbicacionId(data.id);
      setShowNuevaUbicacion(false);
      setNuevaUbic({ alias: "", direccion: "", numeracion: "", region: "", comuna: "", lat: null, lng: null });
      toast({ title: "Ubicación creada" });
    } catch (err: any) {
      toast({
        title: "Error al crear ubicación",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setCreandoUbicacion(false);
    }
  };

  // --- Handler adjuntos ---
  const handleSubirArchivos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSubiendo(true);
    try {
      const nuevos: AdjuntoRef[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_BYTES) {
          toast({
            title: `Archivo demasiado grande: ${file.name}`,
            description: "Máximo 10 MB por archivo.",
            variant: "destructive",
          });
          continue;
        }
        const ext = file.name.split(".").pop() || "bin";
        const folder = editId ?? "borradores";
        const path = `${folder}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        nuevos.push({
          path,
          url: pub.publicUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }
      if (nuevos.length > 0) {
        setAdjuntos((prev) => [...prev, ...nuevos]);
        toast({ title: `${nuevos.length} archivo(s) subido(s)` });
      }
    } catch (err: any) {
      toast({
        title: "Error al subir archivo",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarAdjunto = async (a: AdjuntoRef) => {
    try {
      if (a.path) await supabase.storage.from(BUCKET).remove([a.path]);
    } catch {
      // no bloqueante
    }
    setAdjuntos((prev) => prev.filter((x) => x.path !== a.path));
  };

  // --- Guardar ---
  const buildPayload = (estado: EstadoSolicitud) => ({
    cliente_id: clienteId || (null as any),
    ubicacion_id: ubicacionId || null,
    tipo_servicio: tipoServicio || null,
    descripcion_necesidad: descripcion,
    fecha_visita_tecnica: fechaVisita ? new Date(fechaVisita).toISOString() : null,
    detalle_requerimiento: {
      items,
      total_referencial: totalReferencial,
    },
    archivos_adjuntos: adjuntos as any,
    estado,
  });

  const guardar = async (estado: EstadoSolicitud) => {
    if (estado === "nueva") {
      if (!clienteId) {
        toast({ title: "Selecciona un cliente", variant: "destructive" });
        return;
      }
      if (!descripcion.trim()) {
        toast({
          title: "Ingresa la descripción de la necesidad",
          variant: "destructive",
        });
        return;
      }
    } else {
      // borrador: cliente recomendable pero no obligatorio
      if (!clienteId && !descripcion.trim() && items.length === 0 && adjuntos.length === 0) {
        toast({
          title: "Agrega al menos un dato para guardar el borrador",
          variant: "destructive",
        });
        return;
      }
    }
    try {
      if (isEditing && editId) {
        await actualizar.mutateAsync({ id: editId, patch: buildPayload(estado) as any });
      } else {
        await crear.mutateAsync(buildPayload(estado) as any);
      }
      navigate("/solicitudes-cotizacion");
    } catch {
      // toast manejado en hooks
    }
  };

  const guardando = crear.isPending || actualizar.isPending;

  if (isEditing && cargandoSolicitud) {
    return <div className="p-8 text-center">Cargando solicitud…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/solicitudes-cotizacion")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileQuestion className="w-7 h-7" />
            {isEditing
              ? `Editar solicitud ${solicitudExistente?.numero ?? ""}`
              : "Nueva solicitud de cotización"}
          </h1>
          <p className="text-muted-foreground">
            Registra la necesidad inicial del cliente. Puedes guardar como borrador y completar más tarde.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => guardar("borrador")}
            disabled={guardando}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar borrador
          </Button>
          <Button onClick={() => guardar("nueva")} disabled={guardando}>
            {guardando ? "Guardando…" : "Crear solicitud"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label>Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {formatCliente(c)} — {c.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clienteId ? (
                <>
                  <Label>Ubicación del cliente</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={ubicacionId} onValueChange={setUbicacionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin ubicación seleccionada" />
                        </SelectTrigger>
                        <SelectContent>
                          {(ubicacionesCliente ?? []).map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.alias} — {u.direccion}
                              {u.comuna ? `, ${u.comuna}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNuevaUbicacion((v) => !v)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {showNuevaUbicacion ? "Cancelar" : "Nueva"}
                    </Button>
                  </div>

                  {showNuevaUbicacion && (
                    <div className="space-y-3 rounded-md border p-4 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Alias</Label>
                          <Input
                            value={nuevaUbic.alias}
                            onChange={(e) =>
                              setNuevaUbic({ ...nuevaUbic, alias: e.target.value })
                            }
                            placeholder="Ej: Oficina central"
                          />
                        </div>
                        <div>
                          <Label>Numeración</Label>
                          <Input
                            value={nuevaUbic.numeracion}
                            onChange={(e) =>
                              setNuevaUbic({ ...nuevaUbic, numeracion: e.target.value })
                            }
                            placeholder="Ej: 123, of. 501"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Dirección *</Label>
                        <AddressAutocomplete
                          value={nuevaUbic.direccion}
                          onChange={(v) => setNuevaUbic({ ...nuevaUbic, direccion: v })}
                          onPick={(pick) =>
                            setNuevaUbic((prev) => ({
                              ...prev,
                              direccion: pick.direccion,
                              region: pick.region ?? prev.region,
                              comuna: pick.comuna ?? "",
                              lat: pick.lat,
                              lng: pick.lng,
                            }))
                          }
                          placeholder="Ej: Av. Principal"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Región *</Label>
                          <Select
                            value={nuevaUbic.region}
                            onValueChange={(v) =>
                              setNuevaUbic({ ...nuevaUbic, region: v, comuna: "" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona región" />
                            </SelectTrigger>
                            <SelectContent>
                              {getRegionNames().map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Comuna *</Label>
                          <Select
                            value={nuevaUbic.comuna}
                            onValueChange={(v) =>
                              setNuevaUbic({ ...nuevaUbic, comuna: v })
                            }
                            disabled={!nuevaUbic.region}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona comuna" />
                            </SelectTrigger>
                            <SelectContent>
                              {comunasNuevaUbic.map((c) => (
                                <SelectItem key={c.nombre} value={c.nombre}>
                                  {c.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleCrearUbicacion}
                        disabled={creandoUbicacion}
                      >
                        {creandoUbicacion ? "Guardando…" : "Guardar ubicación"}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecciona un cliente para asociar o crear una ubicación.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tipo + visita + descripción */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de servicio</Label>
                  <Select value={tipoServicio} onValueChange={setTipoServicio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SERVICIO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha de visita técnica</Label>
                  <Input
                    type="datetime-local"
                    value={fechaVisita}
                    onChange={(e) => setFechaVisita(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Descripción de la necesidad *</Label>
                <Textarea
                  rows={5}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="¿Qué necesita el cliente?"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ítems referenciales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Ítems referenciales</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Lo que el cliente cree necesitar. Solo referencial — la cotización formal se hace después.
                </p>
              </div>
              <Dialog open={showAgregarItem} onOpenChange={setShowAgregarItem}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar ítem
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Agregar ítem referencial</DialogTitle>
                  </DialogHeader>
                  <Tabs value={tipoItem} onValueChange={(v: any) => setTipoItem(v)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="producto">
                        <Package className="h-4 w-4 mr-2" /> Producto
                      </TabsTrigger>
                      <TabsTrigger value="servicio">
                        <Wrench className="h-4 w-4 mr-2" /> Servicio
                      </TabsTrigger>
                      <TabsTrigger value="personalizado">
                        <Edit3 className="h-4 w-4 mr-2" /> Personalizado
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="producto" className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar producto…"
                          value={busquedaItem}
                          onChange={(e) => setBusquedaItem(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {productosFiltrados.map((p: any) => (
                          <div
                            key={p.id}
                            className="flex justify-between items-center p-3 hover:bg-muted rounded-lg cursor-pointer"
                            onClick={() => agregarProducto(p)}
                          >
                            <div>
                              <p className="font-medium">{p.nombre}</p>
                              <p className="text-sm text-muted-foreground">{p.codigo}</p>
                            </div>
                            <p className="font-medium">
                              {formatCurrency(Number(p.precio_venta) || 0)}
                            </p>
                          </div>
                        ))}
                        {productosFiltrados.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            No se encontraron productos
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="servicio" className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar servicio…"
                          value={busquedaItem}
                          onChange={(e) => setBusquedaItem(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {serviciosFiltrados.map((s: any) => (
                          <div
                            key={s.id}
                            className="flex justify-between items-center p-3 hover:bg-muted rounded-lg cursor-pointer"
                            onClick={() => agregarServicio(s)}
                          >
                            <div>
                              <p className="font-medium">{s.nombre}</p>
                              <p className="text-sm text-muted-foreground">{s.codigo}</p>
                            </div>
                            <p className="font-medium">
                              {formatCurrency(Number(s.monto_base) || 0)}
                            </p>
                          </div>
                        ))}
                        {serviciosFiltrados.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            No se encontraron servicios
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="personalizado" className="space-y-3">
                      <div>
                        <Label>Descripción *</Label>
                        <Input
                          value={nuevoItemPers.descripcion}
                          onChange={(e) =>
                            setNuevoItemPers({
                              ...nuevoItemPers,
                              descripcion: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Cantidad</Label>
                          <Input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={nuevoItemPers.cantidad}
                            onChange={(e) =>
                              setNuevoItemPers({
                                ...nuevoItemPers,
                                cantidad: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Valor estimado</Label>
                          <Input
                            type="number"
                            min={0}
                            value={nuevoItemPers.valor_estimado}
                            onChange={(e) =>
                              setNuevoItemPers({
                                ...nuevoItemPers,
                                valor_estimado: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button onClick={agregarPersonalizado} className="w-full">
                        Agregar
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sin ítems. Agrega lo que el cliente menciona, con su valor estimado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-24">Cantidad</TableHead>
                      <TableHead className="w-36">Valor estimado</TableHead>
                      <TableHead className="w-32 text-right">Subtotal</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={it.descripcion}
                            onChange={(e) =>
                              actualizarItem(idx, "descripcion", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={it.cantidad}
                            onChange={(e) =>
                              actualizarItem(
                                idx,
                                "cantidad",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={it.valor_estimado}
                            onChange={(e) =>
                              actualizarItem(
                                idx,
                                "valor_estimado",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(it.cantidad * it.valor_estimado)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarItem(idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Adjuntos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Multimedia</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Fotos o videos del lugar / problema. Máx. 10 MB por archivo.
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={subiendo}
                  onChange={(e) => {
                    handleSubirArchivos(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button asChild type="button" variant="outline" size="sm" disabled={subiendo}>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {subiendo ? "Subiendo…" : "Subir archivo"}
                  </span>
                </Button>
              </label>
            </CardHeader>
            <CardContent>
              {adjuntos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sin archivos adjuntos.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {adjuntos.map((a) => (
                    <div
                      key={a.path}
                      className="relative border rounded-md p-2 space-y-1 bg-background"
                    >
                      {a.type.startsWith("image/") ? (
                        <img
                          src={a.url}
                          alt={a.name}
                          className="w-full h-24 object-cover rounded"
                        />
                      ) : a.type.startsWith("video/") ? (
                        <div className="w-full h-24 rounded bg-muted flex items-center justify-center">
                          <Film className="h-6 w-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs truncate" title={a.name}>
                        {a.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => eliminarAdjunto(a)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-80 hover:opacity-100"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ítems</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adjuntos</span>
                <span className="font-medium flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> {adjuntos.length}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Valor estimado</span>
                <span className="font-semibold">{formatCurrency(totalReferencial)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Este monto es referencial y no compromete la cotización formal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
