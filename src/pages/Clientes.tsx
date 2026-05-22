import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, User, Plus, Search, MapPin, Phone, Mail, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Cliente = {
  id: string;
  tipo: "empresa" | "persona";
  razon_social: string | null;
  giro: string | null;
  nombres: string | null;
  apellidos: string | null;
  rut: string;
  email: string | null;
  telefono: string | null;
  industria: string | null;
  segmento: string | null;
  estado_cliente: string;
  etiquetas: string[];
  created_at: string;
};

export default function Clientes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [industriaFilter, setIndustriaFilter] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: industrias, isLoading: industriasLoading } = useQuery({
    queryKey: ["industrias-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("industria")
        .neq("industria", null);
      if (error) throw error;
      const unicas = [...new Set((data || []).map((c) => c.industria))];
      return unicas as string[];
    },
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientes(data as any || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar clientes",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch =
      cliente.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (cliente.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (cliente.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (cliente.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesTipo = tipoFilter === "todos" || cliente.tipo === tipoFilter;
    const matchesEstado = estadoFilter === "todos" || cliente.estado_cliente === estadoFilter;
    const matchesIndustria = industriaFilter === "todos" || cliente.industria === industriaFilter;

    return matchesSearch && matchesTipo && matchesEstado && matchesIndustria;
  });

  const getClienteName = (cliente: Cliente) => {
    if (cliente.tipo === "empresa") {
      return cliente.razon_social || "Sin nombre";
    }
    return `${cliente.nombres} ${cliente.apellidos}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona empresas y personas naturales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => navigate("/clientes/nuevo")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra clientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por RUT, email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="empresa">Empresas</SelectItem>
                <SelectItem value="persona">Personas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={industriaFilter} onValueChange={setIndustriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Industria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las industrias</SelectItem>
                <SelectItem value="climatizacion">Climatización</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="residencial">Residencial</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="hospitalaria">Hospitalaria</SelectItem>
                <SelectItem value="educacion">Educación</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando clientes...</p>
        </div>
      ) : filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron clientes.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClientes.map((cliente) => (
            <Card
              key={cliente.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/clientes/${cliente.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {cliente.tipo === "empresa" ? (
                      <Building2 className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                    <div className="flex gap-2">
                      <Badge variant={cliente.tipo === "empresa" ? "default" : "secondary"}>
                        {cliente.tipo === "empresa" ? "Empresa" : "Persona"}
                      </Badge>
                      <Badge variant={cliente.estado_cliente === "activo" ? "default" : cliente.estado_cliente === "suspendido" ? "destructive" : "secondary"}>
                        {cliente.estado_cliente}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardTitle className="mt-2">{getClienteName(cliente)}</CardTitle>
                {cliente.tipo === "empresa" && cliente.giro && (
                  <CardDescription>{cliente.giro}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>RUT: {cliente.rut}</span>
                </div>
                {cliente.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{cliente.email}</span>
                  </div>
                )}
                {cliente.telefono && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{cliente.telefono}</span>
                  </div>
                )}
                {cliente.etiquetas?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cliente.etiquetas.map((etiqueta, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {etiqueta}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nombre / Razón Social</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Industria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow 
                  key={cliente.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {cliente.tipo === "empresa" ? (
                        <Building2 className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                      <Badge variant={cliente.tipo === "empresa" ? "default" : "secondary"}>
                        {cliente.tipo === "empresa" ? "Empresa" : "Persona"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{getClienteName(cliente)}</TableCell>
                  <TableCell>{cliente.rut}</TableCell>
                  <TableCell>{cliente.email || "-"}</TableCell>
                  <TableCell>{cliente.telefono || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={cliente.estado_cliente === "activo" ? "default" : cliente.estado_cliente === "suspendido" ? "destructive" : "secondary"}>
                      {cliente.estado_cliente}
                    </Badge>
                  </TableCell>
                  <TableCell>{cliente.industria || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}