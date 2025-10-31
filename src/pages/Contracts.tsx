import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FileText, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContractTable } from "@/components/contracts/ContractTable";
import { ContractStatusInfo } from "@/components/contracts/ContractStatusInfo";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ContractStatusChart } from "@/components/dashboard/ContractStatusChart";
import { Layout } from "@/components/Layout";

export default function Contracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    averageValue: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    registered: 0,
    returned: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Calculate statistics from contracts
  const calculateStats = (contractsData: any[]) => {
    const total = contractsData.length;
    const totalValue = contractsData.reduce((sum, contract) => sum + (contract.total_amount || 0), 0);
    const averageValue = total > 0 ? totalValue / total : 0;
    
    const statusCounts = contractsData.reduce((acc, contract) => {
      const status = contract.status || 'draft';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total,
      totalValue,
      averageValue,
      active: statusCounts.active || 0,
      completed: statusCounts.completed || 0,
      cancelled: statusCounts.cancelled || 0,
      registered: statusCounts.draft || statusCounts.registered || 0,
      returned: statusCounts.returned || 0
    });
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          setTimeout(() => {
            loadContracts(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        loadContracts(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadContracts = async (userId: string) => {
    try {
      // Actualizar estados de contratos basándose en fechas antes de cargarlos
      await supabase.rpc('update_contract_statuses');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles!profiles_role_id_fkey(name)')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile && profile.roles) {
        setUserRole((profile.roles as any).name);
      }

      let contractsQuery = supabase
        .from('contracts')
        .select(`
          *,
          client:profiles!client_profile_id(
            name,
            email,
            document_number
          )
        `);

      // Only employees see their own contracts, others see all
      if (profile && profile.roles && (profile.roles as any).name === 'employee') {
        contractsQuery = contractsQuery.eq('created_by', profile.id);
      }

      const { data: contractsData, error } = await contractsQuery.order('created_at', { ascending: false });

      if (error) throw error;

      setContracts(contractsData || []);
      calculateStats(contractsData || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contratos",
        variant: "destructive"
      });
    }
  };

  const handleView = (contract: any) => {
    navigate(`/contracts/${contract.id}`);
  };

  const handleEdit = (contract: any) => {
    navigate(`/contracts/${contract.id}/edit`);
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
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Control de Contratos</h1>
            <p className="text-muted-foreground">
              Gestiona todos los contratos del hospital
            </p>
          </div>
          {["super_admin", "admin", "employee"].includes(userRole) && (
            <Button 
              onClick={() => navigate("/contracts/new")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Contrato
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Contratos"
            value={stats.total}
            description="Contratos encontrados"
            icon={FileText}
          />
          <StatsCard
            title="Valor Total"
            value={`$ ${stats.totalValue.toLocaleString('es-CO')}`}
            description="Suma de todos los contratos"
            icon={DollarSign}
          />
          <StatsCard
            title="Valor Promedio"
            value={`$ ${stats.averageValue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
            description="Promedio por contrato"
            icon={TrendingUp}
          />
          <StatsCard
            title="Contratos en Ejecución"
            value={stats.active}
            description={`${stats.completed} completados, ${stats.cancelled} cancelados`}
            icon={CheckCircle}
          />
        </div>

        {/* Contracts Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Resultados de Consulta</h2>
                <p className="text-sm text-muted-foreground">{stats.total} contratos encontrados</p>
              </div>
            </div>
            <ContractTable
              contracts={contracts}
              userRole={userRole}
              onView={handleView}
              onEdit={handleEdit}
              onRefresh={() => loadContracts(user?.id || '')}
            />
          </div>
        </div>

        {/* Contract Status Information */}
        <ContractStatusInfo />
      </div>
    </Layout>
  );
}