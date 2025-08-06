import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { supabase } from "@/integrations/supabase/client";
import { ContractFilters, ContractFilters as ContractFiltersComponent } from "@/components/contracts/ContractFilters";
import { ContractStats } from "@/components/contracts/ContractStats";
import { ContractQueryTable } from "@/components/contracts/ContractQueryTable";
import {
  Search,
  LogOut,
  FileSearch
} from "lucide-react";

export default function ContractQuery() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ContractFilters>({
    search: "",
    contractType: "all",
    status: "all",
    startDate: undefined,
    endDate: undefined,
    minAmount: "",
    maxAmount: "",
    clientName: ""
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          loadUserProfile(session.user.id);
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

      // Load contracts
      await loadContracts();
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil de usuario",
        variant: "destructive"
      });
    }
  };

  const loadContracts = async () => {
    try {
      setIsLoadingContracts(true);
      
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContracts(contracts || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contratos",
        variant: "destructive"
      });
    } finally {
      setIsLoadingContracts(false);
    }
  };

  // Filter and sort contracts
  const processedContracts = useMemo(() => {
    let filtered = [...contracts];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(contract => 
        contract.contract_number?.toLowerCase().includes(searchLower) ||
        contract.client_name?.toLowerCase().includes(searchLower) ||
        contract.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.contractType && filters.contractType !== "all") {
      filtered = filtered.filter(contract => contract.contract_type === filters.contractType);
    }

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(contract => contract.status === filters.status);
    }

    if (filters.clientName) {
      const clientLower = filters.clientName.toLowerCase();
      filtered = filtered.filter(contract => 
        contract.client_name?.toLowerCase().includes(clientLower)
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(contract => 
        contract.start_date && new Date(contract.start_date) >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(contract => 
        contract.start_date && new Date(contract.start_date) <= filters.endDate!
      );
    }

    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      filtered = filtered.filter(contract => 
        contract.total_amount >= min
      );
    }

    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      filtered = filtered.filter(contract => 
        contract.total_amount <= max
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Handle different data types
      if (sortColumn === 'total_amount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortColumn === 'start_date' || sortColumn === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [contracts, filters, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedContracts.length / itemsPerPage);
  const paginatedContracts = processedContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFiltersChange = (newFilters: ContractFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = [
        'Número de Contrato',
        'Cliente',
        'Email',
        'Teléfono',
        'Tipo',
        'Estado',
        'Valor Total',
        'Fecha Inicio',
        'Fecha Fin',
        'Descripción'
      ];

      const csvContent = [
        headers.join(','),
        ...processedContracts.map(contract => [
          contract.contract_number || '',
          contract.client_name || '',
          contract.client_email || '',
          contract.client_phone || '',
          contract.contract_type || '',
          contract.status || '',
          contract.total_amount || 0,
          contract.start_date || '',
          contract.end_date || '',
          contract.description?.replace(/,/g, ';') || '' // Replace commas to avoid CSV issues
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contratos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación exitosa",
        description: "Los contratos se han exportado correctamente",
      });
    } catch (error) {
      console.error('Error exporting contracts:', error);
      toast({
        title: "Error en exportación",
        description: "No se pudieron exportar los contratos",
        variant: "destructive"
      });
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
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileSearch className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Consulta de Contratos</h1>
                  <p className="text-muted-foreground">
                    Busca, filtra y analiza contratos con herramientas avanzadas
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Filters */}
                <ContractFiltersComponent
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onExport={handleExport}
                  isLoading={isLoadingContracts}
                />

                {/* Stats */}
                <ContractStats 
                  contracts={processedContracts}
                  isLoading={isLoadingContracts}
                />

                {/* Results Table */}
                <ContractQueryTable
                  contracts={paginatedContracts}
                  isLoading={isLoadingContracts}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  onSort={handleSort}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}