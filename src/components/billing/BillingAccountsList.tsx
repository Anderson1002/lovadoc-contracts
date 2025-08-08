import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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

  const loadBillingAccounts = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Loading billing accounts with:', {
        filterType,
        userRole,
        userProfileId: userProfile?.id
      });
      
      let query = supabase
        .from('billing_accounts')
        .select(`
          *,
          contracts(contract_number, client_name, total_amount)
        `);

      console.log('Executing billing accounts query...');
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setBillingAccounts(data || []);
      console.log('Successfully loaded billing accounts:', data?.length || 0);
    } catch (error: any) {
      console.error('Error loading billing accounts:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar las cuentas de cobro: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filterType, userProfile?.id, userRole, toast]);

  useEffect(() => {
    if (userProfile) {
      loadBillingAccounts();
    }
  }, [loadBillingAccounts, userProfile]);

  const getBillingStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'pending_review': return 'Pendiente Revisión';
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      case 'paid': return 'Pagado';
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
                      onEdit={() => {}}
                      onRefresh={loadBillingAccounts}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}