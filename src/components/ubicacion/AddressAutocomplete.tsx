import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin } from "lucide-react";
import { REGIONES_COMUNAS, REGIONES } from "@/data/regionesComunas";

export interface AddressPick {
  direccion: string;
  comuna: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onPick: (pick: AddressPick) => void;
  id?: string;
  required?: boolean;
  placeholder?: string;
}

interface Feature {
  id: string;
  place_name: string;
  text: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  comuna: string | null;
  region: string | null;
}

// Normaliza: minúsculas, sin tildes
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// Match con catálogo oficial (Prompt 8). Devuelve nombre canónico o null.
function matchRegion(input: string | null): string | null {
  if (!input) return null;
  const n = norm(input);
  return (
    REGIONES.find((r) => norm(r) === n) ??
    REGIONES.find((r) => norm(r).includes(n) || n.includes(norm(r))) ??
    null
  );
}

function matchComuna(input: string | null, region: string | null): string | null {
  if (!input) return null;
  const n = norm(input);
  const pool = region && REGIONES_COMUNAS[region] ? REGIONES_COMUNAS[region] : Object.values(REGIONES_COMUNAS).flat();
  return pool.find((c) => norm(c) === n) ?? null;
}

export function AddressAutocomplete({ value, onChange, onPick, id, required, placeholder }: Props) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null); // null=desconocido
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fetchSuggestions = async (q: string) => {
    if (q.trim().length < 3) {
      setFeatures([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mapbox-geocode", {
        method: "GET" as any,
        // supabase-js no soporta query params directos en invoke; usamos fetch crudo si hace falta.
      });
      // Fallback: invocar vía fetch crudo si invoke no respetó params
      let payload: any = data;
      if (error || !payload) {
        const projectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
        const anonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `https://${projectId}.supabase.co/functions/v1/mapbox-geocode?q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey } });
        payload = await res.json();
      } else {
        // Re-invocar con q como query param vía fetch (invoke no manda params)
        const projectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
        const anonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `https://${projectId}.supabase.co/functions/v1/mapbox-geocode?q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey } });
        payload = await res.json();
      }

      if (payload?.enabled === false) {
        setEnabled(false);
        setFeatures([]);
        return;
      }
      setEnabled(true);
      setFeatures(Array.isArray(payload?.features) ? payload.features : []);
    } catch {
      setEnabled(false);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (v: string) => {
    onChange(v);
    if (enabled === false) return; // sin Mapbox → texto libre
    setOpen(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(v), 300);
  };

  const handleSelect = (f: Feature) => {
    // Dirección: si Mapbox separa address + text, combinar (ej: "123 Avenida X")
    const direccion =
      f.address && f.text ? `${f.text} ${f.address}` : f.place_name?.split(",")[0] ?? f.text ?? "";

    const region = matchRegion(f.region);
    const comuna = matchComuna(f.comuna, region);

    onChange(direccion);
    onPick({
      direccion,
      region,
      // Si Mapbox no devuelve una comuna que matchee el catálogo, dejar null
      // para que el usuario la seleccione manualmente.
      comuna,
      lat: f.lat ?? null,
      lng: f.lng ?? null,
    });
    setOpen(false);
    setFeatures([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => value.length >= 3 && features.length > 0 && setOpen(true)}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && features.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-72 overflow-y-auto">
          {features.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => handleSelect(f)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-start gap-2 border-b last:border-b-0"
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>{f.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
