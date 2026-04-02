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
  const [userProfileData, setUserProfileData] = useState<any>(null);
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
        .select('id, name, email, user_id, proceso_id, roles!profiles_role_id_fkey(name)')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile && profile.roles) {
        setUserRole((profile.roles as any).name);
        setUserProfileData(profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const realNotifications: Notification[] = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // === CONTRATOS PRÓXIMOS A VENCER (todos los roles) ===
      const { data: expiringContracts } = await supabase
        .from('contracts')
        .select('id, contract_number, contract_number_original, end_date, created_at, client_profile_id, profiles!contracts_client_profile_id_fkey(name)')
        .eq('estado', 'en_ejecucion')
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      expiringContracts?.forEach(contract => {
        const daysUntilExpiry = Math.ceil((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const clientName = (contract.profiles as any)?.name || 'Cliente';
        realNotifications.push({
          id: `contract-expiry-${contract.id}`,
          title: 'Contrato próximo a vencer',
          message: `El contrato ${contract.contract_number_original || contract.contract_number} (${clientName}) vence en ${daysUntilExpiry} días`,
          type: daysUntilExpiry <= 7 ? 'error' : 'warning',
          read: false,
          created_at: contract.created_at,
          entity_type: 'contract',
          entity_id: contract.id
        });
      });

      // === CUENTAS PENDIENTES DE REVISIÓN (supervisor, admin, super_admin) ===
      if (['supervisor', 'admin', 'super_admin'].includes(userRole)) {
        const { data: pendingBilling } = await supabase
          .from('billing_accounts')
          .select('id, account_number, amount, created_at, enviado_el, created_by')
          .eq('status', 'pendiente_revision')
          .order('created_at', { ascending: false })
          .limit(10);

        if (pendingBilling && pendingBilling.length > 0) {
          const creatorIds = [...new Set(pendingBilling.map(b => b.created_by))];
          const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', creatorIds);
          const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.name]));

          pendingBilling.forEach(billing => {
            realNotifications.push({
              id: `billing-pending-${billing.id}`,
              title: 'Cuenta de cobro pendiente de revisión',
              message: `Cuenta ${billing.account_number} por $${parseFloat(billing.amount.toString()).toLocaleString('es-CO')} pendiente de revisión`,
              type: 'info',
              read: false,
              created_at: billing.enviado_el || billing.created_at,
              entity_type: 'billing',
              entity_id: billing.id,
              action_user: { name: profileMap[billing.created_by] || 'Contratista' }
            });
          });
        }
      }

      // === CUENTAS RECHAZADAS / DEVUELTAS (employee ve las suyas) ===
      if (userRole === 'employee' && userProfileData?.id) {
        const { data: rejectedBilling } = await supabase
          .from('billing_accounts')
          .select('id, account_number, amount, updated_at, comentario_supervisor')
          .eq('status', 'rechazada')
          .eq('created_by', userProfileData.id)
          .order('updated_at', { ascending: false })
          .limit(10);

        rejectedBilling?.forEach(billing => {
          realNotifications.push({
            id: `billing-rejected-${billing.id}`,
            title: '⚠️ Cuenta de cobro devuelta',
            message: `Tu cuenta ${billing.account_number} fue devuelta. ${billing.comentario_supervisor ? 'Observaciones: ' + billing.comentario_supervisor.substring(0, 100) + (billing.comentario_supervisor.length > 100 ? '...' : '') : 'Revisa las observaciones del supervisor.'}`,
            type: 'error',
            read: false,
            created_at: billing.updated_at,
            entity_type: 'billing',
            entity_id: billing.id
          });
        });
      }

      // === CUENTAS APROBADAS (employee ve las suyas, admin/supervisor ven todas) ===
      {
        let approvedQuery = supabase
          .from('billing_accounts')
          .select('id, account_number, amount, updated_at, created_by')
          .eq('status', 'aprobada')
          .gte('updated_at', sevenDaysAgo.toISOString())
          .order('updated_at', { ascending: false })
          .limit(10);

        if (userRole === 'employee' && userProfileData?.id) {
          approvedQuery = approvedQuery.eq('created_by', userProfileData.id);
        }

        const { data: approvedBilling } = await approvedQuery;

        if (approvedBilling && approvedBilling.length > 0) {
          const creatorIds = [...new Set(approvedBilling.map(b => b.created_by))];
          const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', creatorIds);
          const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.name]));

          approvedBilling.forEach(billing => {
            realNotifications.push({
              id: `billing-approved-${billing.id}`,
              title: 'Cuenta de cobro aprobada',
              message: `La cuenta ${billing.account_number} por $${parseFloat(billing.amount.toString()).toLocaleString('es-CO')} ha sido aprobada`,
              type: 'success',
              read: false,
              created_at: billing.updated_at,
              entity_type: 'billing',
              entity_id: billing.id,
              action_user: { name: profileMap[billing.created_by] || 'Contratista' }
            });
          });
        }
      }

      // === HISTORIAL DE REVISIONES RECIENTES (últimos 7 días) ===
      const { data: recentReviews } = await supabase
        .from('billing_reviews')
        .select(`
          id, action, comments, created_at, billing_account_id,
          billing_accounts!billing_reviews_billing_account_id_fkey(account_number, created_by)
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(15);

      if (recentReviews) {
        // Only show reviews relevant to the current user's role
        recentReviews.forEach(review => {
          const account = review.billing_accounts as any;
          if (!account) return;

          // Employee only sees reviews of their own accounts
          if (userRole === 'employee' && account.created_by !== userProfileData?.id) return;

          // Avoid duplicate with the rejected/approved notifications already added
          const isDuplicate = realNotifications.some(n =>
            n.entity_id === review.billing_account_id &&
            (n.id.startsWith('billing-rejected-') || n.id.startsWith('billing-approved-'))
          );
          if (isDuplicate) return;

          if (review.action === 'rejected') {
            realNotifications.push({
              id: `review-rejected-${review.id}`,
              title: 'Cuenta devuelta por supervisor',
              message: `Cuenta ${account.account_number} fue devuelta. ${review.comments ? review.comments.substring(0, 80) + '...' : ''}`,
              type: 'warning',
              read: false,
              created_at: review.created_at,
              entity_type: 'billing',
              entity_id: review.billing_account_id
            });
          }
        });
      }

      // === CONTRATOS RECIÉN CREADOS (admin, supervisor) ===
      if (['admin', 'super_admin', 'supervisor'].includes(userRole)) {
        const { data: newContracts } = await supabase
          .from('contracts')
          .select('id, contract_number, contract_number_original, created_at, total_amount, client_profile_id, client:profiles!contracts_client_profile_id_fkey(name)')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        newContracts?.forEach(contract => {
          const clientName = (contract.client as any)?.name || 'Cliente';
          realNotifications.push({
            id: `contract-new-${contract.id}`,
            title: 'Nuevo contrato creado',
            message: `Se ha creado el contrato ${contract.contract_number_original || contract.contract_number} para ${clientName} por $${parseFloat(contract.total_amount.toString()).toLocaleString('es-CO')}`,
            type: 'success',
            read: false,
            created_at: contract.created_at,
            entity_type: 'contract',
            entity_id: contract.id
          });
        });
      }

      // === CUENTAS CAUSADAS (employee ve las suyas) ===
      if (userRole === 'employee' && userProfileData?.id) {
        const { data: paidBilling } = await supabase
          .from('billing_accounts')
          .select('id, account_number, amount, updated_at')
          .eq('status', 'causada')
          .eq('created_by', userProfileData.id)
          .gte('updated_at', sevenDaysAgo.toISOString())
          .order('updated_at', { ascending: false })
          .limit(5);

        paidBilling?.forEach(billing => {
          realNotifications.push({
            id: `billing-paid-${billing.id}`,
            title: '💰 Cuenta de cobro causada',
            message: `Tu cuenta ${billing.account_number} por $${parseFloat(billing.amount.toString()).toLocaleString('es-CO')} ha sido causada por Tesorería`,
            type: 'success',
            read: false,
            created_at: billing.updated_at,
            entity_type: 'billing',
            entity_id: billing.id
          });
        });
      }

      realNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(realNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
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