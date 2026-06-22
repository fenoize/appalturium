// Versión actual de la aplicación (incluida en el bundle).
// Para anunciar una nueva versión a los usuarios, actualiza también `public/version.json`.
export const APP_VERSION = "0.0.4";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.0.4",
    date: "2026-06-22",
    changes: [
      "Nuevo modal de 'Nueva Actualización' que avisa cuando hay una versión disponible y permite actualizar al instante.",
      "Importación masiva de materiales del proveedor Comercializadora FV al inventario.",
      "Corrección: el formulario de edición de productos ahora carga los datos del ítem seleccionado.",
      "Categorías de inventario: ahora se pueden agregar, editar y eliminar.",
      "Detalle de solicitud de cotización dentro del flujo de nueva cotización con ítems y acceso a la solicitud completa.",
      "Autocompletado de direcciones con Mapbox en clientes y solicitudes de cotización.",
    ],
  },
  {
    version: "0.0.3",
    date: "2026-06-01",
    changes: [
      "Mejoras en el módulo de órdenes de servicio, proyectos y cotizaciones.",
      "Portal de clientes y técnicos con accesos diferenciados.",
    ],
  },
];
