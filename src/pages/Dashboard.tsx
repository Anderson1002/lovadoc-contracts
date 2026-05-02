import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { ContractStatusChart } from "@/components/dashboard/ContractStatusChart";
import { ProcessCard } from "@/components/dashboard/ProcessCard";
import { UpcomingExpirations } from "@/components/dashboard/UpcomingExpirations";
import { BillingSummaryCard } from "@/components/dashboard/BillingSummaryCard";
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Bell
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { JuridicaDashboard } from "@/components/dashboard/JuridicaDashboard";

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  pendingReview: number;
  cancelledContracts: number;
  totalAmount: number;
  completedPayments: number;
  returnedContracts: number;
  pendingBillingReview: number;
}

// Helper function to get dashboard configuration based on role
const getDashboardConfig = (role: string) => {
  switch (role) {
    case 'employee':
      return {
        title: 'Mis Contratos',
        description: 'Estado de tus contratos y cuentas de cobro',
        recentActivityTitle: 'Mis Últimos Contratos',
        recentActivityDescription: 'Contratos que has registrado'
      };
    case 'supervisor':
      return {
        title: 'Dashboard - Mi Proceso',
        description: 'Supervisión de contratos de tu área',
        recentActivityTitle: 'Actividad Reciente - Mi Equipo',
        recentActivityDescription: 'Últimos contratos del proceso'
      };
    case 'juridica':
      return {
        title: 'Dashboard Jurídica',
        description: 'Gestión integral de contratos del sistema',
        recentActivityTitle: 'Actividad Reciente',
        recentActivityDescription: 'Últimos contratos registrados en el sistema'
      };
    default: // admin, super_admin
      return {
        title: 'Dashboard ContratosMédicos Pro',
        description: 'Resumen general del sistema de gestión de contratos',
        recentActivityTitle: 'Actividad Reciente',
        recentActivityDescription: 'Últimos contratos registrados en el sistema'
      };
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activeContracts: 0,
    pendingReview: 0,
    cancelledContracts: 0,
    totalAmount: 0,
    completedPayments: 0,
    returnedContracts: 0,
    pendingBillingReview: 0
  });
  const [contracts, setContracts] = useState<any[]>([]);
  const [recentContracts, setRecentContracts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [billingSummary, setBillingSummary] = useState({ drafts: 0, pending: 0, approved: 0, rejected: 0 });
  const [userRole, setUserRole] = useState<string | null>(null);
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

      const roleName = profile?.roles ? (profile.roles as any).name : 'employee';
      setUserRole(roleName);

      // Jurídica usa un dashboard dedicado sobre la tabla 'contract' (externa).
      // Evitamos cargar datos del flujo interno para este rol.
      if (roleName === 'juridica') {
        setLoading(false);
        return;
      }

      // Load contracts - employees only see their own
      let contractsQuery = supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (roleName === 'employee') {
        contractsQuery = contractsQuery.eq('created_by', profile.id);
      }

      const { data: contracts, error: contractsError } = await contractsQuery;

      if (contractsError) throw contractsError;

      // Load payments - employees only see payments for their contracts
      let paymentsQuery = supabase.from('contract_payments').select('*');

      if (roleName === 'employee' && contracts && contracts.length > 0) {
        const contractIds = contracts.map(c => c.id);
        paymentsQuery = paymentsQuery.in('contract_id', contractIds);
      } else if (roleName === 'employee') {
        // No contracts = no payments
        setStats({ totalContracts: 0, activeContracts: 0, pendingReview: 0, cancelledContracts: 0, totalAmount: 0, completedPayments: 0, returnedContracts: 0, pendingBillingReview: 0 });
        setContracts([]);
        setRecentContracts([]);
        setChartData([]);
        return;
      }

      const { data: payments, error: paymentsError } = await paymentsQuery;

      if (paymentsError) throw paymentsError;

      // Calculate stats usando el campo estado
      const totalContracts = contracts?.length || 0;
      const registeredContracts = contracts?.filter(c => c.estado === 'registrado').length || 0;
      const activeContracts = contracts?.filter(c => c.estado === 'en_ejecucion').length || 0;
      const completedContracts = contracts?.filter(c => c.estado === 'completado').length || 0;
      const cancelledContracts = contracts?.filter(c => c.estado === 'cancelado').length || 0;
      const returnedContracts = contracts?.filter(c => c.estado === 'devuelto').length || 0;
      const totalAmount = contracts?.reduce((sum, c) => sum + Number(c.total_amount), 0) || 0;
      const completedPayments = payments?.length || 0;

      let pendingBillingReview = 0;
      if (roleName === 'supervisor') {
        const { count } = await supabase
          .from('billing_accounts')
          .select('id', { count: 'exact', head: true })
          .in('status', ['enviada', 're-enviada']);
        pendingBillingReview = count || 0;
      }

      setStats({
        totalContracts,
        activeContracts,
        pendingReview: registeredContracts,
        cancelledContracts,
        totalAmount,
        completedPayments,
        returnedContracts,
        pendingBillingReview
      });

      setContracts(contracts || []);

      // Recent contracts (last 5)
      setRecentContracts(contracts?.slice(0, 5) || []);

      // Chart data con los 5 estados correctos
      const statusCounts = contracts?.reduce((acc: any, contract: any) => {
        acc[contract.estado] = (acc[contract.estado] || 0) + 1;
        return acc;
      }, {}) || {};

      const chartDataFormatted = [
        { name: 'Registrado', value: statusCounts.registrado || 0, color: 'hsl(var(--state-registered))' },
        { name: 'Devuelto', value: statusCounts.devuelto || 0, color: 'hsl(var(--state-returned))' },
        { name: 'En Ejecución', value: statusCounts.en_ejecucion || 0, color: 'hsl(var(--state-executing))' },
        { name: 'Completado', value: statusCounts.completado || 0, color: 'hsl(var(--state-completed))' },
        { name: 'Cancelado', value: statusCounts.cancelado || 0, color: 'hsl(var(--state-cancelled))' }
      ].filter(item => item.value > 0); // Solo mostrar categorías con datos

      setChartData(chartDataFormatted);

      // Load billing summary for employees
      if (roleName === 'employee' && contracts && contracts.length > 0) {
        const contractIds = contracts.map(c => c.id);
        const { data: billingAccounts } = await supabase
          .from('billing_accounts')
          .select('status')
          .in('contract_id', contractIds);

        if (billingAccounts) {
          setBillingSummary({
            drafts: billingAccounts.filter(b => b.status === 'borrador').length,
            pending: billingAccounts.filter(b => b.status === 'pendiente_revision').length,
            approved: billingAccounts.filter(b => b.status === 'aprobada').length,
            rejected: billingAccounts.filter(b => b.status === 'rechazada').length,
          });
        }
      }
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
    );
  }

  const dashboardConfig = getDashboardConfig(userRole);

  if (userRole === 'juridica') {
    return <JuridicaDashboard />;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{dashboardConfig.title}</h1>
          <p className="text-muted-foreground">
            {dashboardConfig.description}
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

      {/* Alert for employees with returned contracts */}
      {userRole === 'employee' && stats.returnedContracts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contratos Devueltos</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Tienes {stats.returnedContracts} {stats.returnedContracts === 1 ? 'contrato devuelto que requiere' : 'contratos devueltos que requieren'} corrección.
            </span>
            <Button variant="outline" size="sm" asChild className="ml-4">
              <Link to="/contracts/query?estado=devuelto">
                Ver ahora
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-1">
          <ProcessCard />
        </div>
        <StatsCard
          title={userRole === 'employee' ? 'Mis Contratos' : 'Total Contratos'}
          value={stats.totalContracts}
          icon={FileText}
          description="Total de contratos registrados"
        />
        {userRole === 'employee' && stats.returnedContracts > 0 && (
          <StatsCard
            title="Devueltos"
            value={stats.returnedContracts}
            icon={AlertCircle}
            description="Requieren corrección"
            className="border-destructive"
          />
        )}
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
          value={contracts?.filter(c => c.estado === 'completado').length || 0}
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
      {userRole === 'employee' ? (
        <div className="grid gap-6 md:grid-cols-2">
          <UpcomingExpirations contracts={contracts} />
          <BillingSummaryCard {...billingSummary} />
        </div>
      ) : (
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
                    {dashboardConfig.recentActivityTitle}
                  </CardTitle>
                  <CardDescription>
                    {dashboardConfig.recentActivityDescription}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={'/contracts'}>
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
                          <p className="font-medium">{contract.contract_number_original || contract.contract_number}</p>
                          <ContractStatusBadge status={contract.estado || 'registrado'} />
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
      )}

      {/* Recent Contracts for Employee */}
      {userRole === 'employee' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {dashboardConfig.recentActivityTitle}
              </CardTitle>
              <CardDescription>
                {dashboardConfig.recentActivityDescription}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/contracts/query">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentContracts.length > 0 ? (
              recentContracts.map((contract: any) => (
                <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contract.contract_number_original || contract.contract_number}</p>
                      <ContractStatusBadge status={contract.estado || 'registrado'} />
                    </div>
                    <p className="text-sm text-muted-foreground">{contract.client_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono">{formatCurrency(contract.total_amount)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/contracts/${contract.id}/edit`}>Ver detalles</Link>
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
      )}

      {/* Quick Actions */}
      {userRole === 'employee' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Gestiona tus contratos y cuentas de cobro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" asChild className="justify-start h-auto p-4">
                <Link to="/contracts/new" className="flex flex-col items-start gap-2">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Crear Contrato</div>
                    <div className="text-sm text-muted-foreground">Registrar nuevo contrato</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start h-auto p-4">
                <Link to="/billing" className="flex flex-col items-start gap-2">
                  <DollarSign className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Mis Cuentas de Cobro</div>
                    <div className="text-sm text-muted-foreground">Ver facturación</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start h-auto p-4">
                <Link to="/contracts/query" className="flex flex-col items-start gap-2">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Consultar Contratos</div>
                    <div className="text-sm text-muted-foreground">Ver mis contratos</div>
                  </div>
                </Link>
              </Button>
              {stats.returnedContracts > 0 && (
                <Button variant="outline" asChild className="justify-start h-auto p-4 border-destructive">
                  <Link to="/contracts/query?estado=devuelto" className="flex flex-col items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div className="text-left">
                      <div className="font-medium">Contratos Devueltos</div>
                      <div className="text-sm text-muted-foreground">{stats.returnedContracts} requieren corrección</div>
                    </div>
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : userRole === "supervisor" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Acciones de Supervisión
            </CardTitle>
            <CardDescription>
              Tareas de auditoría asignadas a tu rol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" asChild className="justify-start h-auto p-4">
                <Link to="/contracts?estado=registrado" className="flex flex-col items-start gap-2">
                  <Clock className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Revisar Contratos</div>
                    <div className="text-sm text-muted-foreground">{stats.pendingReview} pendientes</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start h-auto p-4">
                <Link to="/billing?estado=enviada" className="flex flex-col items-start gap-2">
                  <DollarSign className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Revisar Cuentas de Cobro</div>
                    <div className="text-sm text-muted-foreground">{stats.pendingBillingReview} pendientes</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start h-auto p-4">
                <Link to="/contracts/query" className="flex flex-col items-start gap-2">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Consultar Contratos</div>
                    <div className="text-sm text-muted-foreground">Auditoría histórica</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start h-auto p-4">
                <Link to="/notifications" className="flex flex-col items-start gap-2">
                  <Bell className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Notificaciones</div>
                    <div className="text-sm text-muted-foreground">Alertas del proceso</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : ["super_admin", "admin", "treasury"].includes(userRole) && (
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
                <Link to="/contracts?estado=registrado" className="flex flex-col items-start gap-2">
                  <Clock className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Revisar Pendientes</div>
                    <div className="text-sm text-muted-foreground">{stats.pendingReview} contratos</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start h-auto p-4">
                <Link to="/billing" className="flex flex-col items-start gap-2">
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
  );
}