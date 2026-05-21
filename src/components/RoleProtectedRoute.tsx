import { Navigate } from "react-router-dom";
import { useCurrentUserRole, type AppRole } from "@/hooks/useCurrentUserRole";

interface RoleProtectedRouteProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RoleProtectedRoute({
  allowedRoles,
  children,
  redirectTo = "/acceso-denegado",
}: RoleProtectedRouteProps) {
  const { loading, hasAnyRole, userId } = useCurrentUserRole();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-muted-foreground">Verificando permisos...</p>
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
