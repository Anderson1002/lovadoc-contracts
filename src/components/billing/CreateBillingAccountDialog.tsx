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
import { Upload, FileText, X, CheckCircle, CalendarIcon, Plus, Save, Send, Download, Check, ChevronsUpDown, Pencil, Trash2, Eye, RefreshCw } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatCurrency, formatCurrencyInput } from "@/lib/utils";
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
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [existingEvidences, setExistingEvidences] = useState<any[]>([]);
  const [previewEvidence, setPreviewEvidence] = useState<{url: string; type: string; name: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractSelectOpen, setContractSelectOpen] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<'borrador' | 'pendiente_revision' | 'aprobada' | 'rechazada' | 'pagada'>('borrador');
  
  // New fields for planilla and signature
  const [planillaNumero, setPlanillaNumero] = useState('');
  const [planillaValor, setPlanillaValor] = useState('');
  const [planillaFecha, setPlanillaFecha] = useState('');
  const [planillaFile, setPlanillaFile] = useState<File | null>(null);
  const [existingPlanillaPath, setExistingPlanillaPath] = useState<string | null>(null);
  const [existingPlanillaUrl, setExistingPlanillaUrl] = useState<string | null>(null);
  const [existingPlanillaName, setExistingPlanillaName] = useState<string | null>(null);
  const planillaFileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploads, setUploads] = useState<Record<string, Omit<FileUpload, 'type'>>>({
    social_security: { file: null, uploaded: false, uploading: false }
  });
  
  // Progressive validation for each phase
  const canSaveDetails = selectedContract && amount && startDate && endDate;
  const canSaveActivity = currentDraftId && currentActivity.activityName.trim() && currentActivity.actions.trim();
  const hasPlanillaFile = planillaFile || existingPlanillaPath;
  const canSavePlanilla = currentDraftId && planillaNumero && planillaValor && planillaFecha && (planillaFile || existingPlanillaPath);
  const canSubmitForReview = currentDraftId && selectedContract && amount && startDate && endDate && 
                            activities.filter(a => a.status === 'saved').length > 0 && 
                            planillaNumero && planillaValor && planillaFecha && hasPlanillaFile;

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
    setEditingActivityId(null);
    setExistingEvidences([]);
    setCurrentDraftId(null);
    setBillingStatus('borrador');
    setPlanillaNumero('');
    setPlanillaValor('');
    setPlanillaFecha('');
    setPlanillaFile(null);
    setExistingPlanillaPath(null);
    setExistingPlanillaUrl(null);
    setExistingPlanillaName(null);
    setUploads({
      social_security: { file: null, uploaded: false, uploading: false }
    });
  };

  // Load existing planilla URL from storage
  const loadExistingPlanillaUrl = async (filePath: string | null) => {
    if (!filePath) {
      setExistingPlanillaUrl(null);
      setExistingPlanillaName(null);
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('billing-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      setExistingPlanillaUrl(data?.signedUrl || null);
      setExistingPlanillaName(filePath.split('/').pop() || 'planilla.pdf');
    } catch (error) {
      console.error('Error loading planilla URL:', error);
      setExistingPlanillaUrl(null);
    }
  };

  // When existingPlanillaPath changes, load the URL
  useEffect(() => {
    if (existingPlanillaPath) {
      loadExistingPlanillaUrl(existingPlanillaPath);
    }
  }, [existingPlanillaPath]);

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

  const saveBillingDetailsOnly = async () => {
    if (!selectedContract || !amount || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Complete todos los campos básicos: contrato, valor y período de facturación",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
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
        const { error: updateError } = await supabase
          .from('billing_accounts')
          .update({
            amount: parseFloat(amount),
            billing_start_date: startDateString,
            billing_end_date: format(endDate, 'yyyy-MM-dd')
          })
          .eq('id', existingBilling.id);

        if (updateError) throw updateError;
        billingAccountId = existingBilling.id;
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
      }
      
      setCurrentDraftId(billingAccountId);
      setBillingStatus('borrador');

      toast({
        title: "Detalles Guardados",
        description: "Los detalles de facturación han sido guardados exitosamente"
      });
    } catch (error: any) {
      console.error('Error saving billing details:', error);
      toast({
        title: "Error",
        description: `Error al guardar detalles: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const savePlanillaOnly = async () => {
    if (!currentDraftId) {
      toast({
        title: "Error",
        description: "Debe guardar primero los detalles de facturación",
        variant: "destructive"
      });
      return;
    }

    if (!planillaNumero || !planillaValor || !planillaFecha || !planillaFile) {
      toast({
        title: "Error",
        description: "Complete todos los campos de la planilla",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload planilla file - use user_id in path to match RLS policy
      const fileExt = planillaFile.name.split('.').pop();
      const planillaPath = `${userProfile.user_id}/${currentDraftId}/planilla.${fileExt}`;
      
      const { data: planillaUploadData, error: planillaUploadError } = await supabase.storage
        .from('billing-documents')
        .upload(planillaPath, planillaFile, { upsert: true });
        
      if (planillaUploadError) {
        console.error('Error uploading planilla file:', planillaUploadError);
        toast({
          title: "Error al subir archivo",
          description: `No se pudo subir el archivo de planilla: ${planillaUploadError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Update billing account with planilla data
      const { error: updateError } = await supabase
        .from('billing_accounts')
        .update({
          planilla_numero: planillaNumero,
          planilla_valor: parseFloat(planillaValor),
          planilla_fecha: planillaFecha,
          planilla_file_url: planillaUploadData.path
        })
        .eq('id', currentDraftId);
      
      if (updateError) throw updateError;

      // Update local state to reflect saved file
      setExistingPlanillaPath(planillaUploadData.path);
      setPlanillaFile(null);

      toast({
        title: "Planilla Guardada",
        description: "La planilla de seguridad social ha sido guardada exitosamente"
      });
    } catch (error: any) {
      console.error('Error saving planilla:', error);
      toast({
        title: "Error",
        description: `Error al guardar planilla: ${error.message}`,
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

    if (!currentDraftId) {
      toast({
        title: "Error",
        description: "Debe guardar primero los detalles de facturación",
        variant: "destructive"
      });
      return;
    }

    try {
      const billingAccountId = currentDraftId;
      let savedActivity;

      if (editingActivityId) {
        // Update existing activity
        const { data, error: activityError } = await supabase
          .from('billing_activities')
          .update({
            activity_name: currentActivity.activityName,
            actions_developed: currentActivity.actions
          })
          .eq('id', editingActivityId)
          .select()
          .single();

        if (activityError) throw activityError;
        savedActivity = data;
      } else {
        // Insert new activity
        const { data, error: activityError } = await supabase
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
        savedActivity = data;
      }

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
      
      if (editingActivityId) {
        // Update activity in the list
        setActivities(prev => prev.map(a => 
          a.dbId === editingActivityId 
            ? { ...currentActivity, status: 'saved', dbId: editingActivityId }
            : a
        ));
        
        toast({
          title: "Actividad Actualizada",
          description: `Actividad "${currentActivity.activityName}" ha sido actualizada exitosamente`,
        });
      } else {
        // Add new activity to the list
        const newSavedActivity: Activity = {
          ...currentActivity,
          status: 'saved',
          dbId: savedActivity.id
        };
        
        setActivities(prev => [...prev, newSavedActivity]);
        
        toast({
          title: "Actividad Registrada",
          description: `Actividad "${newSavedActivity.activityName}" ha sido registrada exitosamente`,
        });
      }
      
      // Reset form
      setCurrentActivity({
        id: crypto.randomUUID(),
        activityName: '',
        actions: '',
        evidences: [],
        status: 'draft'
      });
      setShowCurrentActivity(false);
      setEditingActivityId(null);
      setExistingEvidences([]);
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
        description: "Complete todos los campos requeridos, registre al menos una actividad y complete la planilla",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let billingAccountId = currentDraftId;

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
    setCurrentActivity({
      id: crypto.randomUUID(),
      activityName: '',
      actions: '',
      evidences: [],
      status: 'draft'
    });
    setEditingActivityId(null);
    setExistingEvidences([]);
    setShowCurrentActivity(true);
  };

  const editActivity = async (activity: Activity) => {
    if (!activity.dbId) return;
    
    try {
      // Load existing evidences
      const { data: evidences, error } = await supabase
        .from('billing_activity_evidence')
        .select('*')
        .eq('billing_activity_id', activity.dbId);

      if (error) throw error;

      setCurrentActivity({
        ...activity,
        evidences: [] // New files to upload
      });
      setExistingEvidences(evidences || []);
      setEditingActivityId(activity.dbId);
      setShowCurrentActivity(true);
    } catch (error: any) {
      console.error('Error loading activity evidences:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las evidencias de la actividad",
        variant: "destructive"
      });
    }
  };

  const removeActivity = async (activity: Activity) => {
    if (!activity.dbId) {
      setActivities(prev => prev.filter(a => a.id !== activity.id));
      return;
    }

    try {
      // Delete evidences first
      const { error: evidenceError } = await supabase
        .from('billing_activity_evidence')
        .delete()
        .eq('billing_activity_id', activity.dbId);

      if (evidenceError) throw evidenceError;

      // Delete activity
      const { error: activityError } = await supabase
        .from('billing_activities')
        .delete()
        .eq('id', activity.dbId);

      if (activityError) throw activityError;

      setActivities(prev => prev.filter(a => a.dbId !== activity.dbId));
      
      toast({
        title: "Actividad Eliminada",
        description: "La actividad ha sido eliminada exitosamente"
      });
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: `No se pudo eliminar la actividad: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const removeExistingEvidence = async (evidenceId: string) => {
    try {
      const { error } = await supabase
        .from('billing_activity_evidence')
        .delete()
        .eq('id', evidenceId);

      if (error) throw error;

      setExistingEvidences(prev => prev.filter(e => e.id !== evidenceId));
      
      toast({
        title: "Evidencia Eliminada",
        description: "La evidencia ha sido eliminada exitosamente"
      });
    } catch (error: any) {
      console.error('Error deleting evidence:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la evidencia",
        variant: "destructive"
      });
    }
  };

  const previewExistingEvidence = async (evidence: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('billing-evidence')
        .createSignedUrl(evidence.file_path, 3600); // URL válida por 1 hora

      if (error) throw error;

      const mimeType = evidence.mime_type || 'application/octet-stream';
      setPreviewEvidence({
        url: data.signedUrl,
        type: mimeType,
        name: evidence.file_name
      });
    } catch (error: any) {
      console.error('Error previewing evidence:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la vista previa",
        variant: "destructive"
      });
    }
  };

  const previewNewEvidence = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewEvidence({
      url,
      type: file.type,
      name: file.name
    });
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
          <DialogTitle>Nuevo Informe de Actividades</DialogTitle>
          <DialogDescription>
            Complete la información para crear un nuevo informe de actividades
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Phase 1: Contract Selection & Billing Details */}
            <Card className={currentDraftId ? "border-green-600/50" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {currentDraftId && <CheckCircle className="h-5 w-5 text-green-600" />}
                      1. Detalles de Facturación
                    </CardTitle>
                    <CardDescription>
                      Seleccione el contrato y complete los datos básicos
                    </CardDescription>
                  </div>
                  {currentDraftId && (
                    <Badge variant="default" className="bg-green-600">Guardado</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Contrato *</Label>
                  <Popover open={contractSelectOpen} onOpenChange={setContractSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={contractSelectOpen}
                        className="w-full justify-between"
                      >
                        {selectedContract ? (
                          <span className="truncate">
                            {contracts.find((c) => c.id === selectedContract)?.contract_number_original || 
                             contracts.find((c) => c.id === selectedContract)?.contract_number}
                            {contracts.find((c) => c.id === selectedContract)?.client_name && 
                              ` • ${contracts.find((c) => c.id === selectedContract)?.client_name}`}
                          </span>
                        ) : (
                          "Seleccione un contrato activo"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar contrato..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron contratos.</CommandEmpty>
                          <CommandGroup>
                            {contracts.map((contract) => (
                              <CommandItem
                                key={contract.id}
                                value={`${contract.contract_number_original || contract.contract_number} ${contract.client_name || ''} ${contract.cdp || ''} ${contract.rp || ''}`}
                                onSelect={() => {
                                  setSelectedContract(contract.id);
                                  setContractSelectOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedContract === contract.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
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
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                
                {/* Save Details Button */}
                <div className="pt-4 border-t">
                  <Button
                    type="button"
                    onClick={saveBillingDetailsOnly}
                    disabled={!canSaveDetails || isSubmitting}
                    className="w-full"
                    variant={currentDraftId ? "outline" : "default"}
                  >
                    {isSubmitting ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-pulse" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {currentDraftId ? "Actualizar Detalles" : "Guardar Detalles"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Phase 2: Activities Section */}
            <Card className={activities.filter(a => a.status === 'saved').length > 0 ? "border-green-600/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {activities.filter(a => a.status === 'saved').length > 0 && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      2. Actividades Desarrolladas
                    </CardTitle>
                    <CardDescription>
                      Registre las actividades realizadas durante el período
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {activities.filter(a => a.status === 'saved').length > 0 && (
                      <Badge variant="default" className="bg-green-600">
                        {activities.filter(a => a.status === 'saved').length} registrada(s)
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addActivity}
                      disabled={!currentDraftId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Actividad
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!currentDraftId ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Primero debe guardar los detalles de facturación para agregar actividades
                  </p>
                ) : activities.filter(a => a.status === 'saved').length === 0 ? (
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
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => editActivity(activity)}
                              title="Editar actividad"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeActivity(activity)}
                              title="Eliminar actividad"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current Activity Form */}
                {showCurrentActivity && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted">
                    <h4 className="font-medium mb-3">
                      {editingActivityId ? 'Editar Actividad' : 'Nueva Actividad'}
                    </h4>
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
                        
                        {/* Existing evidences */}
                        {existingEvidences.length > 0 && (
                          <div className="mb-3 space-y-1">
                            <p className="text-xs text-muted-foreground">Evidencias actuales:</p>
                            {existingEvidences.map((evidence) => (
                              <div key={evidence.id} className="flex items-center justify-between text-sm bg-background p-2 rounded">
                                <span className="flex items-center gap-2 flex-1 truncate">
                                  <FileText className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{evidence.file_name}</span>
                                </span>
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => previewExistingEvidence(evidence)}
                                    title="Vista previa"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExistingEvidence(evidence.id)}
                                    title="Eliminar"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* New evidences to upload */}
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={addEvidenceToCurrentActivity}
                        />
                        {currentActivity.evidences.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">Nuevas evidencias:</p>
                            {currentActivity.evidences.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                                <span className="flex-1 truncate">{file.name}</span>
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => previewNewEvidence(file)}
                                    title="Vista previa"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEvidenceFromCurrentActivity(index)}
                                    title="Eliminar"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={saveActivityIndividually}
                          disabled={!canSaveActivity || isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Save className="h-4 w-4 mr-2 animate-pulse" />
                              {editingActivityId ? 'Actualizando...' : 'Registrando...'}
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {editingActivityId ? 'Actualizar Actividad' : 'Registrar Actividad'}
                            </>
                          )}
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

            {/* Phase 3: Planilla Section */}
            <Card className={canSavePlanilla ? "border-green-600/50" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {canSavePlanilla && <CheckCircle className="h-5 w-5 text-green-600" />}
                      3. Planilla de Seguridad Social
                    </CardTitle>
                    <CardDescription>
                      Complete la información de la planilla (se puede guardar independientemente)
                    </CardDescription>
                  </div>
                  {canSavePlanilla && (
                    <Badge variant="default" className="bg-green-600">Completa</Badge>
                  )}
                </div>
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
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Archivo de Planilla *</Label>
                    
                    {/* Input oculto para seleccionar archivo */}
                    <Input
                      ref={planillaFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'planilla')}
                      className="hidden"
                    />

                    {/* Si hay archivo existente guardado y NO hay nuevo archivo seleccionado */}
                    {existingPlanillaUrl && !planillaFile ? (
                      <div className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-5 w-5 text-primary shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {existingPlanillaName}
                            </span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(existingPlanillaUrl, '_blank')}
                              title="Ver archivo"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = existingPlanillaUrl;
                                link.download = existingPlanillaName || 'planilla.pdf';
                                link.click();
                              }}
                              title="Descargar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => planillaFileInputRef.current?.click()}
                              title="Cambiar archivo"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <span>✓</span> Archivo guardado correctamente
                        </p>
                      </div>
                    ) : planillaFile ? (
                      /* Nuevo archivo seleccionado (pendiente de guardar) */
                      <div className="border rounded-lg p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                            <span className="text-sm font-medium truncate">{planillaFile.name}</span>
                            <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">
                              Pendiente
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPlanillaFile(null);
                              if (planillaFileInputRef.current) {
                                planillaFileInputRef.current.value = '';
                              }
                            }}
                            title="Cancelar cambio"
                            className="text-amber-600 hover:text-amber-700 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          ℹ️ {existingPlanillaUrl ? 'Este archivo reemplazará al anterior cuando guardes' : 'El archivo se subirá cuando guardes la planilla'}
                        </p>
                      </div>
                    ) : (
                      /* No hay archivo */
                      <div 
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => planillaFileInputRef.current?.click()}
                      >
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Clic para seleccionar archivo PDF
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, JPG, PNG
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Save Planilla Button */}
                <div className="pt-4 border-t">
                  <Button
                    type="button"
                    onClick={savePlanillaOnly}
                    disabled={!canSavePlanilla || isSubmitting}
                    className="w-full"
                    variant={canSavePlanilla ? "outline" : "secondary"}
                  >
                    {isSubmitting ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-pulse" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Planilla
                      </>
                    )}
                  </Button>
                  {!currentDraftId && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Primero debe guardar los detalles de facturación
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progressive Status Indicator */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estado del Proceso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">1. Detalles de Facturación</span>
                  {currentDraftId ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Guardado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">2. Actividades ({activities.filter(a => a.status === 'saved').length})</span>
                  {activities.filter(a => a.status === 'saved').length > 0 ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {activities.filter(a => a.status === 'saved').length} registrada(s)
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">3. Planilla de Seguridad Social</span>
                  {canSavePlanilla ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completa
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
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
                Guardar y Cerrar
              </Button>
              
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmitForReview || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Send className="h-4 w-4 mr-2 animate-pulse" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para Revisión
                  </>
                )}
              </Button>
            </div>
            
            {!canSubmitForReview && (
              <p className="text-sm text-muted-foreground text-center">
                Complete todos los pasos para enviar la cuenta de cobro
              </p>
            )}
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
            />
          </div>
        </div>
      </DialogContent>

      {/* Evidence Preview Dialog */}
      <Dialog open={!!previewEvidence} onOpenChange={() => setPreviewEvidence(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewEvidence?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden" style={{ minHeight: '400px', maxHeight: '70vh' }}>
            {previewEvidence && (
              <>
                {previewEvidence.type.startsWith('image/') ? (
                  <img 
                    src={previewEvidence.url} 
                    alt={previewEvidence.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : previewEvidence.type === 'application/pdf' ? (
                  <iframe
                    src={previewEvidence.url}
                    className="w-full h-full"
                    style={{ minHeight: '500px' }}
                    title={previewEvidence.name}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Vista previa no disponible</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Este tipo de archivo no puede ser visualizado directamente
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Tipo: {previewEvidence.type}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = previewEvidence.url;
                        link.download = previewEvidence.name;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Archivo
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
