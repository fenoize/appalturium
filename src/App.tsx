import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
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
import EquipoNuevo from "./pages/EquipoNuevo";
import EquipoFicha from "./pages/EquipoFicha";
import EquipoEditar from "./pages/EquipoEditar";
import EquipoPublico from "./pages/EquipoPublico";
import NotFound from "./pages/NotFound";
import AccesoDenegado from "./pages/AccesoDenegado";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>{children}</RoleProtectedRoute>
);
const ClienteRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute allowedRoles={["cliente"]}>{children}</RoleProtectedRoute>
);

const queryClient = new QueryClient();

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TooltipProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/cotizacion-publica/:token" element={<CotizacionPublica />} />
            <Route path="/equipo/:codigo" element={<EquipoPublico />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen w-full">
                    <Sidebar 
                      collapsed={sidebarCollapsed} 
                      onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
                    />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header />
                      <main className="flex-1 overflow-auto p-6">
                        <Routes>
                          <Route path="/" element={<AdminRoute><Index /></AdminRoute>} />
                          <Route path="/acceso-denegado" element={<AccesoDenegado />} />
                          <Route path="/clientes" element={<AdminRoute><Clientes /></AdminRoute>} />
                          <Route path="/clientes/nuevo" element={<AdminRoute><ClienteNuevo /></AdminRoute>} />
                          <Route path="/clientes/:id" element={<AdminRoute><ClienteDetalle /></AdminRoute>} />
                          <Route path="/clientes/:id/editar" element={<AdminRoute><ClienteEditar /></AdminRoute>} />
                          <Route path="/ordenes-servicio" element={<AdminRoute><OrdenesServicio /></AdminRoute>} />
                          <Route path="/ordenes-servicio/nueva" element={<AdminRoute><OrdenServicioNueva /></AdminRoute>} />
                          <Route path="/ordenes-servicio/:id" element={<AdminRoute><OrdenServicioDetalle /></AdminRoute>} />
                          <Route path="/calendario" element={<AdminRoute><Calendario /></AdminRoute>} />
                          <Route path="/geolocalizacion" element={<AdminRoute><Geolocalizacion /></AdminRoute>} />
                          <Route path="/reportes" element={<AdminRoute><Reportes /></AdminRoute>} />
                          <Route path="/personal" element={<AdminRoute><Personal /></AdminRoute>} />
                          <Route path="/empleados" element={<AdminRoute><Personal /></AdminRoute>} />
                          <Route path="/empleados/:id" element={<AdminRoute><EmpleadoDetalle /></AdminRoute>} />
                          <Route path="/finanzas" element={<AdminRoute><Finanzas /></AdminRoute>} />
                          <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
                          <Route path="/portal-cliente" element={<ClienteRoute><PortalCliente /></ClienteRoute>} />
                          <Route path="/portal-cliente/ordenes" element={<ClienteRoute><PortalClienteOrdenes /></ClienteRoute>} />
                          <Route path="/portal-cliente/ordenes/:id" element={<ClienteRoute><PortalClienteOrdenDetalle /></ClienteRoute>} />
                          <Route path="/portal-cliente/solicitar-mantencion" element={<ClienteRoute><PortalClienteSolicitarMantencion /></ClienteRoute>} />
                          <Route path="/portal-cliente/documentos" element={<ClienteRoute><PortalClienteDocumentos /></ClienteRoute>} />
                          <Route path="/portal-cliente/perfil" element={<ClienteRoute><PortalClientePerfil /></ClienteRoute>} />
                          <Route path="/configuracion" element={<AdminRoute><Configuracion /></AdminRoute>} />
                          <Route path="/inventario" element={<AdminRoute><Inventario /></AdminRoute>} />
                          <Route path="/inventario/equipos/nuevo" element={<AdminRoute><EquipoNuevo /></AdminRoute>} />
                          <Route path="/inventario/equipos/:id" element={<AdminRoute><EquipoFicha /></AdminRoute>} />
                          <Route path="/inventario/equipos/:id/editar" element={<AdminRoute><EquipoEditar /></AdminRoute>} />
                          <Route path="/proveedores" element={<AdminRoute><Proveedores /></AdminRoute>} />
                          <Route path="/proyectos" element={<AdminRoute><Proyectos /></AdminRoute>} />
                          <Route path="/tareas" element={<AdminRoute><Tareas /></AdminRoute>} />
                          <Route path="/gantt" element={<AdminRoute><Gantt /></AdminRoute>} />
                          <Route path="/servicios" element={<AdminRoute><Servicios /></AdminRoute>} />
                          <Route path="/cotizaciones" element={<AdminRoute><Cotizaciones /></AdminRoute>} />
                          <Route path="/cotizaciones/nueva" element={<AdminRoute><CotizacionNueva /></AdminRoute>} />
                          <Route path="/cotizaciones/:id" element={<AdminRoute><CotizacionDetalle /></AdminRoute>} />
                          <Route path="/cotizaciones/:id/editar" element={<AdminRoute><CotizacionEditar /></AdminRoute>} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
