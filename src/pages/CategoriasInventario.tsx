import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FolderTree } from "lucide-react";

interface Categoria {
  id: string;
  nombre: string;
  categoria_padre_id: string | null;
  activa: boolean | null;
  color: string | null;
}

const NONE = "__none__";

export default function CategoriasInventario() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const { data: categorias, isLoading } = useQuery({
    queryKey: ["categorias_inventario_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_inventario")
        .select("id, nombre, categoria_padre_id, activa, color")
        .order("nombre");
      if (error) throw error;
      return data as Categoria[];
    },
  });

  const mut = useMutation({
    mutationFn: async ({ id, padre }: { id: string; padre: string | null }) => {
      const { error } = await (supabase as any)
        .from("categorias_inventario")
        .update({ categoria_padre_id: padre })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_inventario_admin"] });
      qc.invalidateQueries({ queryKey: ["categorias_inventario"] });
      toast({ title: "Categoría actualizada" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.message, variant: "destructive" }),
    onSettled: () => setSaving(null),
  });

  const nombrePorId = useMemo(() => {
    const m = new Map<string, string>();
    (categorias ?? []).forEach((c) => m.set(c.id, c.nombre));
    return m;
  }, [categorias]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FolderTree className="w-7 h-7" /> Categorías de inventario
        </h1>
        <p className="text-muted-foreground">
          Define la categoría padre de cada categoría para agruparlas jerárquicamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Categoría padre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(categorias ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={c.activa ? "default" : "secondary"}>
                        {c.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Select
                        value={c.categoria_padre_id ?? NONE}
                        disabled={saving === c.id}
                        onValueChange={(v) => {
                          setSaving(c.id);
                          mut.mutate({ id: c.id, padre: v === NONE ? null : v });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin padre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>— Sin padre —</SelectItem>
                          {(categorias ?? [])
                            .filter((opt) => opt.id !== c.id)
                            .map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {c.categoria_padre_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Actual: {nombrePorId.get(c.categoria_padre_id) ?? "—"}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
