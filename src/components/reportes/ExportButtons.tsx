import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { KPIData } from "@/hooks/useReportes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportButtonsProps {
  data: KPIData[];
}

function formatMinutes(minutes?: number) {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function getSemaforoLabel(semaforo?: string) {
  switch (semaforo) {
    case 'verde':
      return 'Cumple';
    case 'amarillo':
      return 'Tolerancia';
    case 'rojo':
      return 'Excedido';
    default:
      return 'Sin dato';
  }
}

export function ExportButtons({ data }: ExportButtonsProps) {
  const { toast } = useToast();

  const exportToCSV = () => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin datos",
        description: "No hay datos para exportar",
      });
      return;
    }

    const headers = [
      'OT',
      'Fecha',
      'Cliente',
      'Tipo Trabajo',
      'Comuna',
      'Ciudad',
      'TTR (min)',
      'TTS (min)',
      'Cumplimiento',
      'Facturado',
      'Costos',
      'Margen',
    ];

    const rows = data.map(row => [
      row.ot_numero,
      format(new Date(row.fecha_creacion), "dd/MM/yyyy HH:mm", { locale: es }),
      row.cliente_razon_social || row.cliente_nombre || 'N/A',
      row.tipo_trabajo,
      row.comuna || 'N/A',
      row.ciudad || 'N/A',
      row.tiempo_respuesta_min || 'N/A',
      row.tiempo_servicio_min || 'N/A',
      getSemaforoLabel(row.semaforo),
      row.facturado,
      row.costos,
      row.margen,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_kpis_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportado exitosamente",
      description: `Se exportaron ${data.length} registros a CSV`,
    });
  };

  const exportToPDF = () => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin datos",
        description: "No hay datos para exportar",
      });
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de KPIs - Órdenes de Servicio", 40, 40);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      40,
      56
    );
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 75,
      head: [["OT", "Fecha", "Cliente", "Tipo", "TTR", "TTS", "Cumpl.", "Facturado", "Margen"]],
      body: data.map((row) => [
        row.ot_numero,
        format(new Date(row.fecha_creacion), "dd/MM/yy"),
        (row.cliente_razon_social || row.cliente_nombre || "N/A").slice(0, 30),
        row.tipo_trabajo,
        formatMinutes(row.tiempo_respuesta_min),
        formatMinutes(row.tiempo_servicio_min),
        getSemaforoLabel(row.semaforo),
        `$${(row.facturado || 0).toLocaleString("es-CL")}`,
        `$${(row.margen || 0).toLocaleString("es-CL")}`,
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      margin: { left: 40, right: 40 },
    });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "Alturium · desarrollado por diegoulloa.cl",
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );

    doc.save(`reporte_kpis_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);

    toast({
      title: "Exportado exitosamente",
      description: `Se exportaron ${data.length} registros a PDF`,
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Button onClick={exportToCSV} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Exportar CSV
      </Button>
      <Button onClick={exportToPDF} variant="outline" size="sm">
        <FileText className="w-4 h-4 mr-2" />
        Exportar PDF
      </Button>
    </div>
  );
}
