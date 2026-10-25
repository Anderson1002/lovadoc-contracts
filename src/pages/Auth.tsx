import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, FileText, ClipboardCheck, Activity, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import khubaLogo from "@/assets/khuba-logo.png";
import loginBackground from "@/assets/khuba-login-background.jpg";
import "@/styles/auth.css";

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
    <main className="khuba-auth">
      <aside className="auth-institutional">
        <img src={loginBackground} alt="" className="auth-background" aria-hidden="true" />
        <div className="auth-institutional-content">
          <img src={khubaLogo} alt="KHUBA - Servicios especializados" className="auth-brand" draggable={false} />
          <h2 className="auth-institutional-title">Gestión digital<br />de <span>contratos</span></h2>
          <p className="auth-description">
            Centraliza la contratación, la radicación de cuentas de cobro y la
            supervisión de contratistas en una sola plataforma segura.
          </p>
          <ul className="auth-features">
            {[
              { icon: FileText, title: "Contratos centralizados", desc: "Un repositorio único, trazable y consultable." },
              { icon: ClipboardCheck, title: "Cuentas de cobro digitales", desc: "Informe, certificación y cuenta de cobro en un flujo." },
              { icon: Activity, title: "Trazabilidad y auditoría", desc: "Historial completo de cada cambio y aprobación." },
            ].map(({ icon: Icon, title, desc }) => (
              <li key={title} className="auth-feature">
                <div className="auth-feature-icon"><Icon aria-hidden="true" /></div>
                <div>
                  <div className="auth-feature-title">{title}</div>
                  <div className="auth-feature-description">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-copyright">© {new Date().getFullYear()} KHUBA · Sistema de gestión hospitalaria v1.0</div>
      </aside>
      <section className="auth-form-panel">
        <div className="auth-form-content">
          <img src={khubaLogo} alt="KHUBA - Servicios especializados" className="auth-form-logo" draggable={false} />
          <h1 className="auth-form-heading">Acceso al sistema</h1>
          <p className="auth-form-subtitle">Ingresa tus credenciales institucionales para continuar.</p>
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="auth-label">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" aria-hidden="true" />
                <Input id="signin-email" name="email" type="email" placeholder="usuario@hospital.com"
                  value={formData.email} onChange={handleInputChange} className="auth-input pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="auth-label">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" aria-hidden="true" />
                <Input id="signin-password" name="password" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={formData.password} onChange={handleInputChange}
                  className="auth-input pl-10 pr-10" required />
                <Button type="button" variant="ghost" size="icon"
                  className="absolute right-0 top-0 h-full text-muted-foreground hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="auth-submit w-full" disabled={isLoading || isResettingPassword}>
              {isLoading ? "Verificando..." : "Ingresar"}<ArrowRight aria-hidden="true" />
            </Button>
          </form>
          <div className="mt-3 text-center">
            <Button type="button" variant="link" className="auth-recovery h-auto py-2 px-0"
              onClick={() => setShowForgotPassword(!showForgotPassword)}>¿Olvidaste tu contraseña?</Button>
          </div>
          {showForgotPassword && (
            <div className="mt-4 p-4 bg-muted rounded-lg border">
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm mb-1">Recuperar contraseña</h3>
                  <p className="text-xs text-muted-foreground">Te enviaremos un enlace al correo registrado para restablecerla.</p>
                </div>
                <Button type="submit" className="w-full" disabled={isResettingPassword || !formData.email} variant="outline">
                  {isResettingPassword ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
              </form>
            </div>
          )}
          <div className="auth-access-notice">
            <span className="auth-security-icon"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
            <p>El acceso es proporcionado por el área administrativa. Si requieres credenciales, contacta a tu supervisor.</p>
          </div>
          <div className="auth-mobile-copyright">© {new Date().getFullYear()} KHUBA · Sistema de gestión hospitalaria v1.0</div>
        </div>
      </section>
    </main>
  );
}
