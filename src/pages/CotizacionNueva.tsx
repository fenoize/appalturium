import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useCrearCotizacion, CotizacionItem, calcularSubtotalItem, calcularTotalesCotizacion } from "@/hooks/useCotizaciones";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { useInventario } from "@/hooks/useInventario";
import { useServicios } from "@/hooks/useServicios";
import { formatRut, cleanRut, validateRut } from "@/lib/rut-utils";
import { formatCurrency } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Package, 
  Wrench, 
  Edit3,
  UserPlus,
  Search
} from "lucide-react";

type TipoMoneda = "CLP" | "UF" | "USD";

interface NuevoCliente {
  tipo: "persona" | "empresa";
  rut: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  email?: string;
  telefono?: string;
}

export default function CotizacionNueva() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const crearCotizacion = useCrearCotizacion();

  // Estados del formulario
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [moneda, setMoneda] = useState<TipoMoneda>("CLP");
  const [validezDias, setValidezDias] = useState(30);
  const [notas, setNotas] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [items, setItems] = useState<CotizacionItem[]>([]);
  
  // Diálogo de nuevo cliente
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState<NuevoCliente>({
    tipo: "persona",
    rut: "",
    nombres: "",
    apellidos: "",
    email: "",
  });
  const [creandoCliente, setCreandoCliente] = useState(false);

  // Diálogo de agregar item
  const [showAgregarItem, setShowAgregarItem] = useState(false);
  const [tipoItem, setTipoItem] = useState<"producto" | "servicio" | "personalizado">("producto");
  const [busquedaItem, setBusquedaItem] = useState("");
  const [nuevoItem, setNuevoItem] = useState<Partial<CotizacionItem>>({
    tipo: "personalizado",
    descripcion: "",
    cantidad: 1,
    precio_unitario: 0,
    descuento_pct: 0,
    subtotal: 0,
    orden: 0,
  });

  // Queries
  const { data: clientes } = useQuery({
    queryKey: ["clientes_cotizacion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, rut, tipo, nombres, apellidos, razon_social, email")
        .eq("estado_cliente", "activo")
        .order("razon_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: inventario } = useInventario();
  const { data: servicios } = useServicios();

  const clienteSeleccionado = clientes?.find(c => c.id === clienteId);
  const totales = calcularTotalesCotizacion(items);

  const fechaEmision = useMemo(() => format(new Date(), "dd/MM/yyyy"), []);
  const fechaVencimiento = useMemo(() => format(addDays(new Date(), validezDias), "dd/MM/yyyy"), [validezDias]);

  // Filtrar productos y servicios
  const productosFiltrados = inventario?.filter(p => 
    p.activo && 
    (p.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) ||
     p.codigo.toLowerCase().includes(busquedaItem.toLowerCase()))
  );

  const serviciosFiltrados = servicios?.filter(s => 
    s.activo && 
    (s.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) ||
     s.codigo.toLowerCase().includes(busquedaItem.toLowerCase()))
  );

  const handleCrearCliente = async () => {
    try {
      setCreandoCliente(true);
      const rutFormateado = formatRut(nuevoCliente.rut);
      
      // Verificar si el RUT ya existe
      const { data: existente } = await supabase
        .from("clientes")
        .select("id")
        .eq("rut", cleanRut(rutFormateado))
        .maybeSingle();

      if (existente) {
        toast({
          title: "Cliente ya existe",
          description: "Ya existe un cliente con ese RUT",
          variant: "destructive",
        });
        return;
      }

      const clienteData = {
        rut: rutFormateado,
        tipo: nuevoCliente.tipo,
        email: nuevoCliente.email || null,
        telefono: nuevoCliente.telefono || null,
        ...(nuevoCliente.tipo === "persona" 
          ? { nombres: nuevoCliente.nombres, apellidos: nuevoCliente.apellidos }
          : { razon_social: nuevoCliente.razon_social }),
      };

      const { data, error } = await supabase
        .from("clientes")
        .insert(clienteData)
        .select()
        .single();

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["clientes_cotizacion"] });
      setClienteId(data.id);
      setShowNuevoCliente(false);
      setNuevoCliente({ tipo: "persona", rut: "", nombres: "", apellidos: "", email: "" });
      
      toast({ title: "Cliente creado exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error al crear cliente",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreandoCliente(false);
    }
  };

  const handleAgregarProducto = (producto: any) => {
    const item: CotizacionItem = {
      tipo: "producto",
      item_inventario_id: producto.id,
      descripcion: producto.nombre,
      cantidad: 1,
      precio_unitario: producto.precio_venta || 0,
      descuento_pct: 0,
      subtotal: producto.precio_venta || 0,
      orden: items.length,
    };
    setItems([...items, item]);
    setShowAgregarItem(false);
    setBusquedaItem("");
  };

  const handleAgregarServicio = (servicio: any) => {
    const item: CotizacionItem = {
      tipo: "servicio",
      servicio_id: servicio.id,
      descripcion: servicio.nombre,
      cantidad: 1,
      precio_unitario: servicio.monto_base || 0,
      descuento_pct: 0,
      subtotal: servicio.monto_base || 0,
      orden: items.length,
    };
    setItems([...items, item]);
    setShowAgregarItem(false);
    setBusquedaItem("");
  };

  const handleAgregarItemPersonalizado = () => {
    if (!nuevoItem.descripcion) {
      toast({ title: "Ingrese una descripción", variant: "destructive" });
      return;
    }
    
    const subtotal = calcularSubtotalItem(
      nuevoItem.cantidad || 1,
      nuevoItem.precio_unitario || 0,
      nuevoItem.descuento_pct || 0
    );

    const item: CotizacionItem = {
      tipo: "personalizado",
      descripcion: nuevoItem.descripcion!,
      cantidad: nuevoItem.cantidad || 1,
      precio_unitario: nuevoItem.precio_unitario || 0,
      descuento_pct: nuevoItem.descuento_pct || 0,
      subtotal,
      orden: items.length,
    };
    setItems([...items, item]);
    setShowAgregarItem(false);
    setNuevoItem({
      tipo: "personalizado",
      descripcion: "",
      cantidad: 1,
      precio_unitario: 0,
      descuento_pct: 0,
      subtotal: 0,
      orden: 0,
    });
  };

  const handleActualizarItem = (index: number, campo: keyof CotizacionItem, valor: any) => {
    const nuevosItems = [...items];
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };
    
    // Recalcular subtotal
    nuevosItems[index].subtotal = calcularSubtotalItem(
      nuevosItems[index].cantidad,
      nuevosItems[index].precio_unitario,
      nuevosItems[index].descuento_pct
    );
    
    setItems(nuevosItems);
  };

  const handleEliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (items.length === 0) {
      toast({ title: "Agregue al menos un item", variant: "destructive" });
      return;
    }

    try {
      await crearCotizacion.mutateAsync({
        cotizacion: {
          cliente_id: clienteId,
          moneda,
          validez_dias: validezDias,
          notas: notas || null,
          condiciones: condiciones || null,
        },
        items,
      });
      navigate("/cotizaciones");
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const getClienteLabel = (cliente: any) => {
    return cliente.tipo === "empresa" 
      ? cliente.razon_social 
      : `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Cotización</h1>
          <p className="text-muted-foreground">Crea una cotización para tu cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Datos principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Seleccionar Cliente</Label>
                  <Select value={clienteId || ""} onValueChange={setClienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes?.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {getClienteLabel(cliente)} - {cliente.rut}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={showNuevoCliente} onOpenChange={setShowNuevoCliente}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mt-6">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nuevo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Crear Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tipo de Cliente</Label>
                        <Select 
                          value={nuevoCliente.tipo} 
                          onValueChange={(v: "persona" | "empresa") => 
                            setNuevoCliente({ ...nuevoCliente, tipo: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="persona">Persona Natural</SelectItem>
                            <SelectItem value="empresa">Empresa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>RUT *</Label>
                        <Input
                          value={nuevoCliente.rut}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, rut: e.target.value })}
                          onBlur={(e) => setNuevoCliente({ ...nuevoCliente, rut: formatRut(e.target.value) })}
                          placeholder="12.345.678-9"
                        />
                        {nuevoCliente.rut && !validateRut(nuevoCliente.rut) && (
                          <p className="text-xs text-destructive mt-1">RUT inválido. Verifica el dígito verificador.</p>
                        )}
                      </div>
                      {nuevoCliente.tipo === "persona" ? (
                        <>
                          <div>
                            <Label>Nombres</Label>
                            <Input
                              value={nuevoCliente.nombres}
                              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombres: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Apellidos</Label>
                            <Input
                              value={nuevoCliente.apellidos}
                              onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellidos: e.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <Label>Razón Social</Label>
                          <Input
                            value={nuevoCliente.razon_social}
                            onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                          />
                        </div>
                      )}
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={nuevoCliente.email}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                        />
                      </div>
                      <Button 
                        onClick={handleCrearCliente} 
                        disabled={creandoCliente || !nuevoCliente.rut || !validateRut(nuevoCliente.rut)}
                        className="w-full"
                      >
                        {creandoCliente ? "Creando..." : "Crear Cliente"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {clienteSeleccionado && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{getClienteLabel(clienteSeleccionado)}</p>
                  <p className="text-sm text-muted-foreground">RUT: {clienteSeleccionado.rut}</p>
                  {clienteSeleccionado.email && (
                    <p className="text-sm text-muted-foreground">Email: {clienteSeleccionado.email}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Items de la Cotización</CardTitle>
              <Dialog open={showAgregarItem} onOpenChange={setShowAgregarItem}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Agregar Item</DialogTitle>
                  </DialogHeader>
                  <Tabs value={tipoItem} onValueChange={(v: any) => setTipoItem(v)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="producto">
                        <Package className="h-4 w-4 mr-2" />
                        Producto
                      </TabsTrigger>
                      <TabsTrigger value="servicio">
                        <Wrench className="h-4 w-4 mr-2" />
                        Servicio
                      </TabsTrigger>
                      <TabsTrigger value="personalizado">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Personalizado
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="producto" className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar producto..."
                          value={busquedaItem}
                          onChange={(e) => setBusquedaItem(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {productosFiltrados?.map((producto) => (
                          <div
                            key={producto.id}
                            className="flex justify-between items-center p-3 hover:bg-muted rounded-lg cursor-pointer"
                            onClick={() => handleAgregarProducto(producto)}
                          >
                            <div>
                              <p className="font-medium">{producto.nombre}</p>
                              <p className="text-sm text-muted-foreground">{producto.codigo}</p>
                            </div>
                            <p className="font-medium">{formatCurrency(producto.precio_venta, moneda)}</p>
                          </div>
                        ))}
                        {productosFiltrados?.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            No se encontraron productos
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="servicio" className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar servicio..."
                          value={busquedaItem}
                          onChange={(e) => setBusquedaItem(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {serviciosFiltrados?.map((servicio) => (
                          <div
                            key={servicio.id}
                            className="flex justify-between items-center p-3 hover:bg-muted rounded-lg cursor-pointer"
                            onClick={() => handleAgregarServicio(servicio)}
                          >
                            <div>
                              <p className="font-medium">{servicio.nombre}</p>
                              <p className="text-sm text-muted-foreground">{servicio.codigo}</p>
                            </div>
                            <p className="font-medium">{formatCurrency(servicio.monto_base, moneda)}</p>
                          </div>
                        ))}
                        {serviciosFiltrados?.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            No se encontraron servicios
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="personalizado" className="space-y-4">
                      <div>
                        <Label>Descripción *</Label>
                        <Input
                          value={nuevoItem.descripcion}
                          onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })}
                          placeholder="Descripción del item"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Cantidad</Label>
                          <Input
                            type="number"
                            value={nuevoItem.cantidad}
                            onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: parseFloat(e.target.value) || 0 })}
                            min={0.01}
                            step={0.01}
                          />
                        </div>
                        <div>
                          <Label>Precio Unitario</Label>
                          <Input
                            type="number"
                            value={nuevoItem.precio_unitario}
                            onChange={(e) => setNuevoItem({ ...nuevoItem, precio_unitario: parseFloat(e.target.value) || 0 })}
                            min={0}
                          />
                        </div>
                        <div>
                          <Label>Descuento %</Label>
                          <Input
                            type="number"
                            value={nuevoItem.descuento_pct}
                            onChange={(e) => setNuevoItem({ ...nuevoItem, descuento_pct: parseFloat(e.target.value) || 0 })}
                            min={0}
                            max={100}
                          />
                        </div>
                      </div>
                      <Button onClick={handleAgregarItemPersonalizado} className="w-full">
                        Agregar Item
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay items agregados. Haz clic en "Agregar Item" para comenzar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-24">Cantidad</TableHead>
                      <TableHead className="w-32">Precio Unit.</TableHead>
                      <TableHead className="w-24">Desc. %</TableHead>
                      <TableHead className="w-32 text-right">Subtotal</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={item.descripcion}
                            onChange={(e) => handleActualizarItem(index, "descripcion", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => handleActualizarItem(index, "cantidad", parseFloat(e.target.value) || 0)}
                            min={0.01}
                            step={0.01}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.precio_unitario}
                            onChange={(e) => handleActualizarItem(index, "precio_unitario", parseFloat(e.target.value) || 0)}
                            min={0}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.descuento_pct}
                            onChange={(e) => handleActualizarItem(index, "descuento_pct", parseFloat(e.target.value) || 0)}
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.subtotal, moneda)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminarItem(index)}
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

          {/* Notas y condiciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas y Condiciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas adicionales para el cliente..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Condiciones</Label>
                <Textarea
                  value={condiciones}
                  onChange={(e) => setCondiciones(e.target.value)}
                  placeholder="Condiciones comerciales..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: Resumen */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Moneda</Label>
                  <Select value={moneda} onValueChange={(v: TipoMoneda) => setMoneda(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                      <SelectItem value="UF">UF</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Validez (días)</Label>
                  <Input
                    type="number"
                    value={validezDias}
                    onChange={(e) => setValidezDias(parseInt(e.target.value) || 30)}
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de emisión</Label>
                  <Input value={fechaEmision} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Válida hasta</Label>
                  <Input value={fechaVencimiento} readOnly className="bg-muted" />
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totales.subtotal, moneda)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span>{formatCurrency(totales.impuestos, moneda)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(totales.total, moneda)}</span>
                </div>
              </div>

              <Button 
                onClick={handleGuardar} 
                className="w-full" 
                size="lg"
                disabled={crearCotizacion.isPending || items.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {crearCotizacion.isPending ? "Guardando..." : "Guardar Cotización"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
