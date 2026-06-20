import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, FileText, Calendar, ClipboardList, BarChart3, Edit } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { useEmpleadoDocumentos } from "@/hooks/useEmpleadoDocumentos";
import { useEmpleadoAusencias } from "@/hooks/useEmpleadoAusencias";
import { OrdenesServicioList } from "@/components/ordenes/OrdenesServicioList";

export default function EmpleadoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: empleado, isLoading } = useQuery({
    queryKey: ["empleado", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_fichas")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: documentos = [] } = useEmpleadoDocumentos(id);
  const { data: ausencias = [] } = useEmpleadoAusencias(id);

  // Get assigned OTs for this employee
  const { data: asignaciones = [] } = useQuery({
    queryKey: ["asignaciones_empleado", empleado?.user_id],
    enabled: !!empleado?.user_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asignaciones_ot")
        .select(`*, ordenes_servicio(numero, descripcion, estado, fecha_programada_inicio, clientes(razon_social, nombres, apellidos))`)
        .eq("personal_id", empleado!.user_id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse"><div className="h-8 bg-muted rounded w-1/4 mb-4" /><div className="h-64 bg-muted rounded" /></div>;
  }

  if (!empleado) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Empleado no encontrado</p>
        <Button onClick={() => navigate("/empleados")} className="mt-4">Volver</Button>
      </div>
    );
  }

  const antiguedad = differenceInYears(new Date(), new Date(empleado.fecha_ingreso));

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/empleados")}>
        <ArrowLeft className="h-4 w-4 mr-2" />Volver a Empleados
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{empleado.nombre_completo}</h1>
            <p className="text-muted-foreground">{empleado.rol_operativo}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={empleado.activo ? "default" : "secondary"}>
                {empleado.activo ? "Activo" : "Inactivo"}
              </Badge>
              <Badge variant="outline">{empleado.rol_operativo}</Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/empleados/${id}/editar`)}>
          <Edit className="h-4 w-4 mr-2" />Editar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general"><User className="h-4 w-4 mr-2" />General</TabsTrigger>
          <TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-2" />Documentos ({documentos.length})</TabsTrigger>
          <TabsTrigger value="ausencias"><Calendar className="h-4 w-4 mr-2" />Ausencias ({ausencias.length})</TabsTrigger>
          <TabsTrigger value="asignaciones"><ClipboardList className="h-4 w-4 mr-2" />Asignaciones ({asignaciones.length})</TabsTrigger>
          <TabsTrigger value="metricas"><BarChart3 className="h-4 w-4 mr-2" />Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Datos Personales</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">RUT</p><p className="font-medium">{empleado.rut}</p></div>
                  <div><p className="text-sm text-muted-foreground">Domicilio</p><p className="font-medium">{empleado.domicilio || "-"}</p></div>
                </div>
                {empleado.especialidad?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Especialidades</p>
                    <div className="flex flex-wrap gap-1">
                      {empleado.especialidad.map((e: string) => <Badge key={e} variant="secondary">{e}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Datos Laborales</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Fecha Ingreso</p><p className="font-medium">{format(new Date(empleado.fecha_ingreso), "dd/MM/yyyy", { locale: es })}</p></div>
                  <div><p className="text-sm text-muted-foreground">Antigüedad</p><p className="font-medium">{antiguedad} años</p></div>
                  {empleado.fecha_termino && (
                    <div><p className="text-sm text-muted-foreground">Fecha Término</p><p className="font-medium text-destructive">{format(new Date(empleado.fecha_termino), "dd/MM/yyyy", { locale: es })}</p></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos del Empleado</CardTitle>
              <Button size="sm">Agregar Documento</Button>
            </CardHeader>
            <CardContent>
              {documentos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay documentos registrados</p>
              ) : (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-sm text-muted-foreground">{doc.tipo}</p>
                      </div>
                      <Badge variant={doc.estado === "vigente" ? "default" : "destructive"}>{doc.estado}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ausencias">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historial de Ausencias</CardTitle>
              <Button size="sm">Registrar Ausencia</Button>
            </CardHeader>
            <CardContent>
              {ausencias.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay ausencias registradas</p>
              ) : (
                <div className="space-y-2">
                  {ausencias.map((aus) => (
                    <div key={aus.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{aus.tipo}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(aus.fecha_inicio), "dd/MM/yyyy")} - {format(new Date(aus.fecha_fin), "dd/MM/yyyy")} ({aus.dias_totales} días)
                        </p>
                      </div>
                      <Badge variant={aus.estado === "aprobada" ? "default" : aus.estado === "rechazada" ? "destructive" : "secondary"}>{aus.estado}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asignaciones">
          <Card>
            <CardHeader><CardTitle>Órdenes de Servicio Asignadas</CardTitle></CardHeader>
            <CardContent>
              {asignaciones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay asignaciones</p>
              ) : (
                <div className="space-y-2">
                  {asignaciones.map((asig: any) => (
                    <div key={asig.id} className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/ordenes-servicio/${asig.ot_id}`)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{asig.ordenes_servicio?.numero}</p>
                          <p className="text-sm text-muted-foreground">{asig.ordenes_servicio?.descripcion?.slice(0, 60)}...</p>
                        </div>
                        <Badge>{asig.ordenes_servicio?.estado}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metricas">
          <Card>
            <CardHeader><CardTitle>Métricas de Rendimiento</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold">{asignaciones.length}</p>
                  <p className="text-sm text-muted-foreground">OTs Asignadas</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold">{asignaciones.filter((a: any) => a.ordenes_servicio?.estado === "finalizado").length}</p>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold">{antiguedad}</p>
                  <p className="text-sm text-muted-foreground">Años Antigüedad</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold">{ausencias.filter((a) => a.tipo === "vacaciones").reduce((acc, a) => acc + a.dias_totales, 0)}</p>
                  <p className="text-sm text-muted-foreground">Días Vacaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
