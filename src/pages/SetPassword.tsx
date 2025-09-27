import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initFromEmailLink = async () => {
      try {
        const url = new URL(window.location.href);
        const search = url.searchParams;
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setInitializing(false);
          return;
        }

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          setInitializing(false);
          return;
        }

        const token_hash = hashParams.get("token_hash") || search.get("token_hash");
        const type = (hashParams.get("type") || search.get("type") || "invite") as
          | "invite" | "recovery" | "email_change" | "magiclink" | "signup";
        if (token_hash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (error) throw error;
        }
      } catch (error: any) {
        console.error("Init from email link error:", error);
        toast({
          title: "Enlace inválido o expirado",
          description: "Solicita una nueva invitación desde el área de usuarios.",
          variant: "destructive",
        });
      } finally {
        setInitializing(false);
      }
    };

    initFromEmailLink();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      // Validate password length
      if (formData.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      // Ensure we have a session from the invitation link
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sesión no encontrada. El enlace puede haber expirado. Pide una nueva invitación.');
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) throw updateError;

      toast({
        title: "¡Contraseña configurada!",
        description: "Tu cuenta ha sido activada exitosamente. Ahora puedes iniciar sesión.",
      });

      // Redirect to login page
      setTimeout(() => {
        navigate("/auth");
      }, 2000);

    } catch (error: any) {
      console.error('Password setup error:', error);
      toast({
        title: "Error al configurar contraseña",
        description: error.message || "Ocurrió un error. Verifica que el link sea válido y no haya expirado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Maktub</h1>
          <p className="text-muted-foreground">Gestión Digital de Contratos</p>
        </div>

        {/* Password Setup Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle>Configura tu Contraseña</CardTitle>
            <CardDescription>
              Establece una contraseña segura para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    minLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    minLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || initializing}
              >
                {isLoading ? "Configurando..." : "Configurar Contraseña"}
              </Button>

              {initializing && (
                <p className="text-xs text-center text-muted-foreground">Validando invitación...</p>
              )}
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
              <div className="text-center space-y-2">
                <h3 className="font-medium text-sm">Requisitos de Contraseña</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Mínimo 6 caracteres</li>
                  <li>• Las contraseñas deben coincidir</li>
                  <li>• Recomendado: incluir mayúsculas, números y símbolos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Sistema de gestión hospitalaria v1.0
        </div>
      </div>
    </div>
  );
}