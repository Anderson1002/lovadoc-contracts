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
import { Upload, FileText, X, CheckCircle, CalendarIcon, Plus, Save, Send, Loader2, Trash2, Check, ChevronsUpDown, Eye, Download, RefreshCw } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatCurrency, formatCurrencyInput, parseLocalDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BillingDocumentPreview } from "@/components/billing/BillingDocumentPreview";
import { BillingCompletionProgress } from "@/components/billing/BillingCompletionProgress";
import { ScrollArea } from "@/components/ui/scroll-area";
import SignatureCanvas from "react-signature-canvas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificationForm } from "@/components/billing/CertificationForm";
import { CertificationPreview } from "@/components/billing/CertificationPreview";
import { InvoiceForm } from "@/components/billing/InvoiceForm";
import { InvoicePreview } from "@/components/billing/InvoicePreview";
import { BillingProgressTracker } from "@/components/billing/BillingProgressTracker";

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
  const [contractSelectOpen, setContractSelectOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [uploads, setUploads] = useState<Record<string, Omit<FileUpload, 'type'>>>({
    social_security: { file: null, uploaded: false, uploading: false }
  });

  // Campos adicionales para planilla y firma
  const [planillaNumero, setPlanillaNumero] = useState<string>("");
  const [planillaValor, setPlanillaValor] = useState<string>("");
  const [planillaFecha, setPlanillaFecha] = useState<Date>();
  const [reviewComments, setReviewComments] = useState<any[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [profileSignatureUrl, setProfileSignatureUrl] = useState<string | null>(null);
  
  // Estados para gestión mejorada de archivo PDF de planilla
  const [existingPlanillaPath, setExistingPlanillaPath] = useState<string | null>(null);
  const [existingPlanillaUrl, setExistingPlanillaUrl] = useState<string | null>(null);
  const [existingPlanillaName, setExistingPlanillaName] = useState<string | null>(null);
  const [pendingPlanillaFile, setPendingPlanillaFile] = useState<File | null>(null);
  const planillaFileInputRef = useRef<HTMLInputElement>(null);

  // Desglose de Aportes de Seguridad Social
  const [saludNumero, setSaludNumero] = useState<string>("");
  const [saludValor, setSaludValor] = useState<string>("");
  const [saludFecha, setSaludFecha] = useState<string>("");
  const [pensionNumero, setPensionNumero] = useState<string>("");
  const [pensionValor, setPensionValor] = useState<string>("");
  const [pensionFecha, setPensionFecha] = useState<string>("");
  const [arlNumero, setArlNumero] = useState<string>("");
  const [arlValor, setArlValor] = useState<string>("");
  const [arlFecha, setArlFecha] = useState<string>("");

  // Tab activa y estados para Certificación y Cuenta de Cobro
  const [activeTab, setActiveTab] = useState<string>("informe");
  
  // Certificación fields
  const [novedades, setNovedades] = useState<string>("");
  // Nuevos campos para formato oficial de certificación
  const [valorEjecutadoAntes, setValorEjecutadoAntes] = useState<string>("0");
  const [riskMatrixCompliance, setRiskMatrixCompliance] = useState<boolean>(false);
  const [socialSecurityVerified, setSocialSecurityVerified] = useState<boolean>(true);
  const [anexosLista, setAnexosLista] = useState<string>("");
  const [certificationMonth, setCertificationMonth] = useState<string>("");
  const [reportDeliveryDate, setReportDeliveryDate] = useState<string>("");
  
  // Cuenta de Cobro / Invoice fields
  const [invoiceCity, setInvoiceCity] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [amountInWords, setAmountInWords] = useState<string>("");
  const [declarationSingleEmployer, setDeclarationSingleEmployer] = useState<boolean>(true);
  const [declaration80PercentIncome, setDeclaration80PercentIncome] = useState<boolean>(true);
  const [benefitPrepaidHealth, setBenefitPrepaidHealth] = useState<boolean>(false);
  const [benefitVoluntaryPension, setBenefitVoluntaryPension] = useState<boolean>(false);
  const [benefitHousingInterest, setBenefitHousingInterest] = useState<boolean>(false);
  const [benefitHealthContributions, setBenefitHealthContributions] = useState<boolean>(true);
  const [benefitEconomicDependents, setBenefitEconomicDependents] = useState<boolean>(false);

  const canEdit = billingAccount?.status === 'borrador' || billingAccount?.status === 'rechazada';
  
  // Calcular completitud de cada sección
  const informeComplete = !!(selectedContract && amount && startDate && endDate && 
                            activities.filter(a => a.status === 'saved').length > 0 && 
                            (uploads.social_security.uploaded || existingPlanillaPath || pendingPlanillaFile));
  const certificacionComplete = !!(certificationMonth && reportDeliveryDate);
  const cuentaCobroComplete = !!(invoiceCity && invoiceDate && invoiceNumber && amountInWords);
  const hasProfileSignature = !!profileSignatureUrl;
  const allFormsComplete = informeComplete && certificacionComplete && cuentaCobroComplete;
  const canSubmitForReview = allFormsComplete && hasProfileSignature &&
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
        if (!creatorError) {
          setCreatorProfile(creator);
          // Load signature from creator's profile
          if (creator.signature_url) {
            const { data: signedUrl } = await supabase.storage
              .from('billing-signatures')
              .createSignedUrl(creator.signature_url, 3600);
            if (signedUrl?.signedUrl) {
              setProfileSignatureUrl(signedUrl.signedUrl);
            }
          }
        }
      } catch (e) {
        console.warn('No se pudo cargar el perfil del creador de la cuenta de cobro', e);
      }

      // Set form data
      setSelectedContract(billing.contract_id);
      setAmount(billing.amount?.toString() || '');
      setStartDate(billing.billing_start_date ? parseLocalDate(billing.billing_start_date) : undefined);
      setEndDate(billing.billing_end_date ? parseLocalDate(billing.billing_end_date) : undefined);
      
      // Load planilla data
      setPlanillaNumero((billing as any).planilla_numero || "");
      setPlanillaValor((billing as any).planilla_valor?.toString() || "");
      setPlanillaFecha((billing as any).planilla_fecha ? parseLocalDate((billing as any).planilla_fecha) : undefined);

      // Load desglose de aportes
      setSaludNumero((billing as any).salud_planilla_numero || "");
      setSaludValor((billing as any).salud_planilla_valor?.toString() || "");
      setSaludFecha((billing as any).salud_planilla_fecha || "");
      setPensionNumero((billing as any).pension_planilla_numero || "");
      setPensionValor((billing as any).pension_planilla_valor?.toString() || "");
      setPensionFecha((billing as any).pension_planilla_fecha || "");
      setArlNumero((billing as any).arl_planilla_numero || "");
      setArlValor((billing as any).arl_planilla_valor?.toString() || "");
      setArlFecha((billing as any).arl_planilla_fecha || "");
      
      // Load Certificación fields
      setNovedades((billing as any).novedades || "");
      setCertificationMonth((billing as any).certification_month || "");
      setReportDeliveryDate((billing as any).report_delivery_date || "");
      // Nuevos campos formato oficial
      setValorEjecutadoAntes((billing as any).valor_ejecutado_antes?.toString() || "0");
      setRiskMatrixCompliance((billing as any).risk_matrix_compliance ?? false);
      setSocialSecurityVerified((billing as any).social_security_verified ?? true);
      setAnexosLista((billing as any).anexos_lista || "");
      
      // Load Invoice fields
      setInvoiceCity((billing as any).invoice_city || "");
      setInvoiceDate((billing as any).invoice_date || "");
      setInvoiceNumber((billing as any).invoice_number || "");
      setAmountInWords((billing as any).amount_in_words || "");
      setDeclarationSingleEmployer((billing as any).declaration_single_employer ?? true);
      setDeclaration80PercentIncome((billing as any).declaration_80_percent_income ?? true);
      setBenefitPrepaidHealth((billing as any).benefit_prepaid_health ?? false);
      setBenefitVoluntaryPension((billing as any).benefit_voluntary_pension ?? false);
      setBenefitHousingInterest((billing as any).benefit_housing_interest ?? false);
      setBenefitHealthContributions((billing as any).benefit_health_contributions ?? true);
      setBenefitEconomicDependents((billing as any).benefit_economic_dependents ?? false);

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

      // Update uploads state with existing documents and load planilla URL
      const updatedUploads = { ...uploads };
      for (const doc of documents || []) {
        if (doc.document_type === 'social_security') {
          updatedUploads.social_security = {
            file: null,
            uploaded: true,
            uploading: false
          };
          
          // Cargar URL del archivo de planilla existente
          setExistingPlanillaPath(doc.file_path);
          setExistingPlanillaName(doc.file_name || doc.file_path.split('/').pop() || 'planilla.pdf');
          
          try {
            const { data: urlData, error: urlError } = await supabase.storage
              .from('billing-documents')
              .createSignedUrl(doc.file_path, 3600); // 1 hora de validez
            
            if (!urlError && urlData?.signedUrl) {
              setExistingPlanillaUrl(urlData.signedUrl);
            }
          } catch (e) {
            console.warn('No se pudo obtener URL del archivo de planilla:', e);
          }
        }
      }
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
          // Desglose de aportes
          salud_planilla_numero: saludNumero || null,
          salud_planilla_valor: saludValor ? parseFloat(saludValor) : null,
          salud_planilla_fecha: saludFecha || null,
          pension_planilla_numero: pensionNumero || null,
          pension_planilla_valor: pensionValor ? parseFloat(pensionValor) : null,
          pension_planilla_fecha: pensionFecha || null,
          arl_planilla_numero: arlNumero || null,
          arl_planilla_valor: arlValor ? parseFloat(arlValor) : null,
          arl_planilla_fecha: arlFecha || null,
          // Certificación fields
          novedades: novedades || null,
          certification_date: new Date().toISOString().split('T')[0],
          certification_month: certificationMonth || null,
          report_delivery_date: reportDeliveryDate || null,
          certificacion_complete: certificacionComplete,
          valor_ejecutado_antes: valorEjecutadoAntes ? parseFloat(valorEjecutadoAntes) : 0,
          risk_matrix_compliance: riskMatrixCompliance,
          social_security_verified: socialSecurityVerified,
          anexos_lista: anexosLista || null,
          // Invoice fields
          invoice_city: invoiceCity || null,
          invoice_date: invoiceDate || null,
          invoice_number: invoiceNumber || null,
          amount_in_words: amountInWords || null,
          declaration_single_employer: declarationSingleEmployer,
          declaration_80_percent_income: declaration80PercentIncome,
          benefit_prepaid_health: benefitPrepaidHealth,
          benefit_voluntary_pension: benefitVoluntaryPension,
          benefit_housing_interest: benefitHousingInterest,
          benefit_health_contributions: benefitHealthContributions,
          benefit_economic_dependents: benefitEconomicDependents,
          cuenta_cobro_complete: cuentaCobroComplete,
          informe_complete: informeComplete,
          status: 'borrador'
        })
        .eq('id', billingAccount.id);

      if (error) throw error;

      // Upload social security document if changed (using pendingPlanillaFile)
      if (pendingPlanillaFile) {
        const fileExt = pendingPlanillaFile.name.split('.').pop();
        const fileName = `${userProfile.user_id}/${billingAccount.id}/social_security_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('billing-documents')
          .upload(fileName, pendingPlanillaFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Update billing account with new planilla path
        await supabase
          .from('billing_accounts')
          .update({ planilla_file_url: uploadData.path })
          .eq('id', billingAccount.id);

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
            file_name: pendingPlanillaFile.name,
            file_path: uploadData.path,
            file_size: pendingPlanillaFile.size,
            mime_type: pendingPlanillaFile.type
          });
        
        // Actualizar estados locales
        setExistingPlanillaPath(uploadData.path);
        setExistingPlanillaName(pendingPlanillaFile.name);
        setPendingPlanillaFile(null);
        
        // Obtener nueva URL firmada
        const { data: urlData } = await supabase.storage
          .from('billing-documents')
          .createSignedUrl(uploadData.path, 3600);
        if (urlData?.signedUrl) {
          setExistingPlanillaUrl(urlData.signedUrl);
        }
        
        setUploads(prev => ({
          ...prev,
          social_security: { file: null, uploaded: true, uploading: false }
        }));
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
          // Certificación fields
          novedades: novedades || null,
          certification_date: new Date().toISOString().split('T')[0],
          certification_month: certificationMonth || null,
          report_delivery_date: reportDeliveryDate || null,
          certificacion_complete: true,
          valor_ejecutado_antes: valorEjecutadoAntes ? parseFloat(valorEjecutadoAntes) : 0,
          risk_matrix_compliance: riskMatrixCompliance,
          social_security_verified: socialSecurityVerified,
          anexos_lista: anexosLista || null,
          // Invoice fields
          invoice_city: invoiceCity || null,
          invoice_date: invoiceDate || null,
          invoice_number: invoiceNumber || null,
          amount_in_words: amountInWords || null,
          declaration_single_employer: declarationSingleEmployer,
          declaration_80_percent_income: declaration80PercentIncome,
          benefit_prepaid_health: benefitPrepaidHealth,
          benefit_voluntary_pension: benefitVoluntaryPension,
          benefit_housing_interest: benefitHousingInterest,
          benefit_health_contributions: benefitHealthContributions,
          benefit_economic_dependents: benefitEconomicDependents,
          cuenta_cobro_complete: true,
          informe_complete: true,
          status: 'pendiente_revision'
        })
        .eq('id', billingAccount.id);

      if (error) throw error;

      // Upload social security document if changed (using pendingPlanillaFile)
      if (pendingPlanillaFile) {
        const fileExt = pendingPlanillaFile.name.split('.').pop();
        const fileName = `${userProfile.user_id}/${billingAccount.id}/social_security_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('billing-documents')
          .upload(fileName, pendingPlanillaFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Update billing account with new planilla path
        await supabase
          .from('billing_accounts')
          .update({ planilla_file_url: uploadData.path })
          .eq('id', billingAccount.id);

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
            file_name: pendingPlanillaFile.name,
            file_path: uploadData.path,
            file_size: pendingPlanillaFile.size,
            mime_type: pendingPlanillaFile.type
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
            <DialogTitle>Cargando informe de actividades...</DialogTitle>
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {canEdit ? 'Editar Informe de Actividades' : 'Ver Informe de Actividades'} - {billingAccount?.account_number}
          </DialogTitle>
          <DialogDescription>
            {canEdit 
              ? 'Modifique la información del informe de actividades. Complete todos los campos requeridos.'
              : 'Información detallada del informe de actividades.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form with Tabs */}
          <div className="space-y-6">
            {/* Progress Tracker */}
            <BillingProgressTracker
              informeComplete={informeComplete}
              certificacionComplete={certificacionComplete}
              cuentaCobroComplete={cuentaCobroComplete}
              currentTab={activeTab}
            />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="informe" className="text-xs sm:text-sm">
                  {informeComplete && <CheckCircle className="h-3 w-3 mr-1 text-green-600" />}
                  Informe
                </TabsTrigger>
                <TabsTrigger value="certificacion" className="text-xs sm:text-sm">
                  {certificacionComplete && <CheckCircle className="h-3 w-3 mr-1 text-green-600" />}
                  Certificación
                </TabsTrigger>
                <TabsTrigger value="cuenta-cobro" className="text-xs sm:text-sm">
                  {cuentaCobroComplete && <CheckCircle className="h-3 w-3 mr-1 text-green-600" />}
                  Cuenta
                </TabsTrigger>
              </TabsList>
              
              {/* Tab: Informe de Actividades */}
              <TabsContent value="informe" className="space-y-6 mt-4">
          {/* Progress Indicator (legacy - keeping for backward compat) */}
          <BillingCompletionProgress
            contractId={selectedContract || null}
            amount={amount || null}
            billingStartDate={startDate || null}
            billingEndDate={endDate || null}
            activitiesCount={activities.filter(a => a.status === 'saved').length}
            planillaNumero={planillaNumero || null}
            planillaValor={planillaValor || null}
            planillaFecha={planillaFecha ? format(planillaFecha, 'yyyy-MM-dd') : null}
            planillaFile={pendingPlanillaFile || existingPlanillaPath}
            hasSignature={!!profileSignatureUrl}
          />

          {/* Contract Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Contrato</CardTitle>
              <CardDescription>Seleccione el contrato para este informe de actividades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract">Contrato *</Label>
                <Popover open={contractSelectOpen} onOpenChange={setContractSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={contractSelectOpen}
                      className="w-full justify-between"
                      disabled={!canEdit || contractsLoading}
                    >
                      {selectedContract ? (
                        <span className="truncate">
                          {contracts.find((c) => c.id === selectedContract)?.contract_number_original || 
                           contracts.find((c) => c.id === selectedContract)?.contract_number}
                          {contracts.find((c) => c.id === selectedContract)?.client_name && 
                            ` • ${contracts.find((c) => c.id === selectedContract)?.client_name}`}
                        </span>
                      ) : (
                        contractsLoading ? "Cargando contratos..." : "Seleccione un contrato"
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
                
                {/* Input oculto para selección de archivo */}
                <input
                  ref={planillaFileInputRef}
                  id="social_security"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    if (file.type !== 'application/pdf') {
                      toast({
                        title: "Error",
                        description: "Solo se permiten archivos PDF",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: "El archivo no puede ser mayor a 10MB",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    setPendingPlanillaFile(file);
                  }}
                  disabled={!canEdit}
                  className="hidden"
                />
                
                {/* Caso 1: Hay un archivo existente guardado (sin cambio pendiente) */}
                {existingPlanillaPath && !pendingPlanillaFile && (
                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-300">{existingPlanillaName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {existingPlanillaUrl && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(existingPlanillaUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
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
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                          </>
                        )}
                        {canEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => planillaFileInputRef.current?.click()}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Cambiar
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Archivo guardado correctamente</span>
                    </div>
                  </div>
                )}
                
                {/* Caso 2: Hay un archivo pendiente de guardar */}
                {pendingPlanillaFile && (
                  <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-700 dark:text-amber-300">{pendingPlanillaFile.name}</span>
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Pendiente de guardar
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPendingPlanillaFile(null);
                          if (planillaFileInputRef.current) {
                            planillaFileInputRef.current.value = '';
                          }
                        }}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-xs text-amber-600 mt-2">
                      {existingPlanillaPath 
                        ? 'Este archivo reemplazará al anterior cuando guardes los cambios'
                        : 'Este archivo se subirá cuando guardes los cambios'}
                    </p>
                  </div>
                )}
                
                {/* Caso 3: No hay archivo existente ni pendiente */}
                {!existingPlanillaPath && !pendingPlanillaFile && (
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      canEdit 
                        ? "hover:border-primary hover:bg-primary/5 border-muted-foreground/25" 
                        : "border-muted cursor-not-allowed opacity-50"
                    )}
                    onClick={() => canEdit && planillaFileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Clic para seleccionar archivo PDF</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, máximo 10MB</p>
                  </div>
                )}
                
                {!existingPlanillaPath && !pendingPlanillaFile && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Sin archivo de planilla
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Desglose de Aportes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Desglose de Aportes</CardTitle>
              <CardDescription>Detalle de los aportes a Salud, Pensión y ARL (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PAGO APORTES SALUD */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-sm text-primary">PAGO APORTES SALUD</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Número de Planilla</Label>
                    <Input
                      value={saludNumero}
                      onChange={(e) => setSaludNumero(e.target.value)}
                      placeholder="Ej: 90304264"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor</Label>
                    <Input
                      type="text"
                      value={saludValor ? formatCurrency(parseFloat(saludValor)) : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '');
                        setSaludValor(numericValue);
                      }}
                      placeholder="$ 0"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de Pago</Label>
                    <Input
                      type="date"
                      value={saludFecha}
                      onChange={(e) => setSaludFecha(e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              {/* PAGO APORTES PENSIÓN */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-sm text-primary">PAGO APORTES PENSIÓN</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Número de Planilla</Label>
                    <Input
                      value={pensionNumero}
                      onChange={(e) => setPensionNumero(e.target.value)}
                      placeholder="Ej: 90304264"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor</Label>
                    <Input
                      type="text"
                      value={pensionValor ? formatCurrency(parseFloat(pensionValor)) : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '');
                        setPensionValor(numericValue);
                      }}
                      placeholder="$ 0"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de Pago</Label>
                    <Input
                      type="date"
                      value={pensionFecha}
                      onChange={(e) => setPensionFecha(e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              {/* PAGO APORTES ARL */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-sm text-primary">PAGO APORTES ARL</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Número de Planilla</Label>
                    <Input
                      value={arlNumero}
                      onChange={(e) => setArlNumero(e.target.value)}
                      placeholder="Ej: 90304264"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor</Label>
                    <Input
                      type="text"
                      value={arlValor ? formatCurrency(parseFloat(arlValor)) : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '');
                        setArlValor(numericValue);
                      }}
                      placeholder="$ 0"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de Pago</Label>
                    <Input
                      type="date"
                      value={arlFecha}
                      onChange={(e) => setArlFecha(e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
              </TabsContent>
              
              {/* Tab: Certificación */}
              <TabsContent value="certificacion" className="space-y-6 mt-4">
                <CertificationForm
                  contractDetails={selectedContractData}
                  userProfile={creatorProfile || userProfile}
                  startDate={startDate}
                  endDate={endDate}
                  amount={amount}
                  novedades={novedades}
                  onNovedadesChange={setNovedades}
                  isComplete={certificacionComplete}
                  valorEjecutadoAntes={valorEjecutadoAntes}
                  onValorEjecutadoAntesChange={setValorEjecutadoAntes}
                  riskMatrixCompliance={riskMatrixCompliance}
                  onRiskMatrixComplianceChange={setRiskMatrixCompliance}
                  socialSecurityVerified={socialSecurityVerified}
                  onSocialSecurityVerifiedChange={setSocialSecurityVerified}
                  anexosLista={anexosLista}
                  onAnexosListaChange={setAnexosLista}
                  activities={activities}
                  certificationMonth={certificationMonth}
                  onCertificationMonthChange={setCertificationMonth}
                  reportDeliveryDate={reportDeliveryDate}
                  onReportDeliveryDateChange={setReportDeliveryDate}
                />
              </TabsContent>
              
              {/* Tab: Cuenta de Cobro */}
              <TabsContent value="cuenta-cobro" className="space-y-6 mt-4">
                <InvoiceForm
                  contractDetails={selectedContractData}
                  userProfile={creatorProfile || userProfile}
                  invoiceNumber={invoiceNumber}
                  onInvoiceNumberChange={setInvoiceNumber}
                  invoiceCity={invoiceCity}
                  onInvoiceCityChange={setInvoiceCity}
                  invoiceDate={invoiceDate}
                  onInvoiceDateChange={setInvoiceDate}
                  amount={amount}
                  amountInWords={amountInWords}
                  onAmountInWordsChange={setAmountInWords}
                  declarationSingleEmployer={declarationSingleEmployer}
                  onDeclarationSingleEmployerChange={setDeclarationSingleEmployer}
                  declaration80PercentIncome={declaration80PercentIncome}
                  onDeclaration80PercentIncomeChange={setDeclaration80PercentIncome}
                  benefitPrepaidHealth={benefitPrepaidHealth}
                  onBenefitPrepaidHealthChange={setBenefitPrepaidHealth}
                  benefitVoluntaryPension={benefitVoluntaryPension}
                  onBenefitVoluntaryPensionChange={setBenefitVoluntaryPension}
                  benefitHousingInterest={benefitHousingInterest}
                  onBenefitHousingInterestChange={setBenefitHousingInterest}
                  benefitHealthContributions={benefitHealthContributions}
                  onBenefitHealthContributionsChange={setBenefitHealthContributions}
                  benefitEconomicDependents={benefitEconomicDependents}
                  onBenefitEconomicDependentsChange={setBenefitEconomicDependents}
                  isComplete={cuentaCobroComplete}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Document Preview */}
          <div className="lg:sticky lg:top-0 lg:self-start">
            {billingAccount && (
              <ScrollArea className="h-[calc(90vh-120px)] pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vista Previa del Documento</CardTitle>
                    <CardDescription>
                      {activeTab === 'informe' && 'Informe de Actividades'}
                      {activeTab === 'certificacion' && 'Certificación del Supervisor'}
                      {activeTab === 'cuenta-cobro' && 'Cuenta de Cobro'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'informe' && (
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
                        signatureUrl={profileSignatureUrl}
                        reviewComments={reviewComments}
                        saludNumero={saludNumero}
                        saludValor={saludValor}
                        saludFecha={saludFecha}
                        pensionNumero={pensionNumero}
                        pensionValor={pensionValor}
                        pensionFecha={pensionFecha}
                        arlNumero={arlNumero}
                        arlValor={arlValor}
                        arlFecha={arlFecha}
                      />
                    )}
                    {activeTab === 'certificacion' && (
                      <CertificationPreview
                        contractDetails={selectedContractData}
                        userProfile={creatorProfile || userProfile}
                        startDate={startDate}
                        endDate={endDate}
                        amount={amount}
                        novedades={novedades}
                        certificationDate={new Date().toISOString().split('T')[0]}
                        supervisorName={selectedContractData?.supervisor_asignado}
                        valorEjecutadoAntes={valorEjecutadoAntes}
                        riskMatrixCompliance={riskMatrixCompliance}
                        socialSecurityVerified={socialSecurityVerified}
                        anexosLista={anexosLista}
                        activities={activities}
                        certificationMonth={certificationMonth}
                        reportDeliveryDate={reportDeliveryDate}
                      />
                    )}
                    {activeTab === 'cuenta-cobro' && (
                      <InvoicePreview
                        contractDetails={selectedContractData}
                        userProfile={creatorProfile || userProfile}
                        invoiceNumber={invoiceNumber}
                        invoiceCity={invoiceCity}
                        invoiceDate={invoiceDate}
                        amount={amount}
                        amountInWords={amountInWords}
                        declarationSingleEmployer={declarationSingleEmployer}
                        declaration80PercentIncome={declaration80PercentIncome}
                        benefitPrepaidHealth={benefitPrepaidHealth}
                        benefitVoluntaryPension={benefitVoluntaryPension}
                        benefitHousingInterest={benefitHousingInterest}
                        benefitHealthContributions={benefitHealthContributions}
                        benefitEconomicDependents={benefitEconomicDependents}
                        signatureUrl={profileSignatureUrl}
                      />
                    )}
                  </CardContent>
                </Card>
              </ScrollArea>
            )}
          </div>
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