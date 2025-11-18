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
import { Upload, FileText, X, CheckCircle, CalendarIcon, Plus, Save, Send, Download } from "lucide-react";
import { formatCurrency, formatCurrencyInput } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BillingDocumentPreview } from "./BillingDocumentPreview";
import SignatureCanvas from "react-signature-canvas";

interface CreateBillingAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: any;
  onSuccess: () => void;
}

interface FileUpload {
  type: 'social_security';
  file: File | null;
  uploaded: boolean;
  uploading: boolean;
}

interface Activity {
  id: string;
  activityName: string;
  actions: string;
  evidences: File[];
  status: 'draft' | 'saved';
  dbId?: string;
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
  const [contractDetails, setContractDetails] = useState<any>(null);
  const [amount, setAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity>({
    id: crypto.randomUUID(),
    activityName: '',
    actions: '',
    evidences: [],
    status: 'draft'
  });
  const [showCurrentActivity, setShowCurrentActivity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<'borrador' | 'pendiente_revision' | 'aprobada' | 'rechazada' | 'pagada'>('borrador');
  
  // New fields for planilla and signature
  const [planillaNumero, setPlanillaNumero] = useState('');
  const [planillaValor, setPlanillaValor] = useState('');
  const [planillaFecha, setPlanillaFecha] = useState('');
  const [planillaFile, setPlanillaFile] = useState<File | null>(null);
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  
  const [uploads, setUploads] = useState<Record<string, Omit<FileUpload, 'type'>>>({
    social_security: { file: null, uploaded: false, uploading: false }
  });
  
  const canSubmitForReview = selectedContract && amount && startDate && endDate && 
                            activities.filter(a => a.status === 'saved').length > 0 && 
                            planillaNumero && planillaValor && planillaFecha && planillaFile &&
                            signatureRef && !signatureRef.isEmpty();
  
  console.log('Validation check:', {
    selectedContract: !!selectedContract,
    amount: !!amount,
    startDate: !!startDate,
    endDate: !!endDate,
    activities: activities.filter(a => a.status === 'saved').length,
    planillaNumero: !!planillaNumero,
    planillaValor: !!planillaValor,
    planillaFecha: !!planillaFecha,
    planillaFile: !!planillaFile,
    signatureRef: !!signatureRef,
    signatureNotEmpty: signatureRef ? !signatureRef.isEmpty() : false,
    canSubmit: canSubmitForReview
  });

  useEffect(() => {
    if (open) {
      loadContracts();
      resetForm();
      // Ensure we have user profile data
      console.log('User profile data:', userProfile);
    }
  }, [open, userProfile]);

  // Load contract details when contract is selected
  useEffect(() => {
    if (selectedContract) {
      loadContractDetails();
    }
  }, [selectedContract]);

  const loadContracts = async () => {
    try {
      setContractsLoading(true);
      let query = supabase
        .from('contracts')
        .select('*')
        .in('estado', ['en_ejecucion']);

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

  const loadContractDetails = async () => {
    try {
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', selectedContract)
        .single();

      if (error) throw error;
      console.log('Contract details loaded:', contract);
      setContractDetails(contract);
    } catch (error: any) {
      console.error('Error loading contract details:', error);
    }
  };

  const resetForm = () => {
    setSelectedContract("");
    setContractDetails(null);
    setAmount("");
    setStartDate(undefined);
    setEndDate(undefined);
    setActivities([]);
    setCurrentActivity({
      id: crypto.randomUUID(),
      activityName: '',
      actions: '',
      evidences: [],
      status: 'draft'
    });
    setShowCurrentActivity(false);
    setCurrentDraftId(null);
    setBillingStatus('borrador');
    setPlanillaNumero('');
    setPlanillaValor('');
    setPlanillaFecha('');
    setPlanillaFile(null);
    if (signatureRef) {
      signatureRef.clear();
    }
    setUploads({
      social_security: { file: null, uploaded: false, uploading: false }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'planilla') {
      setPlanillaFile(file);
      return;
    }

    setUploads(prev => ({
      ...prev,
      [type]: { ...prev[type], file, uploaded: true }
    }));
  };

  const saveAsDraft = async () => {
    try {
      setIsSubmitting(true);

      if (!selectedContract || !amount || !startDate || !endDate) {
        toast({
          title: "Error",
          description: "Complete los campos básicos: contrato, valor y período de facturación",
          variant: "destructive"
        });
        return;
      }

      const startDateString = format(startDate, 'yyyy-MM-dd');

      const { data: existingBilling, error: searchError } = await supabase
        .from('billing_accounts')
        .select('*')
        .eq('contract_id', selectedContract)
        .eq('billing_month', startDateString)
        .eq('created_by', userProfile.id)
        .maybeSingle();

      if (searchError) throw searchError;

      let billingAccountId = currentDraftId;

      if (existingBilling) {
        billingAccountId = existingBilling.id;
        setCurrentDraftId(existingBilling.id);
        setBillingStatus(existingBilling.status as 'borrador' | 'pendiente_revision' | 'aprobada' | 'rechazada' | 'pagada');
      } else {
        const { data: draftBilling, error: draftError } = await supabase
          .from('billing_accounts')
          .insert({
            contract_id: selectedContract,
            amount: parseFloat(amount),
            billing_month: startDateString,
            billing_start_date: startDateString,
            billing_end_date: format(endDate, 'yyyy-MM-dd'),
            created_by: userProfile.id,
            status: 'borrador',
            account_number: ''
          })
          .select()
          .single();

        if (draftError) throw draftError;

        billingAccountId = draftBilling.id;
        setCurrentDraftId(draftBilling.id);
        setBillingStatus('borrador');
      }

      // Save activities
      const activityPromises = activities.map(async (activity, index) => {
        if (activity.status === 'draft') {
          const { data: savedActivity, error: activityError } = await supabase
            .from('billing_activities')
            .insert({
              billing_account_id: billingAccountId,
              activity_name: activity.activityName,
              actions_developed: activity.actions,
              activity_order: index + 1,
              status: 'borrador'
            })
            .select()
            .single();

          if (activityError) throw activityError;

          if (activity.evidences.length > 0) {
            const evidencePromises = activity.evidences.map(async (file) => {
              const fileExt = file.name.split('.').pop();
              const fileName = `${userProfile.user_id}/${billingAccountId}/evidence_${savedActivity.id}_${Date.now()}.${fileExt}`;

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('billing-evidence')
                .upload(fileName, file);

              if (uploadError) throw uploadError;

              await supabase
                .from('billing_activity_evidence')
                .insert({
                  billing_activity_id: savedActivity.id,
                  file_name: file.name,
                  file_path: uploadData.path,
                  file_size: file.size,
                  mime_type: file.type,
                  uploaded_by: userProfile.id
                });
            });

            await Promise.all(evidencePromises);
          }
        }
      });

      await Promise.all(activityPromises);

      toast({
        title: "Borrador Guardado",
        description: "El borrador de la cuenta ha sido guardado exitosamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving billing account as draft:', error);
      toast({
        title: "Error",
        description: `Error al guardar borrador: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveActivityIndividually = async () => {
    if (!currentActivity.activityName.trim() || !currentActivity.actions.trim()) {
      toast({
        title: "Error", 
        description: "Complete el nombre de la actividad y las acciones desarrolladas",
        variant: "destructive"
      });
      return;
    }

    try {
      let billingAccountId = currentDraftId;
      
      if (!billingAccountId) {
        if (!selectedContract || !amount || !startDate || !endDate) {
          toast({
            title: "Error",
            description: "Complete los campos básicos: contrato, valor y período de facturación para registrar actividades",
            variant: "destructive"
          });
          return;
        }

        const startDateString = format(startDate, 'yyyy-MM-dd');
        
        const { data: existingBilling, error: searchError } = await supabase
          .from('billing_accounts')
          .select('*')
          .eq('contract_id', selectedContract)
          .eq('billing_month', startDateString)
          .eq('created_by', userProfile.id)
          .maybeSingle();

        if (searchError) throw searchError;

        if (existingBilling) {
          billingAccountId = existingBilling.id;
          setCurrentDraftId(existingBilling.id);
          setBillingStatus(existingBilling.status as 'borrador' | 'pendiente_revision' | 'aprobada' | 'rechazada' | 'pagada');
        } else {
          const { data: draftBilling, error: draftError } = await supabase
            .from('billing_accounts')
            .insert({
              contract_id: selectedContract,
              amount: parseFloat(amount),
              billing_month: startDateString,
              billing_start_date: startDateString,
              billing_end_date: format(endDate, 'yyyy-MM-dd'),
              created_by: userProfile.id,
              status: 'borrador',
              account_number: ''
            })
            .select()
            .single();

          if (draftError) throw draftError;
          
          billingAccountId = draftBilling.id;
          setCurrentDraftId(draftBilling.id);
          setBillingStatus('borrador');
        }
      }

      const { data: savedActivity, error: activityError } = await supabase
        .from('billing_activities')
        .insert({
          billing_account_id: billingAccountId,
          activity_name: currentActivity.activityName,
          actions_developed: currentActivity.actions,
          activity_order: activities.length + 1,
          status: 'borrador'
        })
        .select()
        .single();

      if (activityError) throw activityError;

      if (currentActivity.evidences.length > 0) {
        const evidencePromises = currentActivity.evidences.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userProfile.user_id}/${billingAccountId}/evidence_${savedActivity.id}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('billing-evidence')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          await supabase
            .from('billing_activity_evidence')
            .insert({
              billing_activity_id: savedActivity.id,
              file_name: file.name,
              file_path: uploadData.path,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: userProfile.id
            });
        });

        await Promise.all(evidencePromises);
      }
      
      const newSavedActivity = {
        ...currentActivity,
        status: 'saved' as const,
        dbId: savedActivity.id
      };
      
      setActivities(prev => [...prev, newSavedActivity]);
      setCurrentActivity({
        id: crypto.randomUUID(),
        activityName: '',
        actions: '',
        evidences: [],
        status: 'draft'
      });
      setShowCurrentActivity(false);
      
      toast({
        title: "Actividad Registrada",
        description: `Actividad "${newSavedActivity.activityName}" ha sido registrada exitosamente`,
      });
    } catch (error: any) {
      console.error('Error saving activity:', error);
      toast({
        title: "Error",
        description: `No se pudo registrar la actividad: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!canSubmitForReview) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos, registre al menos una actividad, complete la planilla y firme el documento",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let billingAccountId = currentDraftId;

      // Upload signature
      const signatureBlob = await new Promise<Blob>((resolve) => {
        signatureRef!.getCanvas().toBlob(resolve as any, 'image/png');
      });
      
      const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });
      const signaturePath = `${billingAccountId}/signature.png`;
      
      const { data: signatureUploadData, error: signatureUploadError } = await supabase.storage
        .from('billing-signatures')
        .upload(signaturePath, signatureFile, { upsert: true });
        
      if (signatureUploadError) throw signatureUploadError;

      // Upload planilla file
      let planillaFileUrl = null;
      if (planillaFile) {
        const planillaPath = `${billingAccountId}/planilla.${planillaFile.name.split('.').pop()}`;
        
        const { data: planillaUploadData, error: planillaUploadError } = await supabase.storage
          .from('billing-documents')
          .upload(planillaPath, planillaFile, { upsert: true });
          
        if (planillaUploadError) throw planillaUploadError;
        planillaFileUrl = planillaUploadData.path;
      }

      // Update billing account with all new fields
      const { error: updateError } = await supabase
        .from('billing_accounts')
        .update({
          amount: parseFloat(amount),
          billing_start_date: format(startDate!, 'yyyy-MM-dd'),
          billing_end_date: format(endDate!, 'yyyy-MM-dd'),
          status: 'pendiente_revision',
          planilla_numero: planillaNumero,
          planilla_valor: parseFloat(planillaValor),
          planilla_fecha: planillaFecha,
          planilla_file_url: planillaFileUrl,
          firma_url: signatureUploadData.path,
          enviado_el: new Date().toISOString()
        })
        .eq('id', billingAccountId);
      
      if (updateError) throw updateError;

      toast({
        title: "Éxito",
        description: "Cuenta de cobro enviada para revisión correctamente"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting billing account:', error);
      toast({
        title: "Error",
        description: `Error al enviar la cuenta: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addActivity = () => {
    setShowCurrentActivity(true);
  };

  const removeActivity = (activityId: string) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
  };

  const addEvidenceToCurrentActivity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setCurrentActivity(prev => ({
      ...prev,
      evidences: [...prev.evidences, ...files]
    }));
  };

  const removeEvidenceFromCurrentActivity = (index: number) => {
    setCurrentActivity(prev => ({
      ...prev,
      evidences: prev.evidences.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cuenta de Cobro</DialogTitle>
          <DialogDescription>
            Complete la información para crear una nueva cuenta de cobro
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Contract Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Selección de Contrato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Contrato *</Label>
                  <Select value={selectedContract} onValueChange={setSelectedContract}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un contrato activo" />
                    </SelectTrigger>
                    <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    <div className="flex flex-col gap-1 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {contract.contract_number_original || contract.contract_number}
                        </span>
                        {contract.client_name && (
                          <span className="text-sm text-muted-foreground">
                            • {contract.client_name}
                          </span>
                        )}
                      </div>
                      {(contract.cdp || contract.rp) && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {contract.cdp && (
                            <span>CDP: {contract.cdp}</span>
                          )}
                          {contract.rp && (
                            <span>RP: {contract.rp}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contract Details */}
                {contractDetails && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                    <h4 className="font-medium text-base">Detalles del Contrato</h4>
                    <div className="space-y-3">
                      {/* Información básica */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Número:</span>
                          <p className="font-medium">{contractDetails.contract_number_original || contractDetails.contract_number}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium">
                            {contractDetails.contract_type === 'fixed_amount' && 'Monto Fijo'}
                            {contractDetails.contract_type === 'variable_amount' && 'Monto Variable'}
                            {contractDetails.contract_type === 'contractor' && 'Contratista'}
                          </p>
                        </div>
                      </div>

                      {/* Referencias administrativas */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">CDP:</span>
                          <p className="font-medium">{contractDetails.cdp || 'No especificado'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">RP:</span>
                          <p className="font-medium">{contractDetails.rp || 'No especificado'}</p>
                        </div>
                      </div>

                      {/* Valor y período */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <p className="font-medium">{formatCurrency(contractDetails.total_amount)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Período de Ejecución:</span>
                          <p className="font-medium">
                            {contractDetails.execution_period_months 
                              ? `${contractDetails.execution_period_months} meses` 
                              : contractDetails.execution_period_days 
                                ? `${contractDetails.execution_period_days} días`
                                : 'No especificado'}
                          </p>
                        </div>
                      </div>

                      {/* Vigencia */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Fecha Inicio:</span>
                          <p className="font-medium">{format(new Date(contractDetails.start_date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fecha Fin:</span>
                          <p className="font-medium">{format(new Date(contractDetails.end_date), 'dd/MM/yyyy')}</p>
                        </div>
                      </div>

                      {/* Descripción */}
                      {contractDetails.description && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Descripción:</span>
                          <p className="font-medium text-xs mt-1 line-clamp-2">{contractDetails.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* User Profile Details */}
                {userProfile && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-medium">Datos del Contratista</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Nombre:</strong> {userProfile.name}</div>
                      <div><strong>Email:</strong> {userProfile.email}</div>
                      <div><strong>Documento:</strong> {userProfile.document_number || 'No especificado'}</div>
                      <div><strong>Teléfono:</strong> {userProfile.phone || 'No especificado'}</div>
                      <div><strong>Dirección:</strong> {userProfile.address || 'No especificada'}</div>
                      <div><strong>NIT:</strong> {userProfile.nit || 'No especificado'}</div>
                      <div><strong>Régimen:</strong> {userProfile.tax_regime || 'Régimen Simplificado'}</div>
                      <div><strong>Banco:</strong> {userProfile.bank_name || 'No especificado'}</div>
                      <div><strong>Cuenta:</strong> {userProfile.bank_account || 'No especificada'}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de Facturación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor de la Cuenta *</Label>
                  <Input
                    type="text"
                    value={amount ? formatCurrencyInput(amount) : ''}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^\d]/g, '');
                      setAmount(numericValue);
                    }}
                    placeholder="$ 0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Inicio *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Fin *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Actividades Desarrolladas
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addActivity}
                    disabled={!selectedContract}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Actividad
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.filter(a => a.status === 'saved').length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No hay actividades registradas. Agregue al menos una actividad.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.filter(a => a.status === 'saved').map((activity, index) => (
                      <div key={activity.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{index + 1}. {activity.activityName}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{activity.actions}</p>
                            {activity.evidences.length > 0 && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {activity.evidences.length} evidencia(s)
                                </Badge>
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeActivity(activity.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current Activity Form */}
                {showCurrentActivity && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted">
                    <h4 className="font-medium mb-3">Nueva Actividad</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Nombre de la Actividad *</Label>
                        <Input
                          value={currentActivity.activityName}
                          onChange={(e) => setCurrentActivity(prev => ({ ...prev, activityName: e.target.value }))}
                          placeholder="Ej: Desarrollo de módulo de usuarios"
                        />
                      </div>
                      
                      <div>
                        <Label>Acciones Desarrolladas *</Label>
                        <Textarea
                          value={currentActivity.actions}
                          onChange={(e) => setCurrentActivity(prev => ({ ...prev, actions: e.target.value }))}
                          placeholder="Describa las acciones específicas realizadas..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Evidencias (opcional)</Label>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={addEvidenceToCurrentActivity}
                        />
                        {currentActivity.evidences.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {currentActivity.evidences.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span>{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEvidenceFromCurrentActivity(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={saveActivityIndividually}
                          disabled={!currentActivity.activityName.trim() || !currentActivity.actions.trim()}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Registrar Actividad
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCurrentActivity(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Planilla Section */}
            <Card>
              <CardHeader>
                <CardTitle>Planilla de Seguridad Social</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Planilla *</Label>
                    <Input
                      value={planillaNumero}
                      onChange={(e) => setPlanillaNumero(e.target.value)}
                      placeholder="Ej: 123456789"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Valor Pagado *</Label>
                    <Input
                      type="text"
                      value={planillaValor ? formatCurrencyInput(planillaValor) : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '');
                        setPlanillaValor(numericValue);
                      }}
                      placeholder="$ 0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Pago *</Label>
                    <Input
                      type="date"
                      value={planillaFecha}
                      onChange={(e) => setPlanillaFecha(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Archivo de Planilla *</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'planilla')}
                    />
                    {planillaFile && (
                      <p className="text-sm text-muted-foreground">
                        Archivo seleccionado: {planillaFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signature Section */}
            <Card>
              <CardHeader>
                <CardTitle>Firma del Contratista</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <SignatureCanvas
                      ref={(ref) => setSignatureRef(ref)}
                      canvasProps={{
                        className: 'signature-canvas border rounded w-full h-32',
                        width: 400,
                        height: 128
                      }}
                    />
                    <div className="flex justify-between mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => signatureRef?.clear()}
                      >
                        Limpiar
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Dibuje su firma en el recuadro
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmitForReview || isSubmitting}
              >
                {isSubmitting && <Send className="h-4 w-4 mr-2 animate-pulse" />}
                Enviar para Revisión
              </Button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <BillingDocumentPreview
              userProfile={userProfile}
              selectedContract={contractDetails}
              amount={amount}
              startDate={startDate}
              endDate={endDate}
              activities={activities.filter(a => a.status === 'saved')}
              planillaNumero={planillaNumero}
              planillaValor={planillaValor}
              planillaFecha={planillaFecha}
              signatureRef={signatureRef}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
