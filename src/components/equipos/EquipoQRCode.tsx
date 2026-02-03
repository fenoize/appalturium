import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface EquipoQRCodeProps {
  codigo: string;
  marca?: string | null;
  modelo?: string | null;
}

export function EquipoQRCode({ codigo, marca, modelo }: EquipoQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQR();
  }, [codigo]);

  const generateQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // Fondo blanco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Generar patrón QR simple (representación visual)
    // En producción usarías una librería como qrcode.js
    const moduleSize = 8;
    const modules = 21;
    const offset = (size - modules * moduleSize) / 2;

    ctx.fillStyle = "#000000";

    // Patrones de posición (esquinas)
    const drawPositionPattern = (x: number, y: number) => {
      // Cuadrado exterior
      ctx.fillRect(offset + x * moduleSize, offset + y * moduleSize, 7 * moduleSize, 7 * moduleSize);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(offset + (x + 1) * moduleSize, offset + (y + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize);
      ctx.fillStyle = "#000000";
      ctx.fillRect(offset + (x + 2) * moduleSize, offset + (y + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize);
    };

    drawPositionPattern(0, 0);
    drawPositionPattern(14, 0);
    drawPositionPattern(0, 14);

    // Generar datos basados en el código
    const hash = codigo.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 8; i < 13; i++) {
      for (let j = 0; j < 21; j++) {
        if ((hash + i * j) % 3 === 0) {
          ctx.fillRect(offset + i * moduleSize, offset + j * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    for (let i = 0; i < 21; i++) {
      for (let j = 8; j < 13; j++) {
        if ((hash + i + j) % 3 === 0) {
          ctx.fillRect(offset + i * moduleSize, offset + j * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `QR-${codigo}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${codigo}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #000;
              border-radius: 8px;
            }
            .codigo {
              font-size: 24px;
              font-weight: bold;
              font-family: monospace;
              margin-top: 10px;
            }
            .equipo-info {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${canvas.toDataURL("image/png")}" alt="QR Code" />
            <div class="codigo">${codigo}</div>
            ${marca || modelo ? `<div class="equipo-info">${marca || ""} ${modelo || ""}</div>` : ""}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Código QR</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg border">
          <canvas ref={canvasRef} className="w-[200px] h-[200px]" />
        </div>
        
        <p className="font-mono text-lg font-bold">{codigo}</p>
        
        {(marca || modelo) && (
          <p className="text-sm text-muted-foreground">
            {marca} {modelo}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
