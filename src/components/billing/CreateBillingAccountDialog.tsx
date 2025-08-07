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
import { Upload, FileText, X, CheckCircle, CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateBillingAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: any;
  onSuccess: () => void;
}

interface FileUpload {
  type: 'billing_invoice' | 'social_security';
  file: File | null;
  uploaded: boolean;
  uploading: boolean;
}

interface Activity {
  id: string;
  activityName: string;
  actions: string;
  evidences: File[];
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
  const [loading, setLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(true);
  
  const [files, setFiles] = useState<Record<string, FileUpload>>({
    billing_invoice: { type: 'billing_invoice', file: null, uploaded: false, uploading: false },
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
        .in('status', ['active']);

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
    setStartDate(undefined);
    setEndDate(undefined);
    setActivities([]);
    setFiles({
      billing_invoice: { type: 'billing_invoice', file: null, uploaded: false, uploading: false },
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

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Debe seleccionar el período de facturación (fecha inicio y fin)",
        variant: "destructive"
      });
      return false;
    }

    if (activities.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos una actividad",
        variant: "destructive"
      });
      return false;
    }

    // Validate each activity
    for (const activity of activities) {
      if (!activity.activityName.trim() || !activity.actions.trim()) {
        toast({
          title: "Error",
          description: "Todas las actividades deben tener nombre y acciones completadas",
          variant: "destructive"
        });
        return false;
      }
    }

    // Validate required files
    const requiredFiles = ['billing_invoice', 'social_security'];
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

      // Check if billing account for this period already exists
      const startDateString = format(startDate!, 'yyyy-MM-dd');
      const endDateString = format(endDate!, 'yyyy-MM-dd');
      const { data: existingBilling } = await supabase
        .from('billing_accounts')
        .select('id')
        .eq('contract_id', selectedContract)
        .eq('billing_month', startDateString)
        .maybeSingle();

      if (existingBilling) {
        toast({
          title: "Error",
          description: "Ya existe una cuenta de cobro para este contrato en el período seleccionado",
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
          billing_month: startDateString,
          created_by: userProfile.id,
          status: 'pending_review',
          account_number: '' // Will be auto-generated by trigger
        })
        .select()
        .single();

      if (billingError) throw billingError;

      // Upload files and save activity report
      const uploadPromises = [
        // Upload files
        ...Object.entries(files).map(async ([type, fileUpload]) => {
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
        }),
        // Save activity report as document with period info
        (async () => {
          const reportContent = `Período: ${format(startDate!, 'dd/MM/yyyy')} - ${format(endDate!, 'dd/MM/yyyy')}\n\n`;
          let activityContent = '';
          
          activities.forEach((activity, index) => {
            activityContent += `${index + 1}. ACTIVIDAD: ${activity.activityName}\n`;
            activityContent += `   ACCIONES: ${activity.actions}\n`;
            if (activity.evidences.length > 0) {
              activityContent += `   EVIDENCIAS: ${activity.evidences.map(f => f.name).join(', ')}\n`;
            }
            activityContent += '\n';
          });
          
          const reportBlob = new Blob([reportContent + activityContent], { type: 'text/plain' });
          const fileName = `${userProfile.user_id}/${billingAccount.id}/activity_report.txt`;
          
          const { data, error } = await supabase.storage
            .from('billing-documents')
            .upload(fileName, reportBlob);

          if (error) throw error;

          await supabase
            .from('billing_documents')
            .insert({
              billing_account_id: billingAccount.id,
              document_type: 'activity_report',
              uploaded_by: userProfile.id,
              file_name: 'Informe de Actividades.txt',
              file_path: data.path,
              file_size: reportBlob.size,
              mime_type: 'text/plain'
            });
        })(),
        // Upload activity evidence files
        ...activities.flatMap((activity, actIndex) => 
          activity.evidences.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userProfile.user_id}/${billingAccount.id}/evidence_${actIndex + 1}_${Date.now()}.${fileExt}`;
            
            const { data, error } = await supabase.storage
              .from('billing-documents')
              .upload(fileName, file);

            if (error) throw error;

            await supabase
              .from('billing_documents')
              .insert({
                billing_account_id: billingAccount.id,
                document_type: 'activity_evidence',
                uploaded_by: userProfile.id,
                file_name: file.name,
                file_path: data.path,
                file_size: file.size,
                mime_type: file.type
              });
          })
        )
      ];

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

  const addActivity = () => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      activityName: '',
      actions: '',
      evidences: []
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  const updateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, [field]: value } : activity
    ));
  };

  const addEvidenceFile = (activityId: string, files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, evidences: [...activity.evidences, ...fileArray] }
        : activity
    ));
  };

  const removeEvidenceFile = (activityId: string, fileIndex: number) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId
        ? { ...activity, evidences: activity.evidences.filter((_, index) => index !== fileIndex) }
        : activity
    ));
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'billing_invoice': return 'Cuenta de Cobro (PDF)';
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
                <Label>Fecha de Inicio *</Label>
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
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Fecha de Fin *</Label>
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
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Activities Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Informe de Actividades *</Label>
              <Button
                type="button"
                variant="outline"
                onClick={addActivity}
                className="text-sm"
              >
                Agregar Actividad
              </Button>
            </div>
            
            {activities.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground text-sm">
                    No hay actividades agregadas. Haga clic en "Agregar Actividad" para comenzar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <Card key={activity.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Actividad #{index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeActivity(activity.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Actividades del Contrato *</Label>
                          <Input
                            placeholder="Ej: Desarrollo del Módulo de Roles"
                            value={activity.activityName}
                            onChange={(e) => updateActivity(activity.id, 'activityName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Acciones Desarrolladas *</Label>
                          <Textarea
                            placeholder="Ej: Implementación de función guardar y editar, AJAX, validaciones..."
                            value={activity.actions}
                            onChange={(e) => updateActivity(activity.id, 'actions', e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Evidencias</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            onChange={(e) => addEvidenceFile(activity.id, e.target.files)}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            PDF, Word, Imágenes
                          </p>
                        </div>
                        
                        {activity.evidences.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Archivos adjuntos:</p>
                            <div className="flex flex-wrap gap-2">
                              {activity.evidences.map((file, fileIndex) => (
                                <Badge
                                  key={fileIndex}
                                  variant="secondary"
                                  className="text-xs flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  {file.name}
                                  <button
                                    type="button"
                                    onClick={() => removeEvidenceFile(activity.id, fileIndex)}
                                    className="ml-1 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {startDate && endDate && (
              <p className="text-sm text-muted-foreground font-medium">
                Período: {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
              </p>
            )}
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