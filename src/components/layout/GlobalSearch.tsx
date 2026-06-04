import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, ClipboardList, FileText, Package } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  id: string;
  label: string;
  sublabel?: string;
  path: string;
};

type Results = {
  clientes: Result[];
  ordenes: Result[];
  cotizaciones: Result[];
  equipos: Result[];
};

const EMPTY: Results = { clientes: [], ordenes: [], cotizaciones: [], equipos: [] };

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const like = `%${q}%`;

    const timeoutId = window.setTimeout(() => {
      Promise.all([
        supabase
          .from("clientes")
          .select("id, razon_social, nombres, apellidos, rut")
          .or(`razon_social.ilike.${like},nombres.ilike.${like},rut.ilike.${like}`)
          .limit(5),
        supabase
          .from("ordenes_servicio")
          .select("id, numero, descripcion")
          .or(`numero.ilike.${like},descripcion.ilike.${like}`)
          .limit(5),
        supabase
          .from("cotizaciones")
          .select("id, numero")
          .ilike("numero", like)
          .limit(5),
        supabase
          .from("equipos")
          .select("id, codigo_qr, marca, modelo")
          .or(`codigo_qr.ilike.${like},marca.ilike.${like},modelo.ilike.${like}`)
          .limit(5),
      ])
        .then(([c, o, q2, e]) => {
          if (cancelled) return;
          setResults({
            clientes: (c.data ?? []).map((r: any) => ({
              id: r.id,
              label: r.razon_social || [r.nombres, r.apellidos].filter(Boolean).join(" ") || r.rut,
              sublabel: r.rut,
              path: `/clientes/${r.id}`,
            })),
            ordenes: (o.data ?? []).map((r: any) => ({
              id: r.id,
              label: r.numero,
              sublabel: r.descripcion,
              path: `/ordenes-servicio/${r.id}`,
            })),
            cotizaciones: (q2.data ?? []).map((r: any) => ({
              id: r.id,
              label: r.numero,
              path: `/cotizaciones/${r.id}`,
            })),
            equipos: (e.data ?? []).map((r: any) => ({
              id: r.id,
              label: r.codigo_qr,
              sublabel: [r.marca, r.modelo].filter(Boolean).join(" "),
              path: `/inventario/equipos/${r.id}`,
            })),
          });
        })
        .finally(() => !cancelled && setLoading(false));
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  const total =
    results.clientes.length +
    results.ordenes.length +
    results.cotizaciones.length +
    results.equipos.length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative w-full justify-start text-muted-foreground sm:w-72"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar clientes, OTs, cotizaciones, equipos..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim().length < 2 ? (
            <CommandEmpty>Escribe al menos 2 caracteres.</CommandEmpty>
          ) : loading && total === 0 ? (
            <CommandEmpty>Buscando...</CommandEmpty>
          ) : total === 0 ? (
            <CommandEmpty>Sin resultados.</CommandEmpty>
          ) : null}

          {results.clientes.length > 0 && (
            <CommandGroup heading="Clientes">
              {results.clientes.map((r) => (
                <CommandItem key={r.id} value={`cli-${r.id}-${r.label}`} onSelect={() => go(r.path)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{r.label}</span>
                  {r.sublabel && (
                    <span className="ml-2 text-xs text-muted-foreground">{r.sublabel}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.ordenes.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Órdenes de servicio">
                {results.ordenes.map((r) => (
                  <CommandItem key={r.id} value={`ot-${r.id}-${r.label}`} onSelect={() => go(r.path)}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    <span>{r.label}</span>
                    {r.sublabel && (
                      <span className="ml-2 truncate text-xs text-muted-foreground">
                        {r.sublabel}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {results.cotizaciones.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Cotizaciones">
                {results.cotizaciones.map((r) => (
                  <CommandItem key={r.id} value={`cot-${r.id}-${r.label}`} onSelect={() => go(r.path)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{r.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {results.equipos.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Equipos">
                {results.equipos.map((r) => (
                  <CommandItem key={r.id} value={`eq-${r.id}-${r.label}`} onSelect={() => go(r.path)}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>{r.label}</span>
                    {r.sublabel && (
                      <span className="ml-2 text-xs text-muted-foreground">{r.sublabel}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
