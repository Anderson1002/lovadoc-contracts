import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EditBillingAccountDialog } from "../../pages/EditBillingAccount";
import { BillingAccountActions } from "./BillingAccountActions";

interface BillingAccountsListProps {
  userProfile: any;
  userRole: string;
  filterType: 'own' | 'all';
}

export function BillingAccountsList({ userProfile, userRole, filterType }: BillingAccountsListProps) {
  const { toast } = useToast();
  const [billingAccounts, setBillingAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadBillingAccounts();
  }, [filterType, userProfile]);

  const loadBillingAccounts = async () => {
    try {
      setLoading(true);
      
      console.log('=== DEBUGGING BILLING ACCOUNTS LOAD ===');
      console.log('Filter type:', filterType);
      console.log('User role:', userRole);
      console.log('UserProfile:', userProfile);
      
      // Simple query first - no complex joins
      let query = supabase
        .from('billing_accounts')
        .select(`
          *,
          contracts(contract_number, client_name, total_amount)
        `);

      // Apply filters based on type and user role only if needed
      if (filterType === 'own') {
        // For "own" view, we rely on RLS policies to filter automatically
        console.log('Loading own accounts - RLS will filter automatically');
      } else if (filterType === 'all' && !['super_admin', 'admin', 'supervisor'].includes(userRole)) {
        // Non-admin users should only see their own accounts even in "all" view
        console.log('Non-admin user in "all" view - RLS will filter automatically');
      } else {
        console.log('Admin/Supervisor user - will see all accounts per RLS');
      }

      console.log('Executing query...');
      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('=== QUERY RESULTS ===');
      console.log('Error:', error);
      console.log('Data count:', data?.length || 0);
      console.log('Data:', data);
      
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      // Attach creator profile for admin/supervisor in "all" view
      let withProfiles = data || [];
      if (filterType === 'all' && ['super_admin', 'admin', 'supervisor'].includes(userRole) && (data?.length || 0) > 0) {
        const creatorIds = Array.from(new Set((data || []).map((d: any) => d.created_by).filter(Boolean)));
        if (creatorIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', creatorIds);
          if (profilesError) throw profilesError;
          const map = Object.fromEntries((profilesData || []).map((p: any) => [p.id, p]));
          withProfiles = (data || []).map((d: any) => ({ ...d, created_by_profile: map[d.created_by] }));
        }
      }
      
      setBillingAccounts(withProfiles);
      console.log('Successfully loaded billing accounts:', withProfiles.length || 0);
    } catch (error: any) {
      console.error('=== ERROR LOADING BILLING ACCOUNTS ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      
      toast({
        title: "Error",
        description: `No se pudieron cargar las cuentas de cobro: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getBillingStatusLabel = (status: string) => {
    switch (status) {
      case 'borrador': return 'Borrador';
      case 'pendiente_revision': return 'Pendiente Revisión';
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      case 'pagada': return 'Pagada';
      default: return status;
    }
  };

  const getBillingStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'draft': return 'outline';
      case 'pending_review': return 'outline';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'paid': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando cuentas de cobro...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (billingAccounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cuentas de Cobro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filterType === 'own' 
                ? 'No tienes cuentas de cobro registradas' 
                : 'No hay cuentas de cobro disponibles'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cuentas de Cobro
          <Badge variant="secondary" className="ml-auto">
            {billingAccounts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                {filterType === 'all' && ['super_admin', 'admin', 'supervisor'].includes(userRole) && (
                  <TableHead>Creado por</TableHead>
                )}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingAccounts.map((billing) => (
                <TableRow key={billing.id}>
                  <TableCell className="font-medium">
                    {billing.account_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{billing.contracts?.contract_number}</p>
                      <p className="text-sm text-muted-foreground">{billing.contracts?.client_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatMonth(billing.billing_month)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatCurrency(billing.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBillingStatusVariant(billing.status)}>
                      {getBillingStatusLabel(billing.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(billing.created_at)}
                  </TableCell>
                  {filterType === 'all' && ['super_admin', 'admin', 'supervisor'].includes(userRole) && (
                    <TableCell className="text-sm">
                      {billing.profiles?.name || billing.profiles?.email || 'N/A'}
                    </TableCell>
                  )}
                   <TableCell className="text-right">
                     <BillingAccountActions
                       billingAccount={billing}
                       userRole={userRole}
                       userProfile={userProfile}
                       onEdit={() => {
                         setEditingAccount(billing);
                         setShowEditDialog(true);
                       }}
                       onRefresh={loadBillingAccounts}
                     />
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <EditBillingAccountDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        billingAccount={editingAccount}
        userProfile={userProfile}
        onSuccess={loadBillingAccounts}
      />
    </Card>
  );
}