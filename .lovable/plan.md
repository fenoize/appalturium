# Plan de implementación — Sistema Alturium

Son 28 cambios. Los agrupo en 8 fases ordenadas por dependencia (seguridad primero, luego datos, features y pulido). Cada fase es independiente y puede aprobarse/pausarse por separado.

---

## Fase 1 — Seguridad crítica (RLS y secretos)

1. **`.env.example`**: confirmar que ya tiene placeholders (✅ verificado). No-op de código.
2. **Migración**: eliminar políticas anónimas peligrosas:
   - `cotizaciones`: drop "Lectura pública por token" y "Actualización pública por token".
   - `equipos`, `equipos_movimientos`, `equipos_intervenciones`: drop políticas `USING (true)`.
3. **Migración bucket `firmas`**: `public=false`, drop "Firmas son públicas", crear políticas SELECT/INSERT solo para `authenticated`.
4. **CORS edge functions**: en `respond-cotizacion` (y nuevas funciones), restringir `Access-Control-Allow-Origin` a una lista (`appalturium.lovable.app`, `app.alturium.cl`, dominio preview). 403 si origen no permitido.

⚠️ Riesgo: `EquipoPublico` (QR público sin login) y `CotizacionPublica` (link público por token) dejarán de funcionar hasta completar Fase 2.

---

## Fase 2 — Edge functions para acceso público controlado

5. **`respond-cotizacion`**: añadir handler `GET` con query `?token=…`. Valida token + vencimiento con service_role y devuelve cotización + items + cliente. Actualizar `CotizacionPublica.tsx` para usar este endpoint en vez de Supabase client directo.
6. **Nueva edge function `get-equipo-publico`**: query `?codigo_qr=…`, devuelve solo campos seguros (codigo_qr, marca, modelo, estado, numero_serie, descripcion) + últimas 5 intervenciones (tipo, fecha, descripcion — sin cliente/costo). Actualizar `EquipoPublico.tsx`.

---

## Fase 3 — Backend: triggers, jobs, funciones SQL

7. **Migración fix `get_dashboard_metrics()`**: corregir `inventario_anterior` restando entradas netas del mes (via `movimientos_inventario`).
8. **Migración cron `send-pending-notifications`**: habilitar `pg_net`+`pg_cron`, programar `*/2 * * * *` invocando `send-email`. Requiere `service_role_key` y `supabase_functions_url` en `parametros_sistema` — se documenta en README.
9. **Nueva tabla `planes_mantenimiento`** + edge function `check-mantenimientos` programada `0 8 * * *` que genera OTs preventivas con anticipación de 7 días.
10. **Nueva tabla `ot_asignaciones`** (si no existe ya como `asignaciones_ot`) — verificaré primero; si la actual sirve, solo se reutiliza.
11. **Migración**: agregar columna `origen TEXT DEFAULT 'interno'` a `trabajos`.

---

## Fase 4 — Hooks y queries (consolidación / performance)

12. **`useOrdenServicioDetalle`**: consolidar en un único SELECT con todos los joins (clientes, ubicaciones, trabajos, presupuestos, comunicaciones, informes_finales, ot_estado_logs). Eliminar hooks auxiliares redundantes.
13. **`useClienteData.useClienteOrdenes`**: una sola query con `clientes!inner(user_id)`.
14. **`useCrearOrdenServicio`**: eliminar `numero: ''` (trigger lo asigna).
15. **`useCotizaciones`** (`useCrearCotizacion`/`useActualizar`): leer IVA de `parametros_sistema` y pasarlo a `calcularTotalesCotizacion`.
16. **`CotizacionPublica.cargarCotizacion`**: unificar fetch cotización+items en un solo select (queda obsoleto si se hace Fase 2; aplico solo si Fase 2 no se aprueba).

---

## Fase 5 — Limpieza de componentes existentes

