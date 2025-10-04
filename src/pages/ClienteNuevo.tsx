import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X } from "lucide-react";

export default function ClienteNuevo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<"empresa" | "persona">("empresa");
  const [etiquetaInput, setEtiquetaInput] = useState("");

  const [formData, setFormData] = useState({
    razon_social: "",
    giro: "",
    nombres: "",
    apellidos: "",
    rut: "",
    email: "",
    telefono: "",
    notas: "",
    etiquetas: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const clienteData = {
        tipo,
        razon_social: tipo === "empresa" ? formData.razon_social : null,
        giro: tipo === "empresa" ? formData.giro : null,
        nombres: tipo === "persona" ? formData.nombres : null,
        apellidos: tipo === "persona" ? formData.apellidos : null,
        rut: formData.rut,
        email: formData.email || null,
        telefono: formData.telefono || null,
        notas: formData.notas || null,
        etiquetas: formData.etiquetas,
      };

      const { data, error } = await supabase
        .from("clientes")
        .insert([clienteData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado exitosamente.",
      });

      navigate(`/clientes/${data.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al crear cliente",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const addEtiqueta = () => {
    if (etiquetaInput.trim() && !formData.etiquetas.includes(etiquetaInput.trim())) {
      setFormData({
        ...formData,
        etiquetas: [...formData.etiquetas, etiquetaInput.trim()],
      });
      setEtiquetaInput("");
    }
  };

  const removeEtiqueta = (etiqueta: string) => {
    setFormData({
      ...formData,
      etiquetas: formData.etiquetas.filter((e) => e !== etiqueta),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate("/clientes")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
        <p className="text-muted-foreground">
          Crea un nuevo cliente empresa o persona natural
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Cliente</CardTitle>
            <CardDescription>Selecciona si es empresa o persona natural</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={tipo} onValueChange={(value: "empresa" | "persona") => setTipo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">Empresa (B2B)</SelectItem>
                <SelectItem value="persona">Persona Natural (B2C)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tipo === "empresa" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razón Social *</Label>
                  <Input
                    id="razon_social"
                    value={formData.razon_social}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giro">Giro</Label>
                  <Input
                    id="giro"
                    value={formData.giro}
                    onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                placeholder="12.345.678-9"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="etiquetas">Etiquetas</Label>
              <div className="flex gap-2">
                <Input
                  id="etiquetas"
                  value={etiquetaInput}
                  onChange={(e) => setEtiquetaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEtiqueta();
                    }
                  }}
                  placeholder="Agregar etiqueta"
                />
                <Button type="button" onClick={addEtiqueta} variant="outline">
                  Agregar
                </Button>
              </div>
              {formData.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.etiquetas.map((etiqueta, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {etiqueta}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeEtiqueta(etiqueta)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear Cliente"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/clientes")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}