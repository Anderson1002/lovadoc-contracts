import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ContractStatusChart } from "@/components/dashboard/ContractStatusChart";
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Users,
  Activity,
  CheckCircle,
  XCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  pendingReview: number;
  cancelledContracts: number;
  totalAmount: number;
  completedPayments: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activeContracts: 0,
    pendingReview: 0,
    cancelledContracts: 0,
    totalAmount: 0,
    completedPayments: 0
  });
  const [contracts, setContracts] = useState<any[]>([]);
  const [recentContracts, setRecentContracts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [userRole, setUserRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user profile and role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles!profiles_role_id_fkey(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile && profile.roles) {
        setUserRole((profile.roles as any).name);
      }

      // Actualizar estados de contratos basándose en fechas antes de cargarlos
      await supabase.rpc('update_contract_statuses');

      // Load contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      // Load payments
      const { data: payments, error: paymentsError } = await supabase
        .from('contract_payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Calculate stats usando el campo status existente
      const totalContracts = contracts?.length || 0;
      const registeredContracts = contracts?.filter(c => c.status === 'draft').length || 0;
      const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;
      const completedContracts = contracts?.filter(c => c.status === 'completed').length || 0;
      const cancelledContracts = contracts?.filter(c => c.status === 'cancelled').length || 0;
      const totalAmount = contracts?.reduce((sum, c) => sum + Number(c.total_amount), 0) || 0;
      const completedPayments = payments?.length || 0;

      setStats({
        totalContracts,
        activeContracts,
        pendingReview: registeredContracts,
        cancelledContracts,
        totalAmount,
        completedPayments
      });

      setContracts(contracts || []);

      // Recent contracts (last 5)
      setRecentContracts(contracts?.slice(0, 5) || []);

      // Chart data con los 5 estados correctos
      const statusCounts = contracts?.reduce((acc: any, contract: any) => {
        acc[contract.status] = (acc[contract.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const chartDataFormatted = [
        { name: 'Registrado', value: statusCounts.draft || 0, color: 'hsl(var(--state-registered))' },
        { name: 'Devuelto', value: statusCounts.returned || 0, color: 'hsl(var(--state-returned))' },
        { name: 'En Ejecución', value: statusCounts.active || 0, color: 'hsl(var(--state-executing))' },
        { name: 'Completado', value: statusCounts.completed || 0, color: 'hsl(var(--state-completed))' },
        { name: 'Cancelado', value: statusCounts.cancelled || 0, color: 'hsl(var(--state-cancelled))' }
      ].filter(item => item.value > 0); // Solo mostrar categorías con datos

      setChartData(chartDataFormatted);

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard ContratosMédicos Pro</h1>
            <p className="text-muted-foreground">
              Resumen general del sistema de gestión de contratos
            </p>
          </div>
          {["super_admin", "admin", "employee"].includes(userRole) && (
            <Button asChild className="flex items-center gap-2">
              <Link to="/contracts/new">
                <FileText className="h-4 w-4" />
                Nuevo Contrato
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Contratos"
            value={stats.totalContracts}
            icon={FileText}
            description="Total de contratos registrados"
          />
          <StatsCard
            title="En Ejecución"
            value={stats.activeContracts}
            icon={TrendingUp}
            description="Contratos activos"
          />
          <StatsCard
            title="Registrados"
            value={stats.pendingReview}
            icon={Clock}
            description="Pendientes de revisión"
          />
          <StatsCard
            title="Completados"
            value={contracts?.filter(c => c.status === 'completed').length || 0}
            icon={CheckCircle}
            description="Contratos finalizados"
          />
          <StatsCard
            title="Valor Total"
            value={formatCurrency(stats.totalAmount)}
            icon={DollarSign}
            description="Valor total de contratos"
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-3">
            <ContractStatusChart data={chartData} />
          </div>
          
          <div className="md:col-span-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Actividad Reciente
                  </CardTitle>
                  <CardDescription>
                    Últimos contratos registrados en el sistema
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contracts">
                    Ver todos
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentContracts.length > 0 ? (
                  recentContracts.map((contract: any) => (
                    <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contract.contract_number}</p>
                          <ContractStatusBadge status={contract.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{contract.client_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono">{formatCurrency(contract.total_amount)}</span>
                          {contract.area_responsable && (
                            <span>• {contract.area_responsable.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/contracts/${contract.id}`}>
                          Ver detalles
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No hay contratos registrados aún</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions for admins */}
        {["super_admin", "admin"].includes(userRole) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Gestiona contratos y usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link to="/contracts/new" className="flex flex-col items-start gap-2">
                    <FileText className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Crear Contrato</div>
                      <div className="text-sm text-muted-foreground">Nuevo contrato médico</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link to="/contracts?status=draft" className="flex flex-col items-start gap-2">
                    <Clock className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Revisar Pendientes</div>
                      <div className="text-sm text-muted-foreground">{stats.pendingReview} contratos</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link to="/billing-accounts" className="flex flex-col items-start gap-2">
                    <DollarSign className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Cuentas de Cobro</div>
                      <div className="text-sm text-muted-foreground">Gestionar facturación</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link to="/users" className="flex flex-col items-start gap-2">
                    <Users className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Administrar Usuarios</div>
                      <div className="text-sm text-muted-foreground">Roles y permisos</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}