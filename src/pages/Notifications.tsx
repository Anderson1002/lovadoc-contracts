import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  CheckCheck,
  Clock,
  User,
  FileText,
  DollarSign,
  AlertTriangle,
  Info,
  Calendar,
  LogOut,
  Eye,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
  entity_type?: string;
  entity_id?: string;
  action_user?: {
    name: string;
    avatar?: string;
  };
}

export default function Notifications() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          loadUserProfile(session.user.id);
          loadNotifications();
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
        loadNotifications();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles!profiles_role_id_fkey(name)')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile && profile.roles) {
        setUserRole((profile.roles as any).name);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadNotifications = async () => {
    // Simulamos notificaciones ya que no tenemos una tabla real aún
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nuevo contrato creado',
        message: 'Se ha creado el contrato CON-2024-001 para el cliente Juan Pérez',
        type: 'success',
        read: false,
        created_at: new Date().toISOString(),
        entity_type: 'contract',
        entity_id: '1',
        action_user: {
          name: 'María García',
          avatar: ''
        }
      },
      {
        id: '2',
        title: 'Contrato próximo a vencer',
        message: 'El contrato CON-2023-045 vence en 5 días',
        type: 'warning',
        read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        entity_type: 'contract',
        entity_id: '2'
      },
      {
        id: '3',
        title: 'Pago recibido',
        message: 'Se ha registrado un pago de $2,500,000 para el contrato CON-2024-003',
        type: 'success',
        read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        entity_type: 'payment',
        entity_id: '3',
        action_user: {
          name: 'Carlos López',
          avatar: ''
        }
      },
      {
        id: '4',
        title: 'Nuevo usuario registrado',
        message: 'Ana Rodríguez se ha registrado en el sistema como empleado',
        type: 'info',
        read: true,
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        entity_type: 'user',
        entity_id: '4'
      },
      {
        id: '5',
        title: 'Error en validación',
        message: 'Error al procesar el documento de certificación bancaria',
        type: 'error',
        read: false,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        entity_type: 'document',
        entity_id: '5'
      }
    ];

    setNotifications(mockNotifications);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    
    toast({
      title: "Notificación marcada como leída",
      description: "La notificación se ha marcado como leída",
    });
  };

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    
    toast({
      title: "Todas las notificaciones marcadas como leídas",
      description: "Se han marcado todas las notificaciones como leídas",
    });
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
    
    toast({
      title: "Notificación eliminada",
      description: "La notificación se ha eliminado correctamente",
    });
  };

  const getNotificationIcon = (type: string, entityType?: string) => {
    if (entityType === 'contract') return FileText;
    if (entityType === 'payment') return DollarSign;
    if (entityType === 'user') return User;
    
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'success': return CheckCheck;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'success': return 'text-green-600 bg-green-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'read') return notif.read;
    if (filter === 'unread') return !notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
            <div className="container mx-auto px-4 py-8 max-w-6xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Notificaciones</h1>
                    <p className="text-muted-foreground">
                      Mantente al día con las actividades del sistema
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-sm">
                      {unreadCount} sin leer
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas como leídas
                </Button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  Todas ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  onClick={() => setFilter('unread')}
                  size="sm"
                >
                  Sin leer ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  onClick={() => setFilter('read')}
                  size="sm"
                >
                  Leídas ({notifications.length - unreadCount})
                </Button>
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <Card className="border-2 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                        No hay notificaciones
                      </h3>
                      <p className="text-muted-foreground text-center">
                        {filter === 'all' 
                          ? 'No tienes notificaciones en este momento'
                          : `No tienes notificaciones ${filter === 'read' ? 'leídas' : 'sin leer'}`
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type, notification.entity_type);
                    
                    return (
                      <Card 
                        key={notification.id}
                        className={`border-2 transition-all hover:shadow-md ${
                          !notification.read ? 'border-primary/30 bg-primary/5' : 'border-border'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground">
                                      {notification.title}
                                    </h3>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-primary rounded-full" />
                                    )}
                                  </div>
                                  
                                  <p className="text-muted-foreground mb-3">
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDistanceToNow(new Date(notification.created_at), { 
                                        addSuffix: true, 
                                        locale: es 
                                      })}
                                    </div>
                                    
                                    {notification.action_user && (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-4 h-4">
                                          <AvatarImage src={notification.action_user.avatar} />
                                          <AvatarFallback className="text-xs">
                                            {notification.action_user.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{notification.action_user.name}</span>
                                      </div>
                                    )}
                                    
                                    <Badge variant={getBadgeVariant(notification.type)} className="text-xs">
                                      {notification.type}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <Eye className="w-3 h-3" />
                                      Marcar como leída
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notification.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}