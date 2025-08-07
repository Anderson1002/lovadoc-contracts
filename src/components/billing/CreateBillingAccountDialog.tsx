import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CreateBillingAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: any;
  onSuccess: () => void;
}

interface FileUpload {
  type: 'billing_invoice' | 'activity_report' | 'social_security';
  file: File | null;
  uploaded: boolean;
  uploading: boolean;
}

export function CreateBillingAccountDialog({
  open,
  onOpenChange,
  userProfile,
  onSuccess
}: CreateBillingAccountDialogProps) {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [billingMonth, setBillingMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(true);
  
  const [files, setFiles] = useState<Record<string, FileUpload>>({
    billing_invoice: { type: 'billing_invoice', file: null, uploaded: false, uploading: false },
    activity_report: { type: 'activity_report', file: null, uploaded: false, uploading: false },
    social_security: { type: 'social_security', file: null, uploaded: false, uploading: false }
  });

  useEffect(() => {
    if (open) {
      loadContracts();
      resetForm();
    }
  }, [open]);

  const loadContracts = async () => {
    try {
      setContractsLoading(true);
      let query = supabase
        .from('contracts')
        .select('*')
        .in('status', ['active', 'draft']);

      // If user is not admin/supervisor, only show their own contracts
      if (!['super_admin', 'admin', 'supervisor'].includes(userProfile?.roles?.name)) {
        query = query.eq('created_by', userProfile?.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contratos",
        variant: "destructive"
      });
    } finally {
      setContractsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedContract("");
    setAmount("");
    setBillingMonth("");
    setFiles({
      billing_invoice: { type: 'billing_invoice', file: null, uploaded: false, uploading: false },
      activity_report: { type: 'activity_report', file: null, uploaded: false, uploading: false },
      social_security: { type: 'social_security', file: null, uploaded: false, uploading: false }
    });
  };

  const handleFileChange = (type: keyof typeof files, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [type]: { ...prev[type], file, uploaded: false }
    }));
  };

  const validateForm = () => {
    if (!selectedContract) {
      toast({
        title: "Error",
        description: "Debe seleccionar un contrato",
        variant: "destructive"
      });
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Debe ingresar un valor válido",
        variant: "destructive"
      });
      return false;
    }

    if (!billingMonth) {
      toast({
        title: "Error",
        description: "Debe seleccionar el mes de facturación",
        variant: "destructive"
      });
      return false;
    }

    // Validate required files
    const requiredFiles = ['billing_invoice', 'activity_report', 'social_security'];
    for (const fileType of requiredFiles) {
      if (!files[fileType].file) {
        toast({
          title: "Error",
          description: `Debe subir el archivo: ${getFileTypeLabel(fileType)}`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const uploadFile = async (fileUpload: FileUpload, billingAccountId: string) => {
    if (!fileUpload.file) return null;

    const fileExt = fileUpload.file.name.split('.').pop();
    const fileName = `${userProfile.user_id}/${billingAccountId}/${fileUpload.type}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('billing-documents')
      .upload(fileName, fileUpload.file);

    if (error) throw error;

    return {
      file_name: fileUpload.file.name,
      file_path: data.path,
      file_size: fileUpload.file.size,
      mime_type: fileUpload.file.type
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Check if billing account for this month already exists
      const { data: existingBilling } = await supabase
        .from('billing_accounts')
        .select('id')
        .eq('contract_id', selectedContract)
        .eq('billing_month', `${billingMonth}-01`)
        .maybeSingle();

      if (existingBilling) {
        toast({
          title: "Error",
          description: "Ya existe una cuenta de cobro para este contrato en el mes seleccionado",
          variant: "destructive"
        });
        return;
      }

      // Create billing account
      const { data: billingAccount, error: billingError } = await supabase
        .from('billing_accounts')
        .insert({
          contract_id: selectedContract,
          amount: parseFloat(amount),
          billing_month: `${billingMonth}-01`,
          created_by: userProfile.id,
          status: 'pending_review',
          account_number: '' // Will be auto-generated by trigger
        })
        .select()
        .single();

      if (billingError) throw billingError;

      // Upload files
      const uploadPromises = Object.entries(files).map(async ([type, fileUpload]) => {
        if (!fileUpload.file) return;

        setFiles(prev => ({
          ...prev,
          [type]: { ...prev[type], uploading: true }
        }));

        try {
          const fileData = await uploadFile(fileUpload, billingAccount.id);
          
          if (fileData) {
            await supabase
              .from('billing_documents')
              .insert({
                billing_account_id: billingAccount.id,
                document_type: type,
                uploaded_by: userProfile.id,
                ...fileData
              });
          }

          setFiles(prev => ({
            ...prev,
            [type]: { ...prev[type], uploading: false, uploaded: true }
          }));
        } catch (error) {
          setFiles(prev => ({
            ...prev,
            [type]: { ...prev[type], uploading: false }
          }));
          throw error;
        }
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Éxito",
        description: "Cuenta de cobro creada exitosamente y enviada para revisión",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating billing account:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la cuenta de cobro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'billing_invoice': return 'Cuenta de Cobro (PDF)';
      case 'activity_report': return 'Informe de Actividades (PDF)';
      case 'social_security': return 'Planilla de Seguridad Social (PDF)';
      default: return type;
    }
  };

  const selectedContractData = contracts.find(c => c.id === selectedContract);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cuenta de Cobro</DialogTitle>
          <DialogDescription>
            Complete todos los campos requeridos y suba los documentos necesarios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Selection */}
          <div className="space-y-3">
            <Label htmlFor="contract">Contrato *</Label>
            <Select value={selectedContract} onValueChange={setSelectedContract}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un contrato" />
              </SelectTrigger>
              <SelectContent>
                {contractsLoading ? (
                  <SelectItem value="loading" disabled>Cargando contratos...</SelectItem>
                ) : contracts.length === 0 ? (
                  <SelectItem value="no-contracts" disabled>No hay contratos disponibles</SelectItem>
                ) : (
                  contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.client_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {selectedContractData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Detalles del Contrato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>
                      <p className="font-medium">{selectedContractData.client_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor Total:</span>
                      <p className="font-medium">{formatCurrency(selectedContractData.total_amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Amount and Month */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor de la Cuenta *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Mes de Facturación *</Label>
              <Input
                id="month"
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <Label>Documentos Requeridos *</Label>
            
            {Object.entries(files).map(([type, fileUpload]) => (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {getFileTypeLabel(type)}
                    {fileUpload.uploaded && (
                      <Badge variant="default" className="ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Subido
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(type as keyof typeof files, e.target.files?.[0] || null)}
                      disabled={fileUpload.uploading || loading}
                      className="flex-1"
                    />
                    {fileUpload.file && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileChange(type as keyof typeof files, null)}
                        disabled={fileUpload.uploading || loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {fileUpload.file && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {fileUpload.file.name} ({(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || contractsLoading}
            >
              {loading ? "Creando..." : "Enviar para Revisión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}