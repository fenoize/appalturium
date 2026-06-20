import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);

  const redirectByRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role as string);
    if (roles.includes("cliente")) {
      navigate("/portal-cliente");
    } else if (roles.includes("tecnico") && !roles.includes("admin") && !roles.includes("supervisor")) {
      navigate("/portal-tecnico");
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        redirectByRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        redirectByRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido a ALTURIUM",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: window.location.origin + '/auth',
      });

      if (error) throw error;

      setRecoverySent(true);
      toast({
        title: "Instrucciones enviadas",
        description: "Revisa tu correo para restablecer tu contraseña",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al enviar instrucciones",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold">ALTURIUM</CardTitle>
          <CardDescription>
            {showRecovery ? "Recuperar contraseña" : "Sistema de Gestión de Servicios"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showRecovery ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {recoverySent ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Hemos enviado un correo a <strong>{recoveryEmail}</strong> con las instrucciones para restablecer tu contraseña.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowRecovery(false);
                      setRecoverySent(false);
                      setRecoveryEmail("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al inicio de sesión
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">Email</Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar instrucciones"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowRecovery(false);
                      setRecoveryEmail("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al inicio de sesión
                  </Button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Cargando..." : "Iniciar Sesión"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          )}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Sistema de uso interno. Contacte al administrador para obtener acceso.
          </p>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>Versión 0.0.1</p>
        <p className="mt-1">
          Desarrollado por{" "}
          <a 
            href="https://diegoulloa.cl" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            diegoulloa.cl
          </a>
        </p>
      </div>
    </div>
  );
}
