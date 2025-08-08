import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, Calendar, DollarSign, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BillingAccountsListProps {
  userProfile: any;
  userRole: string;
  filterType: 'own' | 'all';
}

export function BillingAccountsList({ userProfile, userRole, filterType }: BillingAccountsListProps) {
  const { toast } = useToast();
  const [billingAccounts, setBillingAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingAccounts();
  }, [filterType, userProfile]);

  const loadBillingAccounts = async () => {
    try {
      setLoading(true);
      
      console.log('Loading billing accounts with userProfile:', userProfile);
      console.log('Filter type:', filterType);
      console.log('User role:', userRole);
      
      if (!userProfile?.id) {
        console.log('No userProfile id found, skipping load');
        setBillingAccounts([]);
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from('billing_accounts')
        .select(`
          *,
          contracts(contract_number, client_name, total_amount),
          profiles!billing_accounts_created_by_fkey(name, email)
        `);

      // Apply filters based on type and user role
      if (filterType === 'own') {
        console.log('Filtering by created_by:', userProfile.id);
        query = query.eq('created_by', userProfile.id);
      } else if (filterType === 'all' && !['super_admin', 'admin', 'supervisor'].includes(userRole)) {
        // If user is not admin/supervisor, only show their own accounts even in "all" view
        console.log('Non-admin filtering by created_by:', userProfile.id);
        query = query.eq('created_by', userProfile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('Query result:', { data, error });
      if (error) throw error;
      setBillingAccounts(data || []);
    } catch (error: any) {
      console.error('Error loading billing accounts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas de cobro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Descargar documentos"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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