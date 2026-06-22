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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FolderTree, Plus, Pencil, Trash2 } from "lucide-react";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria_padre_id: string | null;
  activa: boolean | null;
  color: string | null;
}

const NONE = "__none__";

interface FormState {
  id?: string;
  nombre: string;
  descripcion: string;
  color: string;
  activa: boolean;
  categoria_padre_id: string | null;
}

const emptyForm: FormState = {
  nombre: "",
  descripcion: "",
  color: "#3B82F6",
  activa: true,
  categoria_padre_id: null,
};

export default function CategoriasInventario() {
  const qc = useQueryClient();
  const [savingParent, setSavingParent] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toDelete, setToDelete] = useState<Categoria | null>(null);

  const { data: categorias, isLoading } = useQuery({
    queryKey: ["categorias_inventario_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_inventario")
        .select("id, nombre, descripcion, categoria_padre_id, activa, color")
        .order("nombre");
      if (error) throw error;
      return data as Categoria[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["categorias_inventario_admin"] });
    qc.invalidateQueries({ queryKey: ["categorias_inventario"] });
  };

  const parentMut = useMutation({
    mutationFn: async ({ id, padre }: { id: string; padre: string | null }) => {
      const { error } = await (supabase as any)
        .from("categorias_inventario")
        .update({ categoria_padre_id: padre })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Categoría actualizada" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.message, variant: "destructive" }),
    onSettled: () => setSavingParent(null),
  });

  const saveMut = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        nombre: f.nombre.trim(),
        descripcion: f.descripcion.trim() || null,
        color: f.color || null,
        activa: f.activa,
        categoria_padre_id: f.categoria_padre_id,
      };
      if (!payload.nombre) throw new Error("El nombre es obligatorio");
      if (f.id) {
        const { error } = await (supabase as any)
          .from("categorias_inventario")
          .update(payload)
          .eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("categorias_inventario")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setForm(emptyForm);
      toast({ title: "Categoría guardada" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("categorias_inventario")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setToDelete(null);
      toast({ title: "Categoría eliminada" });
    },
    onError: (e: any) => {
      setToDelete(null);
      toast({
        title: "No se pudo eliminar",
        description:
          e?.message ??
          "La categoría puede tener items asociados o ser padre de otra.",
        variant: "destructive",
      });
    },
  });

  const nombrePorId = useMemo(() => {
    const m = new Map<string, string>();
    (categorias ?? []).forEach((c) => m.set(c.id, c.nombre));
    return m;
  }, [categorias]);

  const openNew = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (c: Categoria) => {
    setForm({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion ?? "",
      color: c.color ?? "#3B82F6",
      activa: c.activa ?? true,
      categoria_padre_id: c.categoria_padre_id,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="w-7 h-7" /> Categorías de inventario
          </h1>
          <p className="text-muted-foreground">
            Crea, edita y organiza las categorías de inventario.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Nueva categoría
        </Button>
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
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(categorias ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {c.color && (
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: c.color }}
                          />
                        )}
                        {c.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.activa ? "default" : "secondary"}>
                        {c.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Select
                        value={c.categoria_padre_id ?? NONE}
                        disabled={savingParent === c.id}
                        onValueChange={(v) => {
                          setSavingParent(c.id);
                          parentMut.mutate({
                            id: c.id,
                            padre: v === NONE ? null : v,
                          });
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(c)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(categorias ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No hay categorías. Crea la primera.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Herramientas"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-10 w-full p-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={form.activa}
                    onCheckedChange={(v) => setForm({ ...form, activa: v })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.activa ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoría padre</Label>
              <Select
                value={form.categoria_padre_id ?? NONE}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    categoria_padre_id: v === NONE ? null : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Sin padre —</SelectItem>
                  {(categorias ?? [])
                    .filter((opt) => opt.id !== form.id)
                    .map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{toDelete?.nombre}". Esta acción no se puede
              deshacer. Si la categoría tiene items o subcategorías asociadas,
              la eliminación fallará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteMut.mutate(toDelete.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
