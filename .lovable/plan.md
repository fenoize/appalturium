# Plan: Opción A — Presupuesto interno de costos

Reusar la tabla `presupuestos` como **presupuesto interno de costos** (materiales, mano de obra, otros) vinculado a la **cotización**, no a la OT. La cotización sigue siendo el documento de venta al cliente.

## Flujo resultante

```
1. Solicitud         →  Cotización en estado "borrador" (captura qué necesita el cliente)
2. Presupuesto       →  Presupuesto interno de costos vinculado a la cotización
                        (insumos a comprar, mano de obra, otros, margen → sugiere precio venta)
3. Cotización venta  →  Se completan items con precio venta y se envía al cliente
4. Aceptación        →  Cliente acepta → se genera OT (igual que hoy)
```

## Cambios en base de datos

Migración sobre `presupuestos`:

- Agregar `cotizacion_id uuid` (FK a `cotizaciones`, nullable durante transición).
- Hacer `ot_id` **nullable** (deja de ser obligatorio; un presupuesto puede existir solo con cotización).
- Agregar columnas de costeo:
  - `otros_costos numeric default 0`
  - `costo_total numeric` (generado: `insumos + mano_obra + otros_costos`)
  - `margen_pct numeric default 30` (margen objetivo)
  - `precio_venta_sugerido numeric` (calculado: `costo_total * (1 + margen_pct/100)`)
  - `utilidad_estimada numeric` (calculada en UI: precio venta cotización − costo_total)
- Estructura de `items` (jsonb) pasa a ser **líneas de costo internas** con campos: `tipo` (insumo/mano_obra/otro), `concepto`, `cantidad`, `costo_unit`, `subtotal`, `proveedor` (opcional), `item_inventario_id` (opcional).
- Índice único parcial: un presupuesto activo por cotización.

## Cambios en UI

### Cotización (pestaña nueva "Presupuesto interno")
- En `CotizacionDetalle`: nueva pestaña/sección **"Costos internos"** visible solo a roles internos (no cliente).
- Botón "Crear presupuesto de costos" si no existe.
- Editor de líneas de costo (3 tipos: insumo, mano de obra, otro).
- Resumen lateral: Costo total, Margen %, Precio venta sugerido, Precio venta cotización, **Utilidad estimada** (CLP y %).
- Botón "Aplicar precio sugerido a la cotización" → actualiza items de la cotización.

### Página `Finanzas` / OT
- Tarjeta `PresupuestoCard` actual: renombrar título a **"Presupuesto interno (costos)"** y mostrar costo total + utilidad en lugar de "precio venta al cliente con IVA".
- Quitar acciones "Enviar/Aprobar/Rechazar" (no se envía al cliente, queda interno). Estados pasan a: `borrador` / `confirmado`.

### Lista de cotizaciones
- Columna opcional **"Utilidad estimada"** cuando existe presupuesto interno.

## Archivos a modificar

- `supabase/migrations/...` (nueva)
- `src/hooks/usePresupuestos.ts` — agregar `cotizacion_id`, nuevos campos, hook `usePresupuestoCotizacion(cotizacionId)`.
- `src/components/facturacion/PresupuestoForm.tsx` — reformular como editor de costos.
- `src/components/facturacion/PresupuestoCard.tsx` — vista de costo + utilidad.
- `src/pages/CotizacionDetalle.tsx` — nueva sección de presupuesto interno.
- `src/pages/Finanzas.tsx` — ajustes textuales.
- `mem://features/quotations/workflow-integration` — actualizar memoria con el nuevo flujo.

## Compatibilidad

Los presupuestos existentes (ligados a OT) se mantienen funcionales: `ot_id` sigue presente, solo se vuelve opcional. Se pueden migrar manualmente luego si hace falta vincularlos a la cotización origen.

## Fuera de alcance (siguiente iteración si quieres)

- Tomar costos reales desde `project_cost_entries` para comparar **estimado vs real**.
- Integración con órdenes de compra (`ordenes_compra`) para que las compras del presupuesto generen OC automáticamente.

¿Apruebas para implementar?
