import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, CheckCircle, CalendarIcon, Plus, Save, Send, Loader2, Trash2 } from "lucide-react";
import { formatCurrency, formatCurrencyInput } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BillingDocumentPreview } from "@/components/billing/BillingDocumentPreview";
import SignatureCanvas from "react-signature-canvas";

interface EditBillingAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingAccount: any;
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

export function EditBillingAccountDialog({
  open,
  onOpenChange,
  billingAccount,
  userProfile,
  onSuccess
}: EditBillingAccountDialogProps) {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>("");
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
  const [loading, setLoading] = useState(true);
  
  const [uploads, setUploads] = useState<Record<string, Omit<FileUpload, 'type'>>>({
    social_security: { file: null, uploaded: false, uploading: false }
  });

  // Campos adicionales para planilla y firma
  const [planillaNumero, setPlanillaNumero] = useState<string>("");
  const [planillaValor, setPlanillaValor] = useState<string>("");
  const [planillaFecha, setPlanillaFecha] = useState<Date>();
  const [reviewComments, setReviewComments] = useState<any[]>([]);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);

  const canEdit = billingAccount?.status === 'borrador' || billingAccount?.status === 'rechazada';
  const canSubmitForReview = selectedContract && amount && startDate && endDate && 
                            activities.filter(a => a.status === 'saved').length > 0 && 
                            uploads.social_security.uploaded &&
                            (billingAccount?.status === 'borrador' || billingAccount?.status === 'rechazada');

  useEffect(() => {
    if (open && billingAccount) {
      loadBillingAccountData();
      loadContracts();
    }
  }, [open, billingAccount]);

  const loadBillingAccountData = async () => {
    if (!billingAccount) return;
    
    try {
      setLoading(true);
      
      // Load billing account with contract details
      const { data: billing, error: billingError } = await supabase
        .from('billing_accounts')
        .select(`
          *,
          contracts(*)
        `)
        .eq('id', billingAccount.id)
        .single();

      // Load review comments
      const { data: reviewComments, error: reviewsError } = await supabase
        .from('billing_reviews')
        .select(`
          action,
          comments,
          created_at,
          reviewer:profiles!billing_reviews_reviewer_id_fkey(name)
        `)
        .eq('billing_account_id', billingAccount.id)
        .order('created_at', { ascending: false });
      
      console.log('Review comments loaded:', reviewComments);

      if (billingError) throw billingError;
      if (reviewsError) {
        console.error('Error loading review comments:', reviewsError);
      }

      setReviewComments(reviewComments || []);

      // Load contractor profile (creator of the billing account)
      try {
        const { data: creator, error: creatorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', billing.created_by)
          .single();
        if (!creatorError) setCreatorProfile(creator);
      } catch (e) {
        console.warn('No se pudo cargar el perfil del creador de la cuenta de cobro', e);
      }

      // Set form data
      setSelectedContract(billing.contract_id);
      setAmount(billing.amount?.toString() || '');
      setStartDate(billing.billing_start_date ? new Date(billing.billing_start_date) : undefined);
      setEndDate(billing.billing_end_date ? new Date(billing.billing_end_date) : undefined);
      
      // Load planilla data
      setPlanillaNumero((billing as any).planilla_numero || "");
      setPlanillaValor((billing as any).planilla_valor?.toString() || "");
      setPlanillaFecha((billing as any).planilla_fecha ? new Date((billing as any).planilla_fecha) : undefined);
      
      // Load signature if exists
      if ((billing as any).firma_url && signatureRef.current) {
        signatureRef.current.fromDataURL((billing as any).firma_url);
      }

      // Load activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('billing_activities')
        .select('*')
        .eq('billing_account_id', billing.id)
        .order('activity_order');

      if (activitiesError) throw activitiesError;

      const loadedActivities: Activity[] = activitiesData?.map(activity => ({
        id: activity.id,
        activityName: activity.activity_name,
        actions: activity.actions_developed,
        evidences: [],
        status: 'saved' as const,
        dbId: activity.id
      })) || [];

      setActivities(loadedActivities);

      // Load existing documents
      const { data: documents, error: documentsError } = await supabase
        .from('billing_documents')
        .select('*')
        .eq('billing_account_id', billing.id);

      if (documentsError) throw documentsError;

      // Update uploads state with existing documents
      const updatedUploads = { ...uploads };
      documents?.forEach(doc => {
        if (doc.document_type === 'social_security') {
          updatedUploads.social_security = {
            file: null,
            uploaded: true,
            uploading: false
          };
        }
      });
      setUploads(updatedUploads);

    } catch (error: any) {
      console.error('Error loading billing account data:', error);
      toast({
        title: "Error",
        description: `No se pudo cargar la información de la cuenta de cobro: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (only PDFs allowed)
    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "El archivo no puede ser mayor a 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploads(prev => ({
      ...prev,
      [type]: { ...prev[type], file, uploaded: true, uploading: false }
    }));
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
      // Save activity to database
      const { data: savedActivity, error: activityError } = await supabase
        .from('billing_activities')
        .insert({
          billing_account_id: billingAccount.id,
          activity_name: currentActivity.activityName,
          actions_developed: currentActivity.actions,
          activity_order: activities.length + 1,
          status: 'saved'
        })
        .select()
        .single();

      if (activityError) throw activityError;

      // Upload evidence files if any
      if (currentActivity.evidences.length > 0) {
        const evidencePromises = currentActivity.evidences.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userProfile.user_id}/${billingAccount.id}/evidence_${savedActivity.id}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('billing-documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Save evidence record
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
      
      // Add activity to local state and reset current activity
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

  const deleteActivity = async (activityId: string) => {
    try {
      // Obtener evidencias para eliminar archivos y registros
      const { data: evidences, error: evidencesError } = await supabase
        .from('billing_activity_evidence')
        .select('id, file_path')
        .eq('billing_activity_id', activityId);

      if (evidencesError) throw evidencesError;

      // Intentar borrar archivos del storage (ignorar errores)
      try {
        if (evidences && evidences.length > 0) {
          const paths = evidences.map((e) => e.file_path);
          await supabase.storage.from('billing-documents').remove(paths);
        }
      } catch (e) {
        console.warn('No se pudieron eliminar algunos archivos del storage:', e);
      }

      // Borrar registros de evidencias
      if (evidences && evidences.length > 0) {
        await supabase
          .from('billing_activity_evidence')
          .delete()
          .in('id', evidences.map((e) => e.id));
      }

      // Borrar la actividad
      const { error: deleteError } = await supabase
        .from('billing_activities')
        .delete()
        .eq('id', activityId);

      if (deleteError) throw deleteError;

      // Actualizar estado local
      setActivities((prev) => prev.filter((a) => a.dbId !== activityId && a.id !== activityId));

      toast({
        title: 'Actividad eliminada',
        description: 'Se eliminó correctamente la actividad.',
      });
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Error',
        description: `No se pudo eliminar la actividad: ${error.message || 'Error desconocido'}`,
        variant: 'destructive',
      });
    }
  };

  const saveAsDraft = async () => {
    if (!selectedContract || !amount || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Complete los campos básicos: contrato, valor y período de facturación",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Guardar firma como base64 si existe
      let firmaUrl = null;
      if (signatureRef.current && !signatureRef.current.isEmpty()) {
        firmaUrl = signatureRef.current.toDataURL();
      }

      const { error } = await supabase
        .from('billing_accounts')
        .update({
          contract_id: selectedContract,
          amount: parseFloat(amount),
          billing_start_date: format(startDate, 'yyyy-MM-dd'),
          billing_end_date: format(endDate, 'yyyy-MM-dd'),
          planilla_numero: planillaNumero || null,
          planilla_valor: planillaValor ? parseFloat(planillaValor) : null,
          planilla_fecha: planillaFecha ? format(planillaFecha, 'yyyy-MM-dd') : null,
          firma_url: firmaUrl,
          status: 'borrador'
        })
        .eq('id', billingAccount.id);

      if (error) throw error;

      // Upload social security document if changed
      if (uploads.social_security.file) {
        const fileExt = uploads.social_security.file.name.split('.').pop();
        const fileName = `${userProfile.user_id}/${billingAccount.id}/social_security.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('billing-documents')
          .upload(fileName, uploads.social_security.file, { upsert: true });

        if (uploadError) throw uploadError;

        // Delete existing document record and create new one
        await supabase
          .from('billing_documents')
          .delete()
          .eq('billing_account_id', billingAccount.id)
          .eq('document_type', 'social_security');

        await supabase
          .from('billing_documents')
          .insert({
            billing_account_id: billingAccount.id,
            document_type: 'social_security',
            uploaded_by: userProfile.id,
            file_name: uploads.social_security.file.name,
            file_path: uploadData.path,
            file_size: uploads.social_security.file.size,
            mime_type: uploads.social_security.file.type
          });
      }

      toast({
        title: "Borrador Actualizado",
        description: "Los cambios han sido guardados como borrador",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating draft:', error);
      toast({
        title: "Error",
        description: `No se pudo actualizar el borrador: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!canSubmitForReview) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos, registre al menos una actividad y adjunte el documento de seguridad social",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Guardar firma como base64 si existe
      let firmaUrl = null;
      if (signatureRef.current && !signatureRef.current.isEmpty()) {
        firmaUrl = signatureRef.current.toDataURL();
      }

      const { error } = await supabase
        .from('billing_accounts')
        .update({
          contract_id: selectedContract,
          amount: parseFloat(amount),
          billing_start_date: format(startDate, 'yyyy-MM-dd'),
          billing_end_date: format(endDate, 'yyyy-MM-dd'),
          planilla_numero: planillaNumero || null,
          planilla_valor: planillaValor ? parseFloat(planillaValor) : null,
          planilla_fecha: planillaFecha ? format(planillaFecha, 'yyyy-MM-dd') : null,
          firma_url: firmaUrl,
          status: 'pendiente_revision'
        })
        .eq('id', billingAccount.id);

      if (error) throw error;

      // Upload social security document if changed
      if (uploads.social_security.file) {
        const fileExt = uploads.social_security.file.name.split('.').pop();
        const fileName = `${userProfile.user_id}/${billingAccount.id}/social_security.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('billing-documents')
          .upload(fileName, uploads.social_security.file, { upsert: true });

        if (uploadError) throw uploadError;

        // Delete existing document record and create new one
        await supabase
          .from('billing_documents')
          .delete()
          .eq('billing_account_id', billingAccount.id)
          .eq('document_type', 'social_security');

        await supabase
          .from('billing_documents')
          .insert({
            billing_account_id: billingAccount.id,
            document_type: 'social_security',
            uploaded_by: userProfile.id,
            file_name: uploads.social_security.file.name,
            file_path: uploadData.path,
            file_size: uploads.social_security.file.size,
            mime_type: uploads.social_security.file.type
          });
      }

      toast({
        title: "Éxito",
        description: "Cuenta de cobro enviada a revisión correctamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting for review:', error);
      toast({
        title: "Error",
        description: `No se pudo enviar a revisión: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedContractData = contracts.find(c => c.id === selectedContract);
  const formattedAmount = amount ? formatCurrency(parseFloat(amount)) : '';

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando cuenta de cobro...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {canEdit ? 'Editar Cuenta de Cobro' : 'Ver Cuenta de Cobro'} - {billingAccount?.account_number}
          </DialogTitle>
          <DialogDescription>
            {canEdit 
              ? 'Modifique la información de la cuenta de cobro. Complete todos los campos requeridos.'
              : 'Información detallada de la cuenta de cobro.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Contrato</CardTitle>
              <CardDescription>Seleccione el contrato para esta cuenta de cobro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract">Contrato *</Label>
                <Select 
                  value={selectedContract} 
                  onValueChange={setSelectedContract}
                  disabled={!canEdit || contractsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={contractsLoading ? "Cargando contratos..." : "Seleccione un contrato"} />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.contract_number}</span>
                          <span className="text-sm text-muted-foreground">{contract.client_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedContractData && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Detalles del Contrato Seleccionado</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="ml-2 font-medium">{selectedContractData.client_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor Total:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedContractData.total_amount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inicio:</span>
                      <span className="ml-2">{new Date(selectedContractData.start_date).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fin:</span>
                      <span className="ml-2">{new Date(selectedContractData.end_date).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalles de Facturación</CardTitle>
              <CardDescription>Configure el valor y período de facturación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor a Facturar *</Label>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => {
                      // Permitir solo números
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setAmount(value);
                    }}
                    placeholder="0"
                    disabled={!canEdit}
                  />
                  {formattedAmount && (
                    <p className="text-sm text-muted-foreground">
                      Formato: {formattedAmount}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Inicio del Período *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                        disabled={!canEdit}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Fin del Período *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={!canEdit}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Actividades del Contrato
                {canEdit && (
                  <Button 
                    onClick={() => setShowCurrentActivity(!showCurrentActivity)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Actividad
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Liste las actividades realizadas durante este período de facturación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Activity Form */}
              {showCurrentActivity && canEdit && (
                <Card className="border-dashed">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Nueva Actividad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="activityName">Nombre de la Actividad *</Label>
                      <Input
                        id="activityName"
                        value={currentActivity.activityName}
                        onChange={(e) => setCurrentActivity(prev => ({ ...prev, activityName: e.target.value }))}
                        placeholder="Ej: Consulta médica, Procedimiento quirúrgico, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actions">Acciones Desarrolladas *</Label>
                      <Textarea
                        id="actions"
                        value={currentActivity.actions}
                        onChange={(e) => setCurrentActivity(prev => ({ ...prev, actions: e.target.value }))}
                        placeholder="Describa detalladamente las acciones realizadas durante esta actividad..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evidences">Evidencias (opcional)</Label>
                      <Input
                        id="evidences"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setCurrentActivity(prev => ({ ...prev, evidences: files }));
                        }}
                        className="cursor-pointer"
                      />
                      {currentActivity.evidences.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {currentActivity.evidences.length} archivo(s) seleccionado(s)
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={saveActivityIndividually} size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Registrar Actividad
                      </Button>
                      <Button 
                        onClick={() => setShowCurrentActivity(false)} 
                        variant="outline" 
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Saved Activities List */}
              {activities.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Actividades Registradas ({activities.length})</h4>
                  {activities.map((activity, index) => (
                    <Card key={activity.id} className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">Actividad {index + 1}</Badge>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <h5 className="font-medium mb-2">{activity.activityName}</h5>
                            <p className="text-sm text-muted-foreground mb-2">{activity.actions}</p>
                            {activity.evidences.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {activity.evidences.length} evidencia(s) adjunta(s)
                              </div>
                            )}
                          </div>
                          {canEdit && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteActivity(activity.dbId || activity.id)}
                              aria-label="Eliminar actividad"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay actividades registradas</p>
                  {canEdit && (
                    <p className="text-sm">Agregue al menos una actividad para continuar</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Planilla de Seguridad Social */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Planilla de Seguridad Social</CardTitle>
              <CardDescription>Información y documentos de la planilla de seguridad social</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planillaNumero">Número de Planilla</Label>
                  <Input
                    id="planillaNumero"
                    value={planillaNumero}
                    onChange={(e) => setPlanillaNumero(e.target.value)}
                    placeholder="Ej: 123456789"
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planillaValor">Valor Pagado</Label>
                  <Input
                    id="planillaValor"
                    type="text"
                    inputMode="numeric"
                    value={planillaValor}
                    onChange={(e) => {
                      // Permitir solo números
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setPlanillaValor(value);
                    }}
                    placeholder="0"
                    disabled={!canEdit}
                  />
                  {planillaValor && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(parseFloat(planillaValor))}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Pago</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !planillaFecha && "text-muted-foreground"
                        )}
                        disabled={!canEdit}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {planillaFecha ? format(planillaFecha, "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={planillaFecha}
                        onSelect={setPlanillaFecha}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_security">Archivo de Planilla *</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="social_security"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, 'social_security')}
                      disabled={!canEdit}
                      className="cursor-pointer"
                    />
                  </div>
                  {uploads.social_security.uploaded && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Subido</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Solo archivos PDF, máximo 10MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Firma del Contratista */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Firma del Contratista</CardTitle>
              <CardDescription>Firme digitalmente el documento de cuenta de cobro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Área de Firma</Label>
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas w-full h-48 border border-gray-200 rounded'
                    }}
                    backgroundColor="rgb(255,255,255)"
                  />
                </div>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => signatureRef.current?.clear()}
                  >
                    Limpiar Firma
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Dibuje su firma en el recuadro arriba usando el mouse o pantalla táctil
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Document Preview */}
          {billingAccount && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vista Previa del Documento</CardTitle>
                <CardDescription>Visualización del documento generado</CardDescription>
              </CardHeader>
              <CardContent>
                <BillingDocumentPreview
                  userProfile={creatorProfile || userProfile}
                  selectedContract={selectedContractData}
                  amount={amount}
                  startDate={startDate}
                  endDate={endDate}
                  activities={activities}
                  planillaNumero={planillaNumero}
                  planillaValor={planillaValor}
                  planillaFecha={planillaFecha ? format(planillaFecha, 'yyyy-MM-dd') : undefined}
                  signatureRef={signatureRef.current}
                  reviewComments={reviewComments}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {canEdit ? 'Cancelar' : 'Cerrar'}
          </Button>
          
          {canEdit && (
            <>
              <Button 
                onClick={saveAsDraft} 
                disabled={isSubmitting}
                variant="outline"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Borrador
              </Button>
              
              <Button 
                onClick={handleSubmitForReview} 
                disabled={!canSubmitForReview || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar a Revisión
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}