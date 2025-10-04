import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Plus, Search, MapPin, Phone, Mail } from "lucide-react";
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
      setClientes(data || []);
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

    return matchesSearch && matchesTipo;
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
        <Button onClick={() => navigate("/clientes/nuevo")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
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
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="empresa">Empresas</SelectItem>
                <SelectItem value="persona">Personas</SelectItem>
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
      ) : (
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
                    <Badge variant={cliente.tipo === "empresa" ? "default" : "secondary"}>
                      {cliente.tipo === "empresa" ? "Empresa" : "Persona"}
                    </Badge>
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
                {cliente.etiquetas.length > 0 && (
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
      )}
    </div>
  );
}