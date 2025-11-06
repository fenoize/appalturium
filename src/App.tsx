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
import OrdenesServicio from "./pages/OrdenesServicio";
import OrdenServicioNueva from "./pages/OrdenServicioNueva";
import OrdenServicioDetalle from "./pages/OrdenServicioDetalle";
import Calendario from "./pages/Calendario";
import Geolocalizacion from "./pages/Geolocalizacion";
import Reportes from "./pages/Reportes";
import Personal from "./pages/Personal";
import PortalCliente from "./pages/PortalCliente";
import PortalClienteOrdenes from "./pages/PortalClienteOrdenes";
import PortalClienteOrdenDetalle from "./pages/PortalClienteOrdenDetalle";
import PortalClienteSolicitarMantencion from "./pages/PortalClienteSolicitarMantencion";
import PortalClienteDocumentos from "./pages/PortalClienteDocumentos";
import PortalClientePerfil from "./pages/PortalClientePerfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
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
                          <Route path="/" element={<Index />} />
                          <Route path="/clientes" element={<Clientes />} />
                          <Route path="/clientes/nuevo" element={<ClienteNuevo />} />
                          <Route path="/clientes/:id" element={<ClienteDetalle />} />
                          <Route path="/ordenes-servicio" element={<OrdenesServicio />} />
                          <Route path="/ordenes-servicio/nueva" element={<OrdenServicioNueva />} />
                          <Route path="/ordenes-servicio/:id" element={<OrdenServicioDetalle />} />
                          <Route path="/calendario" element={<Calendario />} />
                          <Route path="/geolocalizacion" element={<Geolocalizacion />} />
                          <Route path="/reportes" element={<Reportes />} />
                          <Route path="/personal" element={<Personal />} />
                          <Route path="/portal-cliente" element={<PortalCliente />} />
                          <Route path="/portal-cliente/ordenes" element={<PortalClienteOrdenes />} />
                          <Route path="/portal-cliente/ordenes/:id" element={<PortalClienteOrdenDetalle />} />
                          <Route path="/portal-cliente/solicitar-mantencion" element={<PortalClienteSolicitarMantencion />} />
                          <Route path="/portal-cliente/documentos" element={<PortalClienteDocumentos />} />
                          <Route path="/portal-cliente/perfil" element={<PortalClientePerfil />} />
                          <Route path="/configuracion" element={<Configuracion />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
