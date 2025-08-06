import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContractTable } from "@/components/contracts/ContractTable";
import { ContractStatusInfo } from "@/components/contracts/ContractStatusInfo";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
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

    // THEN check for existing session
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
      // Get user profile and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles!profiles_role_id_fkey(name)')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile && profile.roles) {
        setUserRole((profile.roles as any).name);
      }

      // Load contracts based on role
      let query = supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      // If employee, only show their contracts
      if (profile && (profile.roles as any).name === 'employee') {
        query = query.eq('created_by', profile.id);
      }

      const { data: contracts, error } = await query;

      if (error) throw error;

      setContracts(contracts || []);

    } catch (error: any) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contratos",
        variant: "destructive"
      });
    }
  };

  const handleView = (contract: any) => {
    // Navigate to contract details
    navigate(`/contracts/${contract.id}`);
  };

  const handleEdit = (contract: any) => {
    // Navigate to contract edit
    navigate(`/contracts/${contract.id}/edit`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Error logging out:', error);
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
    return null; // Will redirect to auth
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Control de Contratos
            </h1>
            <p className="text-muted-foreground">
              Sistema de administración y seguimiento contractual
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

        {/* Contracts Table */}
        <ContractTable
          contracts={contracts}
          userRole={userRole}
          onView={handleView}
          onEdit={handleEdit}
        />

        {/* Contract Status Information */}
        <ContractStatusInfo />
      </div>
    </Layout>
  );
}