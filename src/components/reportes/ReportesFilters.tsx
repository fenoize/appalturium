import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, X } from "lucide-react";
import { useTiposTrabajoReportes } from "@/hooks/useReportes";

interface ReportesFiltersProps {
  filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    tipoTrabajo?: string;
    semaforo?: string;
  };
  onFiltroChange: (key: string, value: string) => void;
  onLimpiar: () => void;
}

export function ReportesFilters({ filtros, onFiltroChange, onLimpiar }: ReportesFiltersProps) {
  const { data: tiposTrabajoData } = useTiposTrabajoReportes();

  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filtros de Reporte</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onLimpiar}>
          <X className="w-4 h-4 mr-2" />
          Limpiar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fecha Inicio */}
        <div className="space-y-2">
          <Label htmlFor="fechaInicio" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Fecha Inicio</span>
          </Label>
          <Input
            id="fechaInicio"
            type="date"
            value={filtros.fechaInicio || ''}
            onChange={(e) => onFiltroChange('fechaInicio', e.target.value)}
          />
        </div>

        {/* Fecha Fin */}
        <div className="space-y-2">
          <Label htmlFor="fechaFin" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Fecha Fin</span>
          </Label>
          <Input
            id="fechaFin"
            type="date"
            value={filtros.fechaFin || ''}
            onChange={(e) => onFiltroChange('fechaFin', e.target.value)}
          />
        </div>

        {/* Tipo de Trabajo */}
        <div className="space-y-2">
          <Label htmlFor="tipoTrabajo">Tipo de Trabajo</Label>
          <Select
            value={filtros.tipoTrabajo || ''}
            onValueChange={(value) => onFiltroChange('tipoTrabajo', value)}
          >
            <SelectTrigger id="tipoTrabajo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {tiposTrabajoData?.map((tipo) => (
                <SelectItem key={tipo.key} value={tipo.key}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Semáforo */}
        <div className="space-y-2">
          <Label htmlFor="semaforo">Estado de Cumplimiento</Label>
          <Select
            value={filtros.semaforo || ''}
            onValueChange={(value) => onFiltroChange('semaforo', value)}
          >
            <SelectTrigger id="semaforo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="verde">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-success mr-2"></span>
                  Verde (Dentro del estándar)
                </span>
              </SelectItem>
              <SelectItem value="amarillo">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-warning mr-2"></span>
                  Amarillo (Dentro de tolerancia)
                </span>
              </SelectItem>
              <SelectItem value="rojo">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-destructive mr-2"></span>
                  Rojo (Fuera de tolerancia)
                </span>
              </SelectItem>
              <SelectItem value="sin_estandar">Sin estándar definido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
