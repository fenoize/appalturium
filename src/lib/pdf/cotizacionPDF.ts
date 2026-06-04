import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatCurrency";

interface CotizacionItem {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct?: number | null;
  subtotal: number;
  tipo?: string | null;
}

interface CotizacionPDFInput {
  numero: string;
  created_at: string;
  estado: string;
  moneda: string;
  subtotal?: number | null;
  iva?: number | null;
  total: number;
  notas?: string | null;
  condiciones?: string | null;
  cliente?: {
    tipo?: string | null;
    razon_social?: string | null;
    nombres?: string | null;
    apellidos?: string | null;
    rut?: string | null;
    email?: string | null;
    telefono?: string | null;
  } | null;
  items?: CotizacionItem[];
}

function clienteNombre(c: CotizacionPDFInput["cliente"]) {
  if (!c) return "Sin cliente";
  return c.tipo === "empresa"
    ? c.razon_social || ""
    : `${c.nombres || ""} ${c.apellidos || ""}`.trim();
}

export function generarCotizacionPDF(cotizacion: CotizacionPDFInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN", margin, y);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(cotizacion.numero, pageWidth - margin, y, { align: "right" });
  y += 18;

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Fecha: ${format(new Date(cotizacion.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 12;
  doc.text(`Estado: ${cotizacion.estado.replace("_", " ").toUpperCase()}`, pageWidth - margin, y, {
    align: "right",
  });
  doc.setTextColor(0);
  y += 20;

  // Cliente
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const c = cotizacion.cliente;
  doc.text(clienteNombre(c), margin, y);
  y += 12;
  if (c?.rut) {
    doc.text(`RUT: ${c.rut}`, margin, y);
    y += 12;
  }
  if (c?.email) {
    doc.text(`Email: ${c.email}`, margin, y);
    y += 12;
  }
  if (c?.telefono) {
    doc.text(`Teléfono: ${c.telefono}`, margin, y);
    y += 12;
  }
  y += 8;

  // Items
  const rows =
    cotizacion.items?.map((i) => [
      i.descripcion,
      String(i.cantidad),
      formatCurrency(i.precio_unitario, cotizacion.moneda),
      `${i.descuento_pct ?? 0}%`,
      formatCurrency(i.subtotal, cotizacion.moneda),
    ]) || [];

  autoTable(doc, {
    startY: y,
    head: [["Descripción", "Cant.", "Precio Unit.", "Desc.", "Subtotal"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    columnStyles: {
      1: { halign: "center", cellWidth: 50 },
      2: { halign: "right", cellWidth: 80 },
      3: { halign: "center", cellWidth: 50 },
      4: { halign: "right", cellWidth: 90 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore - lastAutoTable injected by plugin
  y = (doc as any).lastAutoTable.finalY + 16;

  // Totales
  const totalsX = pageWidth - margin;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (cotizacion.subtotal != null) {
    doc.text(`Subtotal: ${formatCurrency(cotizacion.subtotal, cotizacion.moneda)}`, totalsX, y, {
      align: "right",
    });
    y += 14;
  }
  if (cotizacion.iva != null) {
    doc.text(`IVA: ${formatCurrency(cotizacion.iva, cotizacion.moneda)}`, totalsX, y, {
      align: "right",
    });
    y += 14;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`TOTAL: ${formatCurrency(cotizacion.total, cotizacion.moneda)}`, totalsX, y, {
    align: "right",
  });
  y += 24;

  // Notas / Condiciones
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const writeBlock = (titulo: string, contenido: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(titulo, margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(contenido, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 11 + 8;
  };
  if (cotizacion.notas) writeBlock("Notas", cotizacion.notas);
  if (cotizacion.condiciones) writeBlock("Condiciones", cotizacion.condiciones);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "Alturium · desarrollado por diegoulloa.cl",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  doc.save(`cotizacion_${cotizacion.numero}.pdf`);
}
