import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, User, FileText, Edit, AlertTriangle } from "lucide-react";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { ContractStateHistory } from "@/components/contracts/ContractStateHistory";
import { formatCurrency } from "@/lib/utils";
import { Layout } from "@/components/Layout";

export default function ContractDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadContract(id);
    }
  }, [id]);

  const loadContract = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:profiles!client_profile_id(
            name,
            email,
            phone,
            address,
            document_number,
            bank_name,
            bank_account
          )
        `)
        .eq('id', contractId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Error",
          description: "Contrato no encontrado",
          variant: "destructive"
        });
        navigate('/contracts');
        return;
      }

      setContract(data);
    } catch (error: any) {
      console.error('Error loading contract:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el contrato",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Crear fecha sin zona horaria para evitar desfases
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed_amount': return 'Monto Fijo';
      case 'variable_amount': return 'Monto Variable';
      case 'company_contract': return 'Contrato Empresa';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!contract) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Contrato no encontrado</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/contracts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Contrato #{contract.oid}</h1>
              <p className="text-muted-foreground font-mono text-sm">{contract.contract_number}</p>
              {contract.contract_number_original && (
                <p className="text-xs text-muted-foreground">
                  Original: {contract.contract_number_original}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={() => navigate(`/contracts/${contract.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Alert de Devolución */}
        {(contract.estado === 'devuelto' || contract.status === 'devuelto') && contract.comentarios_devolucion && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-2">Contrato Devuelto</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Motivo de la devolución:</strong>
                </p>
                <p className="text-sm mt-1">{contract.comentarios_devolucion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Identificador (OID)
                </label>
                <p className="text-2xl font-bold text-primary">#{contract.oid}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Número de Contrato</label>
                <p className="text-lg font-mono">{contract.contract_number}</p>
              </div>
              {contract.contract_number_original && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Número Original (Pre-cargado)
                  </label>
                  <p className="text-lg font-mono">{contract.contract_number_original}</p>
                </div>
              )}
              {contract.rp && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">RP</label>
                  <p className="text-lg">{contract.rp}</p>
                </div>
              )}
              {contract.cdp && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CDP</label>
                  <p className="text-lg">{contract.cdp}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Contrato</label>
                <div className="mt-1">
                  <Badge variant="outline">
                    {getContractTypeLabel(contract.contract_type)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estado</label>
                <div className="mt-1">
                  <ContractStatusBadge status={contract.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="mt-1">{contract.description || 'Sin descripción'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.client ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nombre del Cliente</label>
                    <p className="text-lg">{contract.client.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Documento</label>
                    <p className="font-mono">{contract.client.document_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{contract.client.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p>{contract.client.phone || 'No especificado'}</p>
                  </div>
                  {contract.client.address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                      <p>{contract.client.address}</p>
                    </div>
                  )}
                  {contract.client.bank_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Banco</label>
                      <p>{contract.client.bank_name}</p>
                    </div>
                  )}
                  {contract.client.bank_account && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cuenta Bancaria</label>
                      <p className="font-mono">{contract.client.bank_account}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No hay información del cliente disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                <p className="text-2xl font-bold font-mono text-green-600">
                  {formatCurrency(contract.total_amount)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Inicio</label>
                <p className="text-lg">{formatDate(contract.start_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Finalización</label>
                <p className="text-lg">
                  {contract.end_date ? formatDate(contract.end_date) : 'No definida'}
                </p>
              </div>

              {contract.execution_period_days && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Plazo de Ejecución</label>
                  <p className="text-lg font-semibold">
                    {contract.execution_period_months} {contract.execution_period_months === 1 ? 'mes' : 'meses'} ({contract.execution_period_days} {contract.execution_period_days === 1 ? 'día' : 'días'})
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                <p>{formatDateTime(contract.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial de Cambios de Estado */}
        <ContractStateHistory contractId={contract.id} />
      </div>
    </Layout>
  );
}