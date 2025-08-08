import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, CheckCircle, CalendarIcon, Plus, Save, Send, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BillingDocumentPreview } from "@/components/billing/BillingDocumentPreview";

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

export default function EditBillingAccount() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
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
  const [billingStatus, setBillingStatus] = useState<'draft' | 'pending_review' | 'approved' | 'rejected' | 'paid'>('draft');
  
  const [uploads, setUploads] = useState<Record<string, Omit<FileUpload, 'type'>>>({
    social_security: { file: null, uploaded: false, uploading: false }
  });

  const canEdit = billingStatus === 'draft';
  const canSubmitForReview = selectedContract && amount && startDate && endDate && 
                            activities.filter(a => a.status === 'saved').length > 0 && 
                            uploads.social_security.uploaded && canEdit;

  useEffect(() => {
    const initializePage = async () => {
      await loadUserProfile();
    };
    initializePage();
  }, []);

  useEffect(() => {
    if (userProfile && id) {
      loadBillingAccount();
      loadContracts();
    }
  }, [userProfile, id]);

  const loadUserProfile = async () => {
    try {
      console.log('Loading user profile...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw userError;
      }
      
      if (!user) {
        console.error('No authenticated user found');
        toast({
          title: "Error de Autenticación",
          description: "No hay sesión activa. Por favor, inicie sesión.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      console.log('User found, loading profile for:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          roles(name, display_name)
        `)
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.error('No profile found for user');
        toast({
          title: "Error",
          description: "No se encontró el perfil de usuario. Contacte al administrador.",
          variant: "destructive"
        });
        navigate('/billing');
        return;
      }

      console.log('Profile loaded successfully:', profile);
      setUserProfile(profile);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: `Error al cargar el perfil: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
      navigate('/billing');
    }
  };

  const loadBillingAccount = async () => {
    try {
      setLoading(true);
      console.log('Loading billing account with ID:', id);
      
      if (!id) {
        throw new Error('ID de cuenta de cobro no proporcionado');
      }

      const { data: billingAccount, error } = await supabase
        .from('billing_accounts')
        .select(`
          *,
          contracts(
            id,
            contract_number,
            client_name,
            total_amount,
            status,
            description
          ),
          billing_activities(
            id,
            activity_name,
            actions_developed,
            activity_order,
            status
          ),
          billing_documents(
            id,
            document_type,
            file_name,
            file_path,
            file_size,
            mime_type
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading billing account:', error);
        throw error;
      }

      if (!billingAccount) {
        throw new Error('Cuenta de cobro no encontrada');
      }

      console.log('Billing account loaded:', billingAccount);

      // Validate user permissions
      const userCanEdit = billingAccount.created_by === userProfile?.id || 
                         ['super_admin', 'admin', 'supervisor'].includes(userProfile?.roles?.name);
      
      if (!userCanEdit) {
        toast({
          title: "Sin Permisos",
          description: "No tiene permisos para ver esta cuenta de cobro",
          variant: "destructive"
        });
        navigate('/billing');
        return;
      }

      // Populate form with existing data
      setSelectedContract(billingAccount.contract_id);
      setAmount(billingAccount.amount.toString());
      
      // Handle dates safely
      if (billingAccount.billing_start_date) {
        setStartDate(new Date(billingAccount.billing_start_date));
      } else if (billingAccount.billing_month) {
        setStartDate(new Date(billingAccount.billing_month));
      }
      
      if (billingAccount.billing_end_date) {
        setEndDate(new Date(billingAccount.billing_end_date));
      } else if (billingAccount.billing_month) {
        setEndDate(new Date(billingAccount.billing_month));
      }
      
      setBillingStatus(billingAccount.status as 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paid');

      // Load activities safely
      let loadedActivities: Activity[] = [];
      if (billingAccount.billing_activities && Array.isArray(billingAccount.billing_activities)) {
        loadedActivities = billingAccount.billing_activities
          .sort((a, b) => a.activity_order - b.activity_order)
          .map((activity: any) => ({
            id: activity.id,
            activityName: activity.activity_name || '',
            actions: activity.actions_developed || '',
            evidences: [], // We'll load evidence files separately if needed
            status: 'saved' as const,
            dbId: activity.id
          }));
      }
      setActivities(loadedActivities);

      // Load documents safely
      let socialSecurityDoc = null;
      if (billingAccount.billing_documents && Array.isArray(billingAccount.billing_documents)) {
        socialSecurityDoc = billingAccount.billing_documents.find(
          (doc: any) => doc.document_type === 'social_security'
        );
      }
      
      if (socialSecurityDoc) {
        setUploads(prev => ({
          ...prev,
          social_security: { file: null, uploaded: true, uploading: false }
        }));
      }

      console.log('Form data populated successfully');

    } catch (error: any) {
      console.error('Error loading billing account:', error);
      toast({
        title: "Error",
        description: `No se pudo cargar la cuenta de cobro: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
      navigate('/billing');
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      setContractsLoading(true);
      console.log('Loading contracts for user profile:', userProfile);
      
      let query = supabase
        .from('contracts')
        .select('*')
        .in('status', ['active']);

      // Apply role-based filtering
      const userRole = userProfile?.roles?.name;
      if (!['super_admin', 'admin', 'supervisor'].includes(userRole)) {
        query = query.eq('created_by', userProfile?.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading contracts:', error);
        throw error;
      }

      console.log('Contracts loaded:', data?.length || 0);
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los contratos: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setContractsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);
    
    // Validate file type for social security
    if (type === 'social_security' && !file.type.includes('pdf')) {
      toast({
        title: "Error",
        description: "El certificado de seguridad social debe ser un archivo PDF",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 10MB permitido.",
        variant: "destructive"
      });
      return;
    }

    setUploads(prev => ({
      ...prev,
      [type]: { ...prev[type], file, uploaded: true }
    }));

    toast({
      title: "Archivo Cargado",
      description: `${file.name} ha sido seleccionado correctamente`
    });
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
          billing_account_id: id,
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
          const fileName = `${userProfile.user_id}/${id}/evidence_${savedActivity.id}_${Date.now()}.${fileExt}`;
          
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

  const saveAsDraft = async () => {
    if (!selectedContract || !amount || !startDate || !endDate) {
      toast({
        title: "Campos Requeridos",
        description: "Complete los campos básicos: contrato, valor y período de facturación",
        variant: "destructive"
      });
      return;
    }

    if (!canEdit) {
      toast({
        title: "Sin Permisos",
        description: "No puede editar esta cuenta en su estado actual",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Saving as draft...');
      const { error: updateError } = await supabase
        .from('billing_accounts')
        .update({
          contract_id: selectedContract,
          amount: parseFloat(amount),
          billing_start_date: format(startDate, 'yyyy-MM-dd'),
          billing_end_date: format(endDate, 'yyyy-MM-dd'),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating billing account:', updateError);
        throw updateError;
      }

      console.log('Draft saved successfully');
      toast({
        title: "Cambios Guardados",
        description: "Los cambios han sido guardados como borrador",
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: `No se pudieron guardar los cambios: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    // Comprehensive validation
    if (!selectedContract || !amount || !startDate || !endDate) {
      toast({
        title: "Campos Requeridos",
        description: "Complete todos los campos básicos: contrato, valor y período de facturación",
        variant: "destructive"
      });
      return;
    }

    if (activities.filter(a => a.status === 'saved').length === 0) {
      toast({
        title: "Actividades Requeridas",
        description: "Debe registrar al menos una actividad antes de enviar a revisión",
        variant: "destructive"
      });
      return;
    }

    if (!uploads.social_security.uploaded && !uploads.social_security.file) {
      toast({
        title: "Documento Requerido",
        description: "Debe cargar el certificado de seguridad social",
        variant: "destructive"
      });
      return;
    }

    if (!canEdit) {
      toast({
        title: "Sin Permisos",
        description: "No puede enviar esta cuenta a revisión en su estado actual",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Submitting billing account for review...');

      // Update billing account status and details
      console.log('Updating billing account...');
      const { error: updateError } = await supabase
        .from('billing_accounts')
        .update({
          contract_id: selectedContract,
          amount: parseFloat(amount),
          billing_start_date: format(startDate!, 'yyyy-MM-dd'),
          billing_end_date: format(endDate!, 'yyyy-MM-dd'),
          status: 'pending_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating billing account:', updateError);
        throw updateError;
      }

      console.log('Billing account updated successfully');

      // Upload social security document if new file
      if (uploads.social_security.file) {
        console.log('Uploading new social security document...');
        const fileExt = uploads.social_security.file.name.split('.').pop();
        const fileName = `${userProfile.user_id}/${id}/social_security.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('billing-documents')
          .upload(fileName, uploads.social_security.file, { upsert: true });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        console.log('File uploaded successfully:', uploadData.path);

        // Update or insert document record
        const { error: docError } = await supabase
          .from('billing_documents')
          .upsert({
            billing_account_id: id,
            document_type: 'social_security',
            uploaded_by: userProfile.id,
            file_name: uploads.social_security.file.name,
            file_path: uploadData.path,
            file_size: uploads.social_security.file.size,
            mime_type: uploads.social_security.file.type
          });

        if (docError) {
          console.error('Error saving document record:', docError);
          throw docError;
        }

        console.log('Document record saved successfully');
      }

      console.log('Billing account submission completed successfully');
      toast({
        title: "Cuenta Enviada a Revisión",
        description: "La cuenta de cobro ha sido enviada para revisión exitosamente"
      });

      navigate('/billing');
    } catch (error: any) {
      console.error('Error submitting billing account:', error);
      toast({
        title: "Error",
        description: `No se pudo enviar la cuenta: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedContractData = contracts.find(c => c.id === selectedContract);
  
  // Format amount with proper currency display
  const formatAmountDisplay = (value: string) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return `$ ${numValue.toLocaleString('es-CO')}`;
  };

  const formattedAmount = formatAmountDisplay(amount);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="text-center text-muted-foreground">
            Cargando cuenta de cobro...
          </div>
        </div>
      </div>
    );
  }

  // Show error state if critical data is missing
  if (!userProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">Error: No se pudo cargar la información del usuario</p>
              <Button onClick={() => navigate('/billing')} variant="outline">
                Volver a Cuentas de Cobro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/billing')} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Cuenta de Cobro</h1>
          <p className="text-muted-foreground">
            Estado: <Badge variant={billingStatus === 'draft' ? 'outline' : 'secondary'}>
              {billingStatus === 'draft' ? 'Borrador' : 
               billingStatus === 'pending_review' ? 'En Revisión' :
               billingStatus === 'approved' ? 'Aprobado' :
               billingStatus === 'rejected' ? 'Rechazado' : 'Pagado'}
            </Badge>
          </p>
        </div>
      </div>

      {!canEdit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              Esta cuenta ya no se puede editar porque ha sido enviada a revisión o ya fue procesada.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos generales de la cuenta de cobro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contrato *</Label>
              <Select 
                value={selectedContract} 
                onValueChange={setSelectedContract}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedContractData && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cliente:</span>
                    <span className="text-sm font-medium">{selectedContractData.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor Total:</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedContractData.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedContractData.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Valor a Cobrar *</Label>
              <Input
                type="text"
                value={formattedAmount}
                onChange={(e) => {
                  // Remove all non-numeric characters and format
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setAmount(value);
                }}
                placeholder="$ 0"
                disabled={!canEdit}
              />
              {amount && (
                <p className="text-sm text-muted-foreground">
                  Valor ingresado: {formatAmountDisplay(amount)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                      disabled={!canEdit}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
                <Label>Fecha de Fin *</Label>
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
                      {endDate ? format(endDate, "PPP") : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Requeridos</CardTitle>
            <CardDescription>Suba los documentos necesarios para la cuenta de cobro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Certificado de Seguridad Social *</Label>
              {uploads.social_security.uploaded ? (
                <div className="flex items-center gap-2 p-3 border border-green-200 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {uploads.social_security.file?.name || 'Documento cargado'}
                  </span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploads(prev => ({
                        ...prev,
                        social_security: { file: null, uploaded: false, uploading: false }
                      }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <Label htmlFor="social_security" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium">
                          Haga clic para subir el certificado
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          PDF, hasta 10MB
                        </span>
                      </Label>
                      <Input
                        id="social_security"
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, 'social_security')}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Actividades Realizadas</span>
            <Badge variant="secondary">{activities.filter(a => a.status === 'saved').length}</Badge>
          </CardTitle>
          <CardDescription>Registre las actividades desarrolladas durante el período</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.filter(a => a.status === 'saved').map((activity, index) => (
            <Card key={activity.id} className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium">
                      {index + 1}. {activity.activityName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {activity.actions}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Guardada
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {canEdit && (
            <>
              {!showCurrentActivity ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowCurrentActivity(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Nueva Actividad
                </Button>
              ) : (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Nueva Actividad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre de la Actividad *</Label>
                      <Input
                        value={currentActivity.activityName}
                        onChange={(e) => setCurrentActivity(prev => ({ ...prev, activityName: e.target.value }))}
                        placeholder="Ej: Consulta médica especializada"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Acciones Desarrolladas *</Label>
                      <Textarea
                        value={currentActivity.actions}
                        onChange={(e) => setCurrentActivity(prev => ({ ...prev, actions: e.target.value }))}
                        placeholder="Describa detalladamente las acciones realizadas..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Evidencias (Opcional)</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <div className="mt-2">
                            <Label htmlFor="activity_evidence" className="cursor-pointer">
                              <span className="text-sm font-medium">Subir evidencias</span>
                              <span className="block text-xs text-muted-foreground">
                                Imágenes, PDF, hasta 5MB c/u
                              </span>
                            </Label>
                            <Input
                              id="activity_evidence"
                              type="file"
                              className="hidden"
                              multiple
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setCurrentActivity(prev => ({ 
                                  ...prev, 
                                  evidences: [...prev.evidences, ...files] 
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {currentActivity.evidences.length > 0 && (
                        <div className="space-y-2">
                          {currentActivity.evidences.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm flex-1">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentActivity(prev => ({
                                    ...prev,
                                    evidences: prev.evidences.filter((_, i) => i !== index)
                                  }));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={saveActivityIndividually}>
                        <Save className="h-4 w-4 mr-2" />
                        Registrar Actividad
                      </Button>
                      <Button 
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => navigate('/billing')}>
          Cancelar
        </Button>
        {canEdit && (
          <>
            <Button variant="outline" onClick={saveAsDraft}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!canSubmitForReview || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar a Revisión'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}