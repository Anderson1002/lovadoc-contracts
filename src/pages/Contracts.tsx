import { useEffect, useState } from "react";
import { ContractTable } from "@/components/contracts/ContractTable";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [userRole, setUserRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      
      // Get user profile and role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles!role_id(name)')
        .eq('user_id', user.id)
        .single();

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
    } finally {
      setLoading(false);
    }
  };

  const handleView = (contract: any) => {
    // Navigate to contract details
    window.open(`/contracts/${contract.id}`, '_blank');
  };

  const handleEdit = (contract: any) => {
    // Navigate to contract edit
    window.open(`/contracts/${contract.id}/edit`, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Gestión de Contratos
          </h1>
          <p className="text-muted-foreground">
            Administra todos los contratos del hospital
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
    </div>
  );
}