17. **`OrdenServicioDetalle.handleCambiarEstado`**: eliminar insert manual a `ot_estado_logs` (trigger lo hace). Comentario explicativo.
18. **`GlobalSearch`**: debounce 300ms en el useEffect de búsqueda.
19. **`OrdenServicioNueva` Paso 2**: hacer `trabajo_id` opcional; enviar `null` si no se eligió; mostrar nota.
20. **`InformeFinalForm`**: si `yaExiste`, mostrar firma previa con `<img>`, toggle "Mantener firma existente"/"Firmar de nuevo", saltar validación canvas si se mantiene. Agregar Alert "Editando informe existente" y cambiar label de botón a "Actualizar informe".
21. **`Geolocalizacion`**: Select de estado desde `useParametrosSistema('service_statuses')`. **`MapaTecnicos`**: filtrar OTs por `fecha_programada_inicio` entre inicio y fin del día.

---

## Fase 6 — Features nuevas grandes

22. **Mapa real con `react-leaflet`** en `MapaTecnicos`: instalar `react-leaflet` + `leaflet`, importar CSS, centrar en Santiago, marcadores por estado (verde/azul/naranja/gris), popups técnicos + OTs del día.
23. **Tab "Asignaciones"** en `OrdenServicioDetalle`: tabla técnicos asignados (join `personal_fichas`), Dialog "Asignar técnico" con selector de personal activo + rol, botón remover.
24. **Plan de mantenimiento** en `EquipoFicha`: sección con frecuencia + próxima fecha; persistencia en `planes_mantenimiento`. Card "Mantenciones próximas" en Dashboard.
25. **Portal cliente — solicitud**: en `useSolicitarMantencion`, setear `descripcion` y `origen: 'portal'` al trabajo; tras crear OT, crear cotización borrador vinculada. Badge "Portal" naranja en lista de trabajos. Alerta admin para cotizaciones borrador desde portal.

---

## Fase 7 — Generación de PDFs / exportes

26. **Edge function `generate-pdf`** para cotizaciones usando `jsPDF` (Deno-compatible). Sube a Storage `documentos/cotizaciones/{id}.pdf` (crearé bucket privado), actualiza `cotizaciones.pdf_url`. Activar botón en `CotizacionDetalle` con estado "Descargando…".
27. **`Gantt.exportAsPDF`**: instalar `jspdf`, capturar con `html2canvas`, generar PDF landscape, descargar, toast éxito. Eliminar enfoque iframe/print.
28. **`ExportButtons.exportToPDF`** (reportes): ref a tabla, captura con `html2canvas`, descarga PNG (o PDF con jsPDF de paso 27). Habilitar botón.

---

## Fase 8 — Verificación final

- Correr linter Supabase tras cada migración.
- QA manual en preview: login, portal cliente, QR equipo, cotización pública, dashboard, asignaciones, gantt.

---

## Detalles técnicos

- **Compatibilidad jsPDF en Deno**: usaré `npm:jspdf` que funciona en Edge Functions. Si falla, alternativa: generar HTML y usar Puppeteer no es viable → fallback a `pdf-lib` (npm).
- **`react-leaflet` versión**: usar v4 compatible con React 18.
- **`ot_asignaciones` vs `asignaciones_ot`**: la tabla actual se llama `asignaciones_ot`. Reutilizaré esa; no creo duplicada. El componente usará el nombre existente.
- **CORS dinámico**: helper `getCorsHeaders(origin)` reutilizable en todas las edge functions.
- **Secrets requeridos**: ya están `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`. No pediré nuevos.
- **`parametros_sistema` keys necesarios** (Fase 3, job cron): `supabase_functions_url`, `service_role_key`. Te pediré insertarlos manualmente vía Configuración tras la migración (no commitearé el service_role_key).
- **Bucket `documentos`**: lo creo privado vía herramienta storage.

---

## Confirmación necesaria antes de implementar

¿Apruebas las 8 fases en orden, o prefieres priorizar/excluir alguna? Por el volumen (≈28 cambios, 10+ migraciones, 3 edge functions nuevas, 2 dependencias npm) recomiendo aprobar fase por fase para revisar entre cada una.