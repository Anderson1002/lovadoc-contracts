import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  Download, 
  History, 
  Receipt,
  Clock,
  Building,
  MapPin,
  Phone,
  Mail,
  X
} from "lucide-react";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { formatCurrency } from "@/lib/utils";

interface ContractDetailPanelProps {
  contractId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractDetailPanel({ contractId, isOpen, onClose }: ContractDetailPanelProps) {
  const { toast } = useToast();
  const [contract, setContract] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [billingAccounts, setBillingAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractId && isOpen) {
      loadContractDetails(contractId);
    }
  }, [contractId, isOpen]);

  const loadContractDetails = async (id: string) => {
    try {
      setLoading(true);
      
      // Load contract details
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (contractError) throw contractError;
      setContract(contractData);

      // Load associated documents - combinar documentos principales con adicionales
      const { data: additionalDocs, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('contract_id', id);

      if (documentsError) throw documentsError;

      // Combinar todos los documentos
      const allDocuments = [];
      const now = new Date().toISOString();

      // Agregar contrato firmado si existe
      if (contractData?.signed_contract_path) {
        allDocuments.push({
          id: 'signed-contract',
          file_name: 'Contrato Firmado',
          file_path: contractData.signed_contract_path,
          mime_type: contractData.signed_contract_mime || 'application/pdf',
          file_size: 0,
          bucket: 'contracts',
          created_at: now
        });
      }

      // Agregar certificación bancaria si existe
      if (contractData?.bank_certification_path) {
        allDocuments.push({
          id: 'bank-certification',
          file_name: 'Certificación Bancaria',
          file_path: contractData.bank_certification_path,
          mime_type: contractData.bank_certification_mime || 'application/pdf',
          file_size: 0,
          bucket: 'contracts',
          created_at: now
        });
      }

      // Agregar documentos adicionales
      if (additionalDocs && additionalDocs.length > 0) {
        allDocuments.push(...additionalDocs.map(doc => ({
          ...doc,
          bucket: 'contracts'
        })));
      }

      setDocuments(allDocuments);

      // Load billing accounts
      const { data: billingData, error: billingError } = await supabase
        .from('billing_accounts')
        .select('*')
        .eq('contract_id', id)
        .order('created_at', { ascending: false });

      if (billingError) throw billingError;
      setBillingAccounts(billingData || []);

    } catch (error: any) {
      console.error('Error loading contract details:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del contrato",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  const getBillingStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_review': return 'Pendiente Revisión';
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      case 'paid': return 'Pagado';
      default: return status;
    }
  };

  const getBillingStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending_review': return 'outline';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'paid': return 'secondary';
      default: return 'outline';
    }
  };

  const calculateDuration = () => {
    if (!contract?.start_date || !contract?.end_date) return 'Sin definir';
    
    const start = new Date(contract.start_date);
    const end = new Date(contract.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30);
    
    if (diffDays < 30) return `${diffDays} días`;
    return `${diffMonths} meses (${diffDays} días)`;
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      const bucket = doc.bucket || 'contracts';
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Descarga iniciada",
        description: `Descargando ${doc.file_name}`,
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Sheet open={isOpen} onOpenChange={() => onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!contract) {
    return (
      <Sheet open={isOpen} onOpenChange={() => onClose()}>
        <SheetContent className="w-full sm:max-w-2xl">
          <div className="flex items-center justify-center h-full">
            <p>Contrato no encontrado</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Detalle del Contrato</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription className="text-lg font-mono">
            {contract.contract_number}
          </SheetDescription>
          <div className="flex items-center gap-2">
            <ContractStatusBadge status={contract.estado || 'registrado'} />
            <Badge variant="outline">
              {getContractTypeLabel(contract.contract_type)}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-full mt-6">
          <div className="space-y-6 pb-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Número de Contrato
                    </label>
                    <p className="text-sm font-mono mt-1">{contract.contract_number}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Duración
                    </label>
                    <p className="text-sm mt-1">{calculateDuration()}</p>
                  </div>
                </div>
                
                {contract.description && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Objeto del Contrato
                    </label>
                    <p className="text-sm mt-1 leading-relaxed">{contract.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información Financiera */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Información Financiera
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Valor Total del Contrato
                  </label>
                  <p className="text-2xl font-bold font-mono text-green-600 mt-1">
                    {formatCurrency(contract.total_amount)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Información del Contratista */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Información del Contratista
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                    <p className="text-sm font-medium">{contract.client_name}</p>
                  </div>
                </div>
                
                {contract.client_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{contract.client_email}</p>
                    </div>
                  </div>
                )}
                
                {contract.client_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
                      <p className="text-sm">{contract.client_phone}</p>
                    </div>
                  </div>
                )}
                
                {contract.client_address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Dirección</label>
                      <p className="text-sm">{contract.client_address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Cronograma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Fecha de Inicio
                    </label>
                    <p className="text-sm mt-1">{formatDate(contract.start_date)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Fecha de Finalización
                    </label>
                    <p className="text-sm mt-1">
                      {contract.end_date ? formatDate(contract.end_date) : 'Sin fecha definida'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Fecha de Creación
                  </label>
                  <p className="text-sm mt-1">{formatDate(contract.created_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Cuentas de Cobro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4" />
                  Cuentas de Cobro
                  <Badge variant="secondary" className="ml-auto">
                    {billingAccounts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billingAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay cuentas de cobro registradas
                  </p>
                ) : (
                  <div className="space-y-3">
                    {billingAccounts.map((billing) => (
                      <div key={billing.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{billing.account_number}</p>
                          <Badge variant={getBillingStatusVariant(billing.status)}>
                            {getBillingStatusLabel(billing.status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            Período: {new Date(billing.billing_month).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'long' 
                            })}
                          </div>
                          <div>
                            Valor: {formatCurrency(billing.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentos Asociados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Documentos del Contrato
                  <Badge variant="secondary" className="ml-auto">
                    {documents.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay documentos asociados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
                          className="flex-shrink-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Contrato
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <History className="h-4 w-4 mr-2" />
                    Ver Historial
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start col-span-2">
                    <Receipt className="h-4 w-4 mr-2" />
                    Ver Cuentas de Cobro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}