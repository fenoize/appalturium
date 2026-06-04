import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCrearOrdenServicio } from "@/hooks/useOrdenesServicio";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Save, ClipboardList, AlertCircle, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrabajoForm } from "@/components/trabajos/TrabajoForm";

const TOTAL_PASOS = 4;

export default function OrdenServicioNueva() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paso, setPaso] = useState(1);
  const [showTrabajoForm, setShowTrabajoForm] = useState(false);
  const [asociarProyecto, setAsociarProyecto] = useState(false);
  const crearOT = useCrearOrdenServicio();

  const [formData, setFormData] = useState({
    cliente_id: "",
    trabajo_id: "",
    proyecto_id: "",
    fase_id: "",
    tarea_id: "",
    ubicacion_id: "",
    tipo_trabajo: "",
    descripcion: "",
    prioridad: "media" as "baja" | "media" | "alta" | "urgente",
    costos_estimado: "",
    fecha_programada_inicio: "",
    fecha_programada_fin: "",
  });

  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("razon_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: trabajos } = useQuery({
    queryKey: ["trabajos", formData.cliente_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trabajos")
        .select("*")
        .eq("cliente_id", formData.cliente_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!formData.cliente_id,
  });

  const { data: proyectos } = useQuery({
    queryKey: ["proyectos", formData.cliente_id, formData.trabajo_id],
    queryFn: async () => {
      let query = supabase
        .from("proyectos")
        .select("*")
        .eq("cliente_id", formData.cliente_id)
        .order("created_at", { ascending: false });

      if (formData.trabajo_id) {
        query = query.eq("trabajo_id", formData.trabajo_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!formData.cliente_id && asociarProyecto,
  });

  const { data: fases } = useQuery({
    queryKey: ["fases", formData.proyecto_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fases_proyecto")
        .select("*")
        .eq("proyecto_id", formData.proyecto_id)
        .order("orden");
      if (error) throw error;
      return data;
    },
    enabled: !!formData.proyecto_id,
  });

  const { data: tareas } = useQuery({
    queryKey: ["tareas", formData.proyecto_id, formData.fase_id],
    queryFn: async () => {
      let query = supabase
        .from("tareas")
        .select("*")
        .eq("proyecto_id", formData.proyecto_id);

      if (formData.fase_id) {
        query = query.eq("fase_id", formData.fase_id);
      }

      const { data, error } = await query.order("orden");
      if (error) throw error;
      return data;
    },
    enabled: !!formData.proyecto_id,
  });

  const { data: ubicaciones } = useQuery({
    queryKey: ["ubicaciones", formData.cliente_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ubicaciones")
        .select("*")
        .eq("cliente_id", formData.cliente_id);
      if (error) throw error;
      return data;
    },
    enabled: !!formData.cliente_id,
  });

  const { data: tiposTrabajo } = useParametrosSistema("work_types");

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      if (field === "cliente_id") {
        newData.trabajo_id = "";
        newData.proyecto_id = "";
        newData.fase_id = "";
        newData.tarea_id = "";
        newData.ubicacion_id = "";
      }
      if (field === "trabajo_id") {
        newData.proyecto_id = "";
        newData.fase_id = "";
        newData.tarea_id = "";
      }
      if (field === "proyecto_id") {
        newData.fase_id = "";
        newData.tarea_id = "";
      }
      if (field === "fase_id") {
        newData.tarea_id = "";
      }

      return newData;
    });
  };

  const handleToggleAsociarProyecto = (checked: boolean) => {
    setAsociarProyecto(checked);
    if (!checked) {
      setFormData(prev => ({
        ...prev,
        proyecto_id: "",
        fase_id: "",
        tarea_id: "",
      }));
    }
  };

  const handleSubmit = async () => {
    await crearOT.mutateAsync({
      cliente_id: formData.cliente_id,
      ubicacion_id: formData.ubicacion_id,
      trabajo_id: formData.trabajo_id || null,
      proyecto_id: asociarProyecto && formData.proyecto_id ? formData.proyecto_id : null,
      fase_id: asociarProyecto && formData.fase_id ? formData.fase_id : null,
      tarea_id: asociarProyecto && formData.tarea_id ? formData.tarea_id : null,
      tipo_trabajo: formData.tipo_trabajo,
      descripcion: formData.descripcion,
      prioridad: formData.prioridad,
      costos_estimado: formData.costos_estimado ? parseFloat(formData.costos_estimado) : undefined,
      fecha_programada_inicio: formData.fecha_programada_inicio || null,
      fecha_programada_fin: formData.fecha_programada_fin || null,
      estado: "draft",
    });
    navigate("/ordenes-servicio");
  };

  const getNombreCliente = (cliente: any) => {
    if (cliente.razon_social) return cliente.razon_social;
    if (cliente.nombres && cliente.apellidos) return `${cliente.nombres} ${cliente.apellidos}`;
    return "Cliente sin nombre";
  };

  // 4 pasos: Cliente -> Trabajo -> Ubicación -> Detalles
  const puedeAvanzar = () => {
    switch (paso) {
      case 1: return formData.cliente_id !== "";
      case 2: return true; // trabajo opcional
      case 3: return formData.ubicacion_id !== "";
      case 4: return formData.tipo_trabajo !== "" && formData.descripcion !== "";
      default: return false;
    }
  };

  const progreso = (paso / TOTAL_PASOS) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center space-x-3">
          <ClipboardList className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Nueva Orden de Servicio</h1>
            <p className="text-primary-foreground/80">
              Paso {paso} de {TOTAL_PASOS}
            </p>
          </div>
        </div>
        <Progress value={progreso} className="mt-4 bg-primary-foreground/20" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {paso === 1 && "Seleccionar Cliente"}
            {paso === 2 && "Seleccionar Trabajo"}
            {paso === 3 && "Seleccionar Ubicación"}
            {paso === 4 && "Detalles del Servicio"}
          </CardTitle>
          <CardDescription>
            {paso === 1 && "Elige el cliente para esta orden de servicio"}
            {paso === 2 && "Asocia un trabajo existente (opcional)"}
            {paso === 3 && "Selecciona la ubicación donde se realizará el servicio"}
            {paso === 4 && "Describe el trabajo, fechas y costos. Asocia a un proyecto si aplica."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paso === 1 && (
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={formData.cliente_id} onValueChange={(value) => handleChange("cliente_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {getNombreCliente(cliente)} - {cliente.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Puedes asociar esta OT a un Trabajo existente o continuar sin asociar uno. Este paso es opcional.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="trabajo">Trabajo (opcional)</Label>
                <Select
                  value={formData.trabajo_id || "__none__"}
                  onValueChange={(value) => handleChange("trabajo_id", value === "__none__" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin trabajo asociado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin trabajo asociado</SelectItem>
                    {trabajos?.map((trabajo) => (
                      <SelectItem key={trabajo.id} value={trabajo.id}>
                        {trabajo.nombre_trabajo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowTrabajoForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nueva Orden de Trabajo
              </Button>

              {(!trabajos || trabajos.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No hay trabajos para este cliente. Usa el botón de arriba para crear uno nuevo.
                </p>
              )}

              <TrabajoForm
                open={showTrabajoForm}
                onOpenChange={(open) => {
                  setShowTrabajoForm(open);
                  if (!open) {
                    queryClient.invalidateQueries({ queryKey: ["trabajos", formData.cliente_id] });
                  }
                }}
                clienteId={formData.cliente_id}
              />
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación *</Label>
              <Select value={formData.ubicacion_id} onValueChange={(value) => handleChange("ubicacion_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {ubicaciones?.map((ubicacion) => (
                    <SelectItem key={ubicacion.id} value={ubicacion.id}>
                      {ubicacion.alias} - {ubicacion.direccion}, {ubicacion.comuna}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {paso === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_trabajo">Tipo de Trabajo *</Label>
                <Select value={formData.tipo_trabajo} onValueChange={(value) => handleChange("tipo_trabajo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de trabajo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposTrabajo?.map((tipo) => (
                      <SelectItem key={tipo.key} value={tipo.key}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe el trabajo a realizar..."
                  value={formData.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select value={formData.prioridad} onValueChange={(value: any) => handleChange("prioridad", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha Inicio Programada</Label>
                  <Input
                    id="fecha_inicio"
                    type="datetime-local"
                    value={formData.fecha_programada_inicio}
                    onChange={(e) => handleChange("fecha_programada_inicio", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha Fin Programada</Label>
                  <Input
                    id="fecha_fin"
                    type="datetime-local"
                    value={formData.fecha_programada_fin}
                    onChange={(e) => handleChange("fecha_programada_fin", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costos">Costo Estimado</Label>
                <Input
                  id="costos"
                  type="number"
                  placeholder="0.00"
                  value={formData.costos_estimado}
                  onChange={(e) => handleChange("costos_estimado", e.target.value)}
                />
              </div>

              {/* Sección opcional: Asociar a Proyecto */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="asociar-proyecto" className="text-base">
                      Asociar a Proyecto
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Opcional. Vincula esta OT a un proyecto, fase o tarea.
                    </p>
                  </div>
                  <Switch
                    id="asociar-proyecto"
                    checked={asociarProyecto}
                    onCheckedChange={handleToggleAsociarProyecto}
                  />
                </div>

                {asociarProyecto && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="proyecto">Proyecto</Label>
                      <Select value={formData.proyecto_id} onValueChange={(value) => handleChange("proyecto_id", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un proyecto" />
                        </SelectTrigger>
                        <SelectContent>
                          {proyectos?.map((proyecto) => (
                            <SelectItem key={proyecto.id} value={proyecto.id}>
                              {proyecto.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(!proyectos || proyectos.length === 0) && (
                        <p className="text-sm text-muted-foreground">
                          No hay proyectos disponibles para este cliente.
                        </p>
                      )}
                    </div>

                    {formData.proyecto_id && fases && fases.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="fase">Fase (opcional)</Label>
                        <Select value={formData.fase_id} onValueChange={(value) => handleChange("fase_id", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin fase específica" />
                          </SelectTrigger>
                          <SelectContent>
                            {fases.map((fase) => (
                              <SelectItem key={fase.id} value={fase.id}>
                                {fase.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.proyecto_id && tareas && tareas.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="tarea">Tarea (opcional)</Label>
                        <Select value={formData.tarea_id} onValueChange={(value) => handleChange("tarea_id", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin tarea específica" />
                          </SelectTrigger>
                          <SelectContent>
                            {tareas.map((tarea) => (
                              <SelectItem key={tarea.id} value={tarea.id}>
                                {tarea.titulo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => paso > 1 ? setPaso(paso - 1) : navigate("/ordenes-servicio")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {paso > 1 ? "Anterior" : "Cancelar"}
            </Button>

            {paso < TOTAL_PASOS ? (
              <Button
                onClick={() => setPaso(paso + 1)}
                disabled={!puedeAvanzar()}
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={crearOT.isPending || !puedeAvanzar()}
              >
                <Save className="h-4 w-4 mr-2" />
                Crear OT
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
