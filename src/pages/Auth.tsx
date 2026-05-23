import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, FileText, ClipboardCheck, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import khubaLogo from "@/assets/khuba-logo.png";
import khubaLogoLight from "@/assets/khuba-logo-light.png";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message === "Invalid login credentials" 
          ? "Credenciales inválidas. Verifica tu email y contraseña." 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({
        title: "Email requerido",
        description: "Ingresa tu email para recuperar tu contraseña",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: 'https://contratos.teamdev.com.co/set-password'
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Revisa tu email y sigue las instrucciones para restablecer tu contraseña",
      });

      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Error al enviar email",
        description: error.message || "No se pudo enviar el email de recuperación",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };


  return (
    <main className="min-h-screen grid lg:grid-cols-5 bg-background">
      {/* Panel izquierdo institucional */}
      <aside className="hidden lg:flex lg:col-span-3 relative overflow-hidden bg-primary text-primary-foreground p-12 xl:p-16 flex-col justify-between">
        {/* Patrón geométrico decorativo */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full bg-white/5 blur-3xl pointer-events-none"
          aria-hidden
        />

        {/* Logo oficial */}
        <div className="relative">
          <img
            src={khubaLogoLight}
            alt="KHUBA - Servicios Especializados"
            className="w-[300px] max-w-full h-auto select-none"
            draggable={false}
          />
        </div>

        {/* Tagline + bullets */}
        <div className="relative max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1]">
            Gestión digital de contratos
          </h2>
          <p className="mt-5 text-base xl:text-lg text-primary-foreground/80 leading-relaxed">
            Centraliza la contratación, la radicación de cuentas de cobro y la
            supervisión de contratistas en una sola plataforma segura.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              {
                icon: FileText,
                title: "Contratos centralizados",
                desc: "Un repositorio único, trazable y consultable.",
              },
              {
                icon: ClipboardCheck,
                title: "Cuentas de cobro digitales",
                desc: "Informe, certificación y cuenta de cobro en un flujo.",
              },
              {
                icon: Activity,
                title: "Trazabilidad y auditoría",
                desc: "Historial completo de cada cambio y aprobación.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-3">
                <div className="mt-0.5 h-9 w-9 shrink-0 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/15">
                  <Icon className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{title}</div>
                  <div className="text-sm text-primary-foreground/70">
                    {desc}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} KHUBA · Sistema de gestión hospitalaria v1.0
        </div>
      </aside>

      {/* Panel derecho con el formulario */}
      <section className="lg:col-span-2 flex flex-col min-h-screen bg-background">
        {/* Barra superior solo móvil */}
        <div className="lg:hidden bg-primary text-primary-foreground px-6 py-5 flex items-center gap-3">
          <img
            src={khubaLogoLight}
            alt="KHUBA - Servicios Especializados"
            className="h-12 w-auto"
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <img
                src={khubaLogo}
                alt="KHUBA - Servicios Especializados"
                className="w-[180px] h-auto mb-6 -ml-1"
              />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Acceso al sistema
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Ingresa tus credenciales institucionales para continuar.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="usuario@hospital.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
                disabled={isLoading || isResettingPassword}
              >
                {isLoading ? "Verificando..." : "Ingresar"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {showForgotPassword && (
              <div className="mt-4 p-4 bg-muted/40 rounded-lg border">
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Recuperar contraseña</h3>
                    <p className="text-xs text-muted-foreground">
                      Te enviaremos un enlace al correo registrado para restablecerla.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isResettingPassword || !formData.email}
                    variant="outline"
                  >
                    {isResettingPassword ? "Enviando..." : "Enviar enlace de recuperación"}
                  </Button>
                </form>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-border">
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <p>
                  El acceso es proporcionado por el área administrativa. Si requieres
                  credenciales, contacta a tu supervisor.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden px-6 pb-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KHUBA · v1.0
        </div>
      </section>
    </main>
  );
}