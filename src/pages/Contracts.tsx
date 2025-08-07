import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContractTable } from "@/components/contracts/ContractTable";
import { ContractStatusInfo } from "@/components/contracts/ContractStatusInfo";
import { Layout } from "@/components/Layout";

export default function Contracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("employee");
  const [loading, setLoading] = useState(true);
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

      let contractsQuery = supabase.from('contracts').select('*');

      if (profile && profile.roles && (profile.roles as any).name === 'employee') {
        contractsQuery = contractsQuery.eq('created_by', profile.id);
      }

      const { data: contractsData, error } = await contractsQuery.order('created_at', { ascending: false });

      if (error) throw error;

      setContracts(contractsData || []);
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

        {/* Contracts Table */}
        <ContractTable
          contracts={contracts}
          userRole={userRole}
          onView={handleView}
          onEdit={handleEdit}
          onRefresh={() => loadContracts(user?.id || '')}
        />

        {/* Contract Status Information */}
        <ContractStatusInfo />
      </div>
    </Layout>
  );
}