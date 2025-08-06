import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit3,
  Save,
  LogOut,
  Camera
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProfileFormData {
  name: string;
  email: string;
  avatar: string;
}

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<ProfileFormData>();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          loadUserProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, roles!role_id(name, display_name)')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profile && profile.roles) {
        setUserRole((profile.roles as any).name);
        setUserProfile(profile);
        
        // Populate form with current data
        reset({
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar || ""
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!userProfile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          email: data.email,
          avatar: data.avatar || null
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      // Update local state
      setUserProfile({
        ...userProfile,
        name: data.name,
        email: data.email,
        avatar: data.avatar
      });

      setIsEditing(false);
      toast({
        title: "¡Perfil actualizado!",
        description: "Los cambios se han guardado correctamente",
      });

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error al actualizar",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return 'bg-red-500';
      case 'admin': return 'bg-purple-500';
      case 'supervisor': return 'bg-blue-500';
      case 'employee': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar userRole={userRole} />
        <main className="flex-1">
          <header className="h-12 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Bienvenido, {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Mi Área</h1>
                  <p className="text-muted-foreground">
                    Gestiona tu información personal y configuración
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <Avatar className="w-24 h-24">
                            <AvatarImage src={userProfile?.avatar} />
                            <AvatarFallback className="text-2xl bg-primary/10">
                              {userProfile?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                            onClick={() => setIsEditing(true)}
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl">{userProfile?.name}</CardTitle>
                      <CardDescription>{userProfile?.email}</CardDescription>
                      <div className="flex justify-center mt-3">
                        <Badge className={`${getRoleColor(userRole)} text-white`}>
                          {userProfile?.roles?.display_name || userRole}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Miembro desde:</span>
                        <span className="font-medium">
                          {userProfile?.created_at && format(new Date(userProfile.created_at), "MMMM yyyy", { locale: es })}
                        </span>
                      </div>
                      {userProfile?.last_login && (
                        <div className="flex items-center gap-3 text-sm">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Último acceso:</span>
                          <span className="font-medium">
                            {format(new Date(userProfile.last_login), "dd/MM/yyyy", { locale: es })}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Profile Form */}
                <div className="lg:col-span-2">
                  <Card className="border-2 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Edit3 className="w-5 h-5" />
                            Información Personal
                          </CardTitle>
                          <CardDescription>
                            Actualiza tu información de perfil
                          </CardDescription>
                        </div>
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            Editar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              reset();
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-base font-semibold">Nombre Completo</Label>
                            <Input
                              id="name"
                              {...register("name", { required: "El nombre es requerido" })}
                              placeholder="Tu nombre completo"
                              disabled={!isEditing}
                              className="text-lg"
                            />
                            {errors.name && (
                              <p className="text-destructive text-sm">{errors.name.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              {...register("email", { required: "El email es requerido" })}
                              placeholder="tu@email.com"
                              disabled={!isEditing}
                              className="text-lg"
                            />
                            {errors.email && (
                              <p className="text-destructive text-sm">{errors.email.message}</p>
                            )}
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="avatar" className="text-base font-semibold">URL del Avatar</Label>
                            <Input
                              id="avatar"
                              {...register("avatar")}
                              placeholder="https://ejemplo.com/avatar.jpg"
                              disabled={!isEditing}
                              className="text-lg"
                            />
                          </div>
                        </div>

                        {isEditing && (
                          <>
                            <Separator />
                            <div className="flex justify-end gap-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsEditing(false);
                                  reset();
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" />
                                {isLoading ? "Guardando..." : "Guardar Cambios"}
                              </Button>
                            </div>
                          </>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}