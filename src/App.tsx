import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PortalClienteLayout } from "@/components/layout/PortalClienteLayout";
import { PortalTecnicoLayout } from "@/components/layout/PortalTecnicoLayout";
import { AdminLayoutOutlet } from "@/components/layout/AdminLayoutOutlet";
import PortalTecnicoTrabajos from "./pages/PortalTecnicoTrabajos";
import PortalTecnicoTrabajoDetalle from "./pages/PortalTecnicoTrabajoDetalle";
import PortalTecnicoPerfil from "./pages/PortalTecnicoPerfil";
import Index from "./pages/Index";
import Configuracion from "./pages/Configuracion";
import Auth from "./pages/Auth";
import Clientes from "./pages/Clientes";
import ClienteNuevo from "./pages/ClienteNuevo";
import ClienteDetalle from "./pages/ClienteDetalle";
import ClienteEditar from "./pages/ClienteEditar";
import OrdenesServicio from "./pages/OrdenesServicio";
import OrdenServicioNueva from "./pages/OrdenServicioNueva";
import OrdenServicioDetalle from "./pages/OrdenServicioDetalle";
import Calendario from "./pages/Calendario";
import Geolocalizacion from "./pages/Geolocalizacion";
import Reportes from "./pages/Reportes";
import Personal from "./pages/Personal";
import EmpleadoDetalle from "./pages/EmpleadoDetalle";
import Finanzas from "./pages/Finanzas";
import Usuarios from "./pages/Usuarios";
import PortalCliente from "./pages/PortalCliente";
import PortalClienteOrdenes from "./pages/PortalClienteOrdenes";
import PortalClienteOrdenDetalle from "./pages/PortalClienteOrdenDetalle";
import PortalClienteSolicitarMantencion from "./pages/PortalClienteSolicitarMantencion";
import PortalClienteDocumentos from "./pages/PortalClienteDocumentos";
import PortalClientePerfil from "./pages/PortalClientePerfil";
import Inventario from "./pages/Inventario";
import Proveedores from "./pages/Proveedores";
import Proyectos from "./pages/Proyectos";
import Tareas from "./pages/Tareas";
import Gantt from "./pages/Gantt";
import Servicios from "./pages/Servicios";
import Cotizaciones from "./pages/Cotizaciones";
import CotizacionNueva from "./pages/CotizacionNueva";
import CotizacionDetalle from "./pages/CotizacionDetalle";
import CotizacionEditar from "./pages/CotizacionEditar";
import CotizacionPublica from "./pages/CotizacionPublica";
import SolicitudesCotizacion from "./pages/SolicitudesCotizacion";
import SolicitudCotizacionDetalle from "./pages/SolicitudCotizacionDetalle";
import SolicitudCotizacionNueva from "./pages/SolicitudCotizacionNueva";
import CategoriasInventario from "./pages/CategoriasInventario";
import SolicitudesCompra from "./pages/SolicitudesCompra";
import EquipoNuevo from "./pages/EquipoNuevo";
import EquipoFicha from "./pages/EquipoFicha";
import EquipoEditar from "./pages/EquipoEditar";
import EquipoPublico from "./pages/EquipoPublico";
import CierreAdministrativo from "./pages/CierreAdministrativo";
import NotFound from "./pages/NotFound";
import AccesoDenegado from "./pages/AccesoDenegado";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>{children}</RoleProtectedRoute>
);
const ClienteRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute allowedRoles={["cliente"]}>{children}</RoleProtectedRoute>
);
const TecnicoRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute allowedRoles={["tecnico"]}>{children}</RoleProtectedRoute>
);

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TooltipProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/cotizacion-publica/:token" element={<CotizacionPublica />} />
            <Route path="/equipo/:codigo" element={<EquipoPublico />} />

            {/* Portal del Cliente */}
            <Route
              path="/portal-cliente/*"
              element={
                <ProtectedRoute>
                  <ClienteRoute>
                    <PortalClienteLayout />
                  </ClienteRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<PortalCliente />} />
              <Route path="ordenes" element={<PortalClienteOrdenes />} />
              <Route path="ordenes/:id" element={<PortalClienteOrdenDetalle />} />
              <Route path="solicitar-mantencion" element={<PortalClienteSolicitarMantencion />} />
              <Route path="documentos" element={<PortalClienteDocumentos />} />
              <Route path="perfil" element={<PortalClientePerfil />} />
            </Route>

            {/* Portal del Técnico */}
            <Route
              path="/portal-tecnico/*"
              element={
                <ProtectedRoute>
                  <TecnicoRoute>
                    <PortalTecnicoLayout />
                  </TecnicoRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="trabajos" replace />} />
              <Route path="trabajos" element={<PortalTecnicoTrabajos />} />
              <Route path="trabajos/:id" element={<PortalTecnicoTrabajoDetalle />} />
              <Route path="perfil" element={<PortalTecnicoPerfil />} />
            </Route>

            {/* Layout de Administración */}
            <Route
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayoutOutlet />
                  </AdminRoute>
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/acceso-denegado" element={<AccesoDenegado />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/nuevo" element={<ClienteNuevo />} />
              <Route path="/clientes/:id" element={<ClienteDetalle />} />
              <Route path="/clientes/:id/editar" element={<ClienteEditar />} />
              <Route path="/ordenes-servicio" element={<OrdenesServicio />} />
              <Route path="/ordenes-servicio/nueva" element={<OrdenServicioNueva />} />
              <Route path="/ordenes-servicio/:id" element={<OrdenServicioDetalle />} />
              <Route path="/cierre-administrativo" element={<CierreAdministrativo />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/geolocalizacion" element={<Geolocalizacion />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/personal" element={<Personal />} />
              <Route path="/empleados" element={<Personal />} />
              <Route path="/empleados/:id" element={<EmpleadoDetalle />} />
              <Route path="/finanzas" element={<Finanzas />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/inventario/categorias" element={<CategoriasInventario />} />
              <Route path="/inventario/equipos/nuevo" element={<EquipoNuevo />} />
              <Route path="/inventario/equipos/:id" element={<EquipoFicha />} />
              <Route path="/inventario/equipos/:id/editar" element={<EquipoEditar />} />
              <Route path="/proveedores" element={<Proveedores />} />
              <Route path="/solicitudes-compra" element={<SolicitudesCompra />} />
              <Route path="/proyectos" element={<Proyectos />} />
              <Route path="/tareas" element={<Tareas />} />
              <Route path="/gantt" element={<Gantt />} />
              <Route path="/servicios" element={<Servicios />} />
              <Route path="/cotizaciones" element={<Cotizaciones />} />
              <Route path="/solicitudes-cotizacion" element={<SolicitudesCotizacion />} />
              <Route path="/solicitudes-cotizacion/:id" element={<SolicitudCotizacionDetalle />} />
              <Route path="/cotizaciones/nueva" element={<CotizacionNueva />} />
              <Route path="/cotizaciones/:id" element={<CotizacionDetalle />} />
              <Route path="/cotizaciones/:id/editar" element={<CotizacionEditar />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
