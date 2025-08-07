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
import { Upload, FileText, X, CheckCircle, CalendarIcon, Plus, Save, Send } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BillingDocumentPreview } from "./BillingDocumentPreview";

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
  const [billingStatus, setBillingStatus] = useState<'draft' | 'pending_review' | 'approved' | 'rejected' | 'paid'>('draft');
  
  const [uploads, setUploads] = useState<Record<string, Omit<FileUpload, 'type'>>>({
    social_security: { file: null, uploaded: false, uploading: false }
  });
  
  const canSubmitForReview = selectedContract && amount && startDate && endDate && 
                            activities.filter(a => a.status === 'saved').length > 0 && 
                            uploads.social_security.uploaded;

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
        .in('status', ['active']);

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
    setBillingStatus('draft');
    setUploads({
      social_security: { file: null, uploaded: false, uploading: false }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploads(prev => ({
      ...prev,
      [type]: { ...prev[type], file, uploaded: false }
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
      // Create draft billing account if it doesn't exist
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
        const { data: draftBilling, error: draftError } = await supabase
          .from('billing_accounts')
          .insert({
            contract_id: selectedContract,
            amount: parseFloat(amount),
            billing_month: startDateString,
            billing_start_date: startDateString,
            billing_end_date: format(endDate, 'yyyy-MM-dd'),
            created_by: userProfile.id,
            status: 'draft',
            account_number: ''
          })
          .select()
          .single();

        if (draftError) {
          console.error('Error creating draft billing account:', draftError);
          throw draftError;
        }
        
        billingAccountId = draftBilling.id;
        setCurrentDraftId(draftBilling.id);
        setBillingStatus('draft');
      }

      // Save activity to database
      const { data: savedActivity, error: activityError } = await supabase
        .from('billing_activities')
        .insert({
          billing_account_id: billingAccountId,
          activity_name: currentActivity.activityName,
          actions_developed: currentActivity.actions,
          activity_order: activities.length + 1,
          status: 'saved'
        })
        .select()
        .single();

      if (activityError) {
        console.error('Error saving activity:', activityError);
        throw activityError;
      }

      // Upload evidence files if any
      if (currentActivity.evidences.length > 0) {
        const evidencePromises = currentActivity.evidences.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userProfile.user_id}/${billingAccountId}/evidence_${savedActivity.id}_${Date.now()}.${fileExt}`;
          
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
        description: "No se pudo registrar la actividad",
        variant: "destructive"
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
      if (currentDraftId) {
        toast({
          title: "Información",
          description: "El borrador ya ha sido guardado. Continúe editando.",
        });
        return;
      }

      const startDateString = format(startDate, 'yyyy-MM-dd');
      const { data: draftBilling, error: draftError } = await supabase
        .from('billing_accounts')
        .insert({
          contract_id: selectedContract,
          amount: parseFloat(amount),
          billing_month: startDateString,
          billing_start_date: startDateString,
          billing_end_date: format(endDate, 'yyyy-MM-dd'),
          created_by: userProfile.id,
          status: 'draft',
          account_number: ''
        })
        .select()
        .single();

      if (draftError) throw draftError;
      
      setCurrentDraftId(draftBilling.id);
      setBillingStatus('draft');

      toast({
        title: "Borrador Guardado",
        description: "Los datos han sido guardados como borrador para edición posterior",
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el borrador",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedContract || !amount || !startDate || !endDate || 
        activities.filter(a => a.status === 'saved').length === 0 || 
        !uploads.social_security.file) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos y registre al menos una actividad",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let billingAccountId = currentDraftId;

      // Update existing draft or create new billing account
      if (currentDraftId) {
        const { error: updateError } = await supabase
          .from('billing_accounts')
          .update({
            amount: parseFloat(amount),
            billing_start_date: format(startDate, 'yyyy-MM-dd'),
            billing_end_date: format(endDate, 'yyyy-MM-dd'),
            status: 'pending_review'
          })
          .eq('id', currentDraftId);
        
        if (updateError) throw updateError;
      } else {
        const startDateString = format(startDate, 'yyyy-MM-dd');
        const { data: newBilling, error: billingError } = await supabase
          .from('billing_accounts')
          .insert({
            contract_id: selectedContract,
            amount: parseFloat(amount),
            billing_month: startDateString,
            billing_start_date: startDateString,
            billing_end_date: format(endDate, 'yyyy-MM-dd'),
            created_by: userProfile.id,
            status: 'pending_review',
            account_number: ''
          })
          .select()
          .single();
        
        if (billingError) throw billingError;
        billingAccountId = newBilling.id;
      }

      // Upload social security document
      if (uploads.social_security.file) {
        const fileExt = uploads.social_security.file.name.split('.').pop();
        const fileName = `${userProfile.user_id}/${billingAccountId}/social_security.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('billing-documents')
          .upload(fileName, uploads.social_security.file);

        if (uploadError) throw uploadError;

        await supabase
          .from('billing_documents')
          .insert({
            billing_account_id: billingAccountId,
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
        description: "Cuenta de cobro enviada para revisión exitosamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting billing account:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la cuenta de cobro",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addActivity = () => {
    setShowCurrentActivity(true);
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  const editActivity = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (activity) {
      setCurrentActivity(activity);
      setShowCurrentActivity(true);
      // Remove from activities list temporarily
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  const selectedContractData = contracts.find(c => c.id === selectedContract);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cuenta de Cobro</DialogTitle>
          <DialogDescription>
            Complete los campos básicos, registre actividades y suba los documentos necesarios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Selection */}
          <div className="space-y-3">
            <Label htmlFor="contract">Contrato *</Label>
            <Select value={selectedContract} onValueChange={setSelectedContract}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un contrato activo" />
              </SelectTrigger>
              <SelectContent>
                {contractsLoading ? (
                  <SelectItem value="loading" disabled>Cargando contratos...</SelectItem>
                ) : contracts.length === 0 ? (
                  <SelectItem value="no-contracts" disabled>No hay contratos activos disponibles</SelectItem>
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
                  {selectedContractData.description && (
                    <div>
                      <span className="text-muted-foreground">Descripción:</span>
                      <p className="text-sm">{selectedContractData.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Amount and Period */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor de la Cuenta *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="pl-8"
                />
              </div>
              {amount && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(parseFloat(amount) || 0)}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Fecha inicio"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => {
                        if (!selectedContractData) return false;
                        const contractStartDate = new Date(selectedContractData.start_date);
                        return date < contractStartDate;
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
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
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Fecha fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => {
                        if (!selectedContractData) return false;
                        const contractStartDate = new Date(selectedContractData.start_date);
                        const minDate = startDate ? startDate : contractStartDate;
                        return date < minDate;
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Activity Management Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Actividades del Contrato</Label>
              <Button
                type="button"
                onClick={addActivity}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Actividad
              </Button>
            </div>

            {/* Current Activity Form */}
            {showCurrentActivity && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Nueva Actividad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="activityName">Actividades del Contrato *</Label>
                    <Input
                      id="activityName"
                      value={currentActivity.activityName}
                      onChange={(e) => setCurrentActivity(prev => ({
                        ...prev,
                        activityName: e.target.value
                      }))}
                      placeholder="Nombre de la actividad..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="actions">Acciones Desarrolladas *</Label>
                    <Textarea
                      id="actions"
                      value={currentActivity.actions}
                      onChange={(e) => setCurrentActivity(prev => ({
                        ...prev,
                        actions: e.target.value
                      }))}
                      placeholder="Describe las acciones desarrolladas..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Evidencias</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setCurrentActivity(prev => ({
                            ...prev,
                            evidences: [...prev.evidences, ...files]
                          }));
                        }}
                        className="hidden"
                        id="evidences"
                      />
                      <label
                        htmlFor="evidences"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          Arrastra archivos aquí o haz clic para seleccionar
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          PDF, Word, Imágenes
                        </span>
                      </label>
                    </div>

                    {/* Show uploaded evidence files */}
                    {currentActivity.evidences.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {currentActivity.evidences.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <FileText className="h-4 w-4" />
                            <span className="flex-1">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentActivity(prev => ({
                                  ...prev,
                                  evidences: prev.evidences.filter((_, i) => i !== index)
                                }));
                              }}
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
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Registrar Actividad
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCurrentActivity(false);
                        setCurrentActivity({
                          id: crypto.randomUUID(),
                          activityName: '',
                          actions: '',
                          evidences: [],
                          status: 'draft'
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Registered Activities List */}
            {activities.filter(a => a.status === 'saved').length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Actividades Registradas</Label>
                {activities.filter(a => a.status === 'saved').map((activity, index) => (
                  <Card key={activity.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              Registrada
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm text-gray-900">
                            {index + 1}. {activity.activityName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{activity.actions}</p>
                          {activity.evidences.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Evidencias: {activity.evidences.map(f => f.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editActivity(activity.id)}
                            className="h-8 w-8 p-0"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeActivity(activity.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Billing Document Preview */}
          <BillingDocumentPreview
            userProfile={userProfile}
            selectedContract={selectedContractData}
            amount={amount}
            startDate={startDate}
            endDate={endDate}
            activities={activities.filter(a => a.status === 'saved')}
          />

          {/* Required Documents */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Documentos Requeridos</Label>
            
            {/* Social Security Document */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Planilla de Seguridad Social *</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'social_security')}
                  className="hidden"
                  id="socialSecurity"
                />
                <label
                  htmlFor="socialSecurity"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {uploads.social_security.file 
                      ? `Archivo: ${uploads.social_security.file.name}`
                      : "Haz clic para seleccionar archivo PDF"
                    }
                  </span>
                </label>
              </div>
              {uploads.social_security.uploading && (
                <div className="text-sm text-blue-600">Subiendo archivo...</div>
              )}
              {uploads.social_security.uploaded && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Archivo cargado correctamente
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={saveAsDraft}
              variant="outline"
              disabled={isSubmitting || !selectedContract || !amount || !startDate || !endDate}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar como Borrador
            </Button>
            
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmitForReview}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Enviando..." : "Enviar para Revisión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}