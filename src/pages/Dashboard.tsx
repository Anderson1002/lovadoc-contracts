import { useEffect, useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ContractStatusChart } from "@/components/dashboard/ContractStatusChart";
import { ContractTable } from "@/components/contracts/ContractTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  TrendingUp,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  pendingReview: number;
  totalAmount: number;
  completedPayments: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activeContracts: 0,
    pendingReview: 0,
    totalAmount: 0,
    completedPayments: 0
  });
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

      // Calculate stats
      const totalContracts = contracts?.length || 0;
      // Solo contar contratos que realmente están en estado "active" + "draft" (que se muestran como activos)
      const activeContracts = contracts?.filter(c => c.status === 'active' || c.status === 'draft').length || 0;
      // Eliminar "pendientes revisión" ya que no existe en la plataforma
      const completedContracts = contracts?.filter(c => c.status === 'completed').length || 0;
      const totalAmount = contracts?.reduce((sum, c) => sum + Number(c.total_amount), 0) || 0;
      const completedPayments = payments?.length || 0;

      setStats({
        totalContracts,
        activeContracts,
        pendingReview: completedContracts, // Cambiar a mostrar completados en lugar de pendientes
        totalAmount,
        completedPayments
      });

      // Recent contracts (last 5)
      setRecentContracts(contracts?.slice(0, 5) || []);

      // Chart data
      const statusCounts = contracts?.reduce((acc: any, contract: any) => {
        acc[contract.status] = (acc[contract.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const chartDataFormatted = [
        { name: 'Activos', value: (statusCounts.draft || 0) + (statusCounts.active || 0), color: '#3b82f6' },
        { name: 'Completados', value: statusCounts.completed || 0, color: '#10b981' },
        { name: 'Cancelados', value: statusCounts.cancelled || 0, color: '#f59e0b' }
      ]; // Mostrar todas las categorías siempre

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
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general del sistema de gestión de contratos
          </p>
        </div>
        {(userRole === "super_admin" || userRole === "admin" || userRole === "employee") && (
          <Link to="/contracts/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Contrato
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Contratos"
          value={stats.totalContracts}
          description="Contratos encontrados"
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Valor Total"
          value={formatCurrency(stats.totalAmount)}
          description="Suma de todos los contratos"
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Valor Promedio"
          value={stats.totalContracts > 0 ? 
            formatCurrency(stats.totalAmount / stats.totalContracts) 
            : "$ 0"
          }
          description="Promedio por contrato"
          icon={TrendingUp}
        />
        <StatsCard
          title="Contratos Activos"
          value={stats.activeContracts}
          description={`${stats.pendingReview} completados, 0 cancelados`}
          icon={CheckCircle}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ContractStatusChart data={chartData} />
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Actividad Reciente</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/contracts">
                  Ver todos
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContracts.map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{contract.contract_number}</p>
                        <p className="text-sm text-muted-foreground">{contract.client_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(contract.total_amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contract.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      {(userRole === "super_admin" || userRole === "admin") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" asChild className="justify-start">
                <Link to="/contracts/new" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Contrato
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/contracts?status=pending" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Revisar Pendientes
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/payments" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Gestionar Pagos
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Administrar Usuarios
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}