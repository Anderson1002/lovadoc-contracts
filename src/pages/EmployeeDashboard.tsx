import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { ContractStatusChart } from "@/components/dashboard/ContractStatusChart";
import { 
  FileText, 
  DollarSign, 
  Clock,
  CheckCircle,
  CalendarDays,
  TrendingUp
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";

interface EmployeeDashboardStats {
  totalContracts: number;
  activeContracts: number;
  draftContracts: number;
  completedContracts: number;
  totalAmount: number;
  nextPaymentDate?: string;
}

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<EmployeeDashboardStats>({
    totalContracts: 0,
    activeContracts: 0,
    draftContracts: 0,
    completedContracts: 0,
    totalAmount: 0
  });
  const [contracts, setContracts] = useState<any[]>([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployeeDashboardData();
  }, []);

  const loadEmployeeDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user profile and role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, roles!profiles_role_id_fkey(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;
      setProfileId(profile.id);

      // Actualizar estados de contratos basándose en fechas antes de cargarlos
      await supabase.rpc('update_contract_statuses');

      // Load only the employee's contracts
      console.log('Profile ID:', profile.id);
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false });
      console.log('Contracts query result:', { contracts, contractsError });

      if (contractsError) throw contractsError;

      // Calculate stats using only employee's contracts
      const totalContracts = contracts?.length || 0;
      const draftContracts = contracts?.filter(c => c.status === 'draft').length || 0;
      const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;
      const completedContracts = contracts?.filter(c => c.status === 'completed').length || 0;
      const totalAmount = contracts?.reduce((sum, c) => sum + Number(c.total_amount), 0) || 0;

      // Find next payment date from active contracts
      const activeContractsWithDates = contracts?.filter(c => c.status === 'active' && c.end_date);
      const nextPaymentDate = activeContractsWithDates?.length > 0 
        ? new Date(Math.min(...activeContractsWithDates.map(c => new Date(c.end_date).getTime())))
        : undefined;

      setStats({
        totalContracts,
        activeContracts,
        draftContracts,
        completedContracts,
        totalAmount,
        nextPaymentDate: nextPaymentDate?.toLocaleDateString('es-CO')
      });

      setContracts(contracts || []);

      // Chart data for employee's contracts
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
      ].filter(item => item.value > 0);

      setChartData(chartDataFormatted);

    } catch (error: any) {
      console.error('Error loading employee dashboard:', error);
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
          <h1 className="text-3xl font-bold text-foreground">Mi Dashboard</h1>
          <p className="text-muted-foreground">
            Información de mis contratos y actividades
          </p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link to="/contracts/new">
            <FileText className="h-4 w-4" />
            Nuevo Contrato
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Mis Contratos"
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
          value={stats.draftContracts}
          icon={Clock}
          description="Pendientes de revisión"
        />
        <StatsCard
          title="Valor Total"
          value={formatCurrency(stats.totalAmount)}
          icon={DollarSign}
          description="Valor total de mis contratos"
        />
      </div>

      {/* Charts and Contract Details */}
      <div className="grid gap-6 md:grid-cols-7">
        {chartData.length > 0 && (
          <div className="md:col-span-3">
            <ContractStatusChart data={chartData} />
          </div>
        )}
        
        <div className={`${chartData.length > 0 ? 'md:col-span-4' : 'md:col-span-7'}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mis Contratos
                </CardTitle>
                <CardDescription>
                  Estado actual de todos mis contratos
                </CardDescription>
              </div>
              {contracts.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contracts">
                    Ver todos
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {contracts.length > 0 ? (
                contracts.slice(0, 5).map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{contract.contract_number}</p>
                        <ContractStatusBadge status={contract.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{contract.client_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">{formatCurrency(contract.total_amount)}</span>
                        {contract.start_date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(contract.start_date).toLocaleDateString('es-CO')}
                          </span>
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
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No tienes contratos registrados</h3>
                  <p className="mb-4">Comienza creando tu primer contrato</p>
                  <Button asChild>
                    <Link to="/contracts/new">
                      <FileText className="h-4 w-4 mr-2" />
                      Crear Primer Contrato
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions for Employee */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>
            Gestiona tus contratos y cuentas de cobro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" asChild className="justify-start h-auto p-4">
              <Link to="/contracts/new" className="flex flex-col items-start gap-2">
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Nuevo Contrato</div>
                  <div className="text-sm text-muted-foreground">Registrar contrato médico</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start h-auto p-4">
              <Link to="/contracts" className="flex flex-col items-start gap-2">
                <Clock className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Mis Contratos</div>
                  <div className="text-sm text-muted-foreground">{stats.totalContracts} contratos</div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}