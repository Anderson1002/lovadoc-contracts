import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  FileText,
  DollarSign,
  Building2,
  ArrowLeft,
  Save,
  Clock,
  User,
  LogOut,
  Upload,
  Info,
  FileCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ContractFormData {
  contract_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_account_number: string;
  client_bank_name: string;
  client_document_number: string;
  bank_certification: FileList | null;
  contract_type: string;
  contract_template: string;
  total_amount: string;
  hourly_rate: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
  contract_object: string;
  signed_contract: FileList | null;
}

const contractTypes = [
  {
    value: "fixed_amount",
    label: "Monto Fijo",
    description: "Valor total definido al inicio del contrato",
    icon: DollarSign,
    templates: [
      { value: "template_fixed_medical", label: "Plantilla Servicios Médicos - Monto Fijo" },
      { value: "template_fixed_admin", label: "Plantilla Servicios Administrativos - Monto Fijo" }
    ]
  },
  {
    value: "variable_amount", 
    label: "Monto Variable",
    description: "Valor basado en horas trabajadas o unidades",
    icon: Clock,
    templates: [
      { value: "template_variable_hourly", label: "Plantilla Por Horas" },
      { value: "template_variable_units", label: "Plantilla Por Unidades" }
    ]
  },
  {
    value: "contractor",
    label: "Contrato Empresa",
    description: "Contrato con empresas prestadoras de servicios",
    icon: Building2,
    templates: [
      { value: "template_company_services", label: "Plantilla Empresa Servicios" },
      { value: "template_company_equipment", label: "Plantilla Empresa Equipos" }
    ]
  }
];

export default function CreateContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState("employee");
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [basicInfoOpen, setBasicInfoOpen] = useState(true);
  const [clientInfoOpen, setClientInfoOpen] = useState(true);
  const [contractDetailsOpen, setContractDetailsOpen] = useState(true);
  const [contractDuration, setContractDuration] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<ContractFormData>();

  const watchedType = watch("contract_type");
  const watchedTemplate = watch("contract_template");
  const watchedStartDate = watch("start_date");
  const watchedEndDate = watch("end_date");
  const watchedAmount = watch("total_amount");

  // Calculate contract duration when dates change
  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      const start = new Date(watchedStartDate);
      const end = new Date(watchedEndDate);
      
      if (end > start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30);
        const remainingDays = diffDays % 30;
        const weeks = Math.floor(remainingDays / 7);
        const days = remainingDays % 7;
        
        let duration = "";
        if (months > 0) duration += `${months} mes${months > 1 ? 'es' : ''}`;
        if (weeks > 0) duration += `${duration ? ' y ' : ''}${weeks} semana${weeks > 1 ? 's' : ''}`;
        if (days > 0) duration += `${duration ? ' y ' : ''}${days} día${days > 1 ? 's' : ''}`;
        
        setContractDuration(duration || "Mismo día");
      } else {
        setContractDuration("");
      }
    } else {
      setContractDuration("");
    }
  }, [watchedStartDate, watchedEndDate]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          setTimeout(() => {
            loadInitialData(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        loadInitialData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadInitialData = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles!profiles_role_id_fkey(name)')
        .eq('user_id', userId)
        .single();

      if (profile && profile.roles) {
        setUserRole((profile.roles as any).name);
        setUserProfile(profile);
      }

      // Generate contract number
      const contractNumber = await generateContractNumber();
      setValue("contract_number", contractNumber);

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive"
      });
    }
  };

  const generateContractNumber = async () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get count of contracts this month
    const { count } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-${month}-01`)
      .lt('created_at', `${year}-${month === '12' ? year + 1 : year}-${month === '12' ? '01' : String(Number(month) + 1).padStart(2, '0')}-01`);

    const contractNumber = `CON-${year}${month}-${String((count || 0) + 1).padStart(3, '0')}`;
    return contractNumber;
  };

  const onSubmit = async (data: ContractFormData) => {
    if (!userProfile) return;

    // Validate required fields
    if (!data.client_document_number) {
      toast({
        title: "Error",
        description: "El número de documento es requerido",
        variant: "destructive"
      });
      return;
    }

    if (!data.bank_certification || data.bank_certification.length === 0) {
      toast({
        title: "Error", 
        description: "La certificación bancaria es requerida",
        variant: "destructive"
      });
      return;
    }

    if (!data.contract_object || data.contract_object.trim() === "") {
      toast({
        title: "Error",
        description: "El objeto del contrato es requerido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // First create the contract
      const contractData = {
        contract_number: data.contract_number,
        client_name: data.client_name,
        client_email: data.client_email || null,
        client_phone: data.client_phone || null,
        contract_type: data.contract_type as any,
        total_amount: parseFloat(data.total_amount.replace(/[^\d.-]/g, '').replace(',', '.')) || 0,
        start_date: data.start_date?.toISOString().split('T')[0],
        end_date: data.end_date?.toISOString().split('T')[0] || null,
        description: data.contract_object || null,
        created_by: userProfile.id,
        status: 'draft' as any
      };

      const { data: contract, error } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (error) throw error;

      // Upload bank certification
      console.log('Checking bank certification files:', data.bank_certification);
      if (data.bank_certification && data.bank_certification[0]) {
        console.log('Uploading bank certification...');
        const bankCertFile = data.bank_certification[0];
        const bankCertPath = `${user?.id}/${contract.id}/bank-certification-${Date.now()}.${bankCertFile.name.split('.').pop()}`;
        
        console.log('Bank cert upload path:', bankCertPath);
        const { error: uploadError } = await supabase.storage
          .from('contract-documents')
          .upload(bankCertPath, bankCertFile);

        if (uploadError) {
          console.error('Error uploading bank certification:', uploadError);
        } else {
          console.log('Bank certification uploaded successfully, saving document record...');
          // Save document record
          const { data: docData, error: docError } = await supabase
            .from('documents')
            .insert({
              contract_id: contract.id,
              file_name: `Certificación Bancaria - ${bankCertFile.name}`,
              file_path: bankCertPath,
              file_size: bankCertFile.size,
              mime_type: bankCertFile.type,
              uploaded_by: userProfile.id
            });

          if (docError) {
            console.error('Error saving bank certification document:', docError);
          } else {
            console.log('Bank certification document saved successfully:', docData);
          }
        }
      } else {
        console.log('No bank certification file provided');
      }

      // Upload signed contract if provided
      console.log('Checking signed contract files:', data.signed_contract);
      if (data.signed_contract && data.signed_contract[0]) {
        console.log('Uploading signed contract...');
        const signedContractFile = data.signed_contract[0];
        const signedContractPath = `${user?.id}/${contract.id}/signed-contract-${Date.now()}.${signedContractFile.name.split('.').pop()}`;
        
        console.log('Signed contract upload path:', signedContractPath);
        const { error: uploadError } = await supabase.storage
          .from('contract-documents')
          .upload(signedContractPath, signedContractFile);

        if (uploadError) {
          console.error('Error uploading signed contract:', uploadError);
        } else {
          console.log('Signed contract uploaded successfully, saving document record...');
          // Save document record
          const { data: docData, error: docError } = await supabase
            .from('documents')
            .insert({
              contract_id: contract.id,
              file_name: `Contrato Firmado - ${signedContractFile.name}`,
              file_path: signedContractPath,
              file_size: signedContractFile.size,
              mime_type: signedContractFile.type,
              uploaded_by: userProfile.id
            });

          if (docError) {
            console.error('Error saving signed contract document:', docError);
          } else {
            console.log('Signed contract document saved successfully:', docData);
          }
        }
      } else {
        console.log('No signed contract file provided');
      }

      toast({
        title: "¡Contrato creado exitosamente!",
        description: `El contrato ${contract.contract_number} ha sido creado con sus documentos`,
      });

      navigate(`/contracts`);

    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error al crear contrato",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmountInput = (value: string) => {
    // Allow numbers, decimals, and commas
    const numberValue = value.replace(/[^\d.,]/g, '');
    return numberValue;
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to auth
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar userRole={userRole} />
        <main className="flex-1">
          <header className="h-12 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Bienvenido, {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/contracts")}
                  className="flex items-center gap-2 hover:bg-muted"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        Crear Nuevo Contrato
                      </h1>
                      <p className="text-muted-foreground text-lg">
                        Complete la información para crear un nuevo contrato hospitalario
                      </p>
                    </div>
                  </div>
                  
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Inicio</span>
                    <span>/</span>
                    <span>Gestión de Contratos</span>
                    <span>/</span>
                    <span className="font-medium text-foreground">Nuevo Contrato</span>
                  </div>
                </div>
              </div>

              <TooltipProvider>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Basic Information */}
                  <Card className="border-2 shadow-md">
                    <Collapsible open={basicInfoOpen} onOpenChange={setBasicInfoOpen}>
                      <CardHeader>
                        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold">Información Básica</CardTitle>
                              <CardDescription className="text-base">
                                Datos generales del contrato
                              </CardDescription>
                            </div>
                          </div>
                          {basicInfoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="contract_number" className="text-base font-semibold">Número de Contrato *</Label>
                              <Input
                                id="contract_number"
                                {...register("contract_number", { required: "El número de contrato es requerido" })}
                                placeholder="CON-2024-001"
                                className="text-lg"
                              />
                              {errors.contract_number && (
                                <p className="text-destructive text-sm">{errors.contract_number.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="contract_type" className="text-base font-semibold">Tipo de Contrato *</Label>
                              <Select onValueChange={(value) => {
                                setValue("contract_type", value);
                                setValue("contract_template", ""); // Reset template when type changes
                              }}>
                                <SelectTrigger className="text-lg">
                                  <SelectValue placeholder="Selecciona el tipo de contrato" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border shadow-lg z-50">
                                  {contractTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                      <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                          <Icon className="w-4 h-4" />
                                          <div>
                                            <div className="font-medium">{type.label}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {type.description}
                                            </div>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {errors.contract_type && (
                                <p className="text-destructive text-sm">El tipo de contrato es requerido</p>
                              )}
                            </div>

                            {/* Template Selection - Only show for non-variable amount contracts */}
                            {watchedType && watchedType !== "variable_amount" && (
                              <div className="space-y-2">
                                <Label htmlFor="contract_template" className="text-base font-semibold">
                                  Plantilla de Contrato
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-4 h-4 text-muted-foreground ml-1" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Selecciona una plantilla predefinida para este tipo de contrato</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </Label>
                                <Select 
                                  value={watchedTemplate} 
                                  onValueChange={(value) => setValue("contract_template", value)}
                                >
                                  <SelectTrigger className="text-lg">
                                    <SelectValue placeholder="Selecciona una plantilla" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border shadow-lg z-50">
                                    {contractTypes
                                      .find(t => t.value === watchedType)
                                      ?.templates.map((template) => (
                                        <SelectItem key={template.value} value={template.value}>
                                          {template.label}
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          {watchedType && (
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                              <Badge variant="outline" className="mb-2">
                                {contractTypes.find(t => t.value === watchedType)?.label}
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                {contractTypes.find(t => t.value === watchedType)?.description}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>

                  {/* Client Information */}
                  <Card className="border-2 shadow-md">
                    <Collapsible open={clientInfoOpen} onOpenChange={setClientInfoOpen}>
                      <CardHeader>
                        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold">Información del Cliente</CardTitle>
                              <CardDescription className="text-base">
                                Datos del contratista o empresa
                              </CardDescription>
                            </div>
                          </div>
                          {clientInfoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="client_name" className="text-base font-semibold">Nombre del Cliente *</Label>
                              <Input
                                id="client_name"
                                {...register("client_name", { required: "El nombre del cliente es requerido" })}
                                placeholder="Nombre completo o razón social"
                                className="text-lg"
                              />
                              {errors.client_name && (
                                <p className="text-destructive text-sm">{errors.client_name.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="client_document_number" className="text-base font-semibold">Número de Documento *</Label>
                              <Input
                                id="client_document_number"
                                {...register("client_document_number", { 
                                  required: "El número de documento es requerido",
                                  pattern: {
                                    value: /^[0-9]+$/,
                                    message: "Solo se permiten números"
                                  }
                                })}
                                placeholder="123456789"
                                className="text-lg"
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = target.value.replace(/[^0-9]/g, '');
                                }}
                              />
                              {errors.client_document_number && (
                                <p className="text-destructive text-sm">{errors.client_document_number.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="client_email" className="text-base font-semibold">Email</Label>
                              <Input
                                id="client_email"
                                type="email"
                                {...register("client_email")}
                                placeholder="cliente@ejemplo.com"
                                className="text-lg"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="client_phone" className="text-base font-semibold">Teléfono</Label>
                              <Input
                                id="client_phone"
                                {...register("client_phone")}
                                placeholder="+57 300 123 4567"
                                className="text-lg"
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="client_address" className="text-base font-semibold">Dirección</Label>
                              <Input
                                id="client_address"
                                {...register("client_address")}
                                placeholder="Dirección completa del cliente"
                                className="text-lg"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="client_account_number" className="text-base font-semibold">Número de Cuenta</Label>
                              <Input
                                id="client_account_number"
                                {...register("client_account_number")}
                                placeholder="1234567890"
                                className="text-lg"
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = target.value.replace(/[^0-9]/g, '');
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="client_bank_name" className="text-base font-semibold">Banco</Label>
                              <Select onValueChange={(value) => setValue("client_bank_name", value)}>
                                <SelectTrigger className="text-lg">
                                  <SelectValue placeholder="Selecciona el banco" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border shadow-lg z-50">
                                  <SelectItem value="bancolombia">Bancolombia</SelectItem>
                                  <SelectItem value="banco_de_bogota">Banco de Bogotá</SelectItem>
                                  <SelectItem value="bbva">BBVA</SelectItem>
                                  <SelectItem value="davivienda">Davivienda</SelectItem>
                                  <SelectItem value="banco_popular">Banco Popular</SelectItem>
                                  <SelectItem value="colpatria">Scotiabank Colpatria</SelectItem>
                                  <SelectItem value="av_villas">AV Villas</SelectItem>
                                  <SelectItem value="banco_caja_social">Banco Caja Social</SelectItem>
                                  <SelectItem value="banco_falabella">Banco Falabella</SelectItem>
                                  <SelectItem value="banco_pichincha">Banco Pichincha</SelectItem>
                                  <SelectItem value="citibank">Citibank</SelectItem>
                                  <SelectItem value="banco_gnb_sudameris">Banco GNB Sudameris</SelectItem>
                                  <SelectItem value="banco_santander">Banco Santander</SelectItem>
                                  <SelectItem value="banco_itau">Banco Itaú</SelectItem>
                                  <SelectItem value="bancamia">Bancamía</SelectItem>
                                  <SelectItem value="cooperativa_financiera">Cooperativa Financiera</SelectItem>
                                  <SelectItem value="nequi">Nequi</SelectItem>
                                  <SelectItem value="daviplata">DaviPlata</SelectItem>
                                  <SelectItem value="otros">Otros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="bank_certification" className="text-base font-semibold flex items-center gap-2">
                                Certificación Bancaria *
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Documento que certifica la información bancaria del cliente</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <div className="flex items-center gap-4">
                                <Input
                                  id="bank_certification"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  {...register("bank_certification", { required: "La certificación bancaria es requerida" })}
                                  className="text-lg"
                                />
                                <Upload className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <p className="text-sm text-muted-foreground">Formatos: PDF, JPG, PNG</p>
                              {errors.bank_certification && (
                                <p className="text-destructive text-sm">{errors.bank_certification.message}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>

                  {/* Contract Details */}
                  <Card className="border-2 shadow-md">
                    <Collapsible open={contractDetailsOpen} onOpenChange={setContractDetailsOpen}>
                      <CardHeader>
                        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold">Detalles del Contrato</CardTitle>
                              <CardDescription className="text-base">
                                Montos, fechas y especificaciones del trabajo
                              </CardDescription>
                            </div>
                          </div>
                          {contractDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {watchedType === "variable_amount" ? (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="hourly_rate" className="text-base font-semibold">Valor por Hora *</Label>
                                  <Input
                                    id="hourly_rate"
                                    {...register("hourly_rate", { required: "El valor por hora es requerido" })}
                                    placeholder="$0"
                                    className="text-lg"
                                    onChange={(e) => {
                                      const formatted = formatAmountInput(e.target.value);
                                      setValue("hourly_rate", formatted);
                                    }}
                                  />
                                  {errors.hourly_rate && (
                                    <p className="text-destructive text-sm">{errors.hourly_rate.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="total_amount" className="text-base font-semibold">Valor Total del Contrato *</Label>
                                  <Input
                                    id="total_amount"
                                    {...register("total_amount", { required: "El valor total es requerido" })}
                                    placeholder="$0"
                                    className="text-lg"
                                    onChange={(e) => {
                                      const formatted = formatAmountInput(e.target.value);
                                      setValue("total_amount", formatted);
                                    }}
                                  />
                                  {errors.total_amount && (
                                    <p className="text-destructive text-sm">{errors.total_amount.message}</p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <Label htmlFor="total_amount" className="text-base font-semibold">Valor Total *</Label>
                                <Input
                                  id="total_amount"
                                  {...register("total_amount", { required: "El valor total es requerido" })}
                                  placeholder="$0"
                                  className="text-lg"
                                  onChange={(e) => {
                                    const formatted = formatAmountInput(e.target.value);
                                    setValue("total_amount", formatted);
                                  }}
                                />
                                {errors.total_amount && (
                                  <p className="text-destructive text-sm">{errors.total_amount.message}</p>
                                )}
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="start_date" className="text-base font-semibold">Fecha de Inicio *</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal text-lg",
                                      !watchedStartDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {watchedStartDate ? (
                                      format(watchedStartDate, "PPP", { locale: es })
                                    ) : (
                                      <span>Selecciona fecha</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={watchedStartDate}
                                    onSelect={(date) => setValue("start_date", date)}
                                    initialFocus
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="end_date" className="text-base font-semibold">Fecha de Fin</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal text-lg",
                                      !watchedEndDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {watchedEndDate ? (
                                      format(watchedEndDate, "PPP", { locale: es })
                                    ) : (
                                      <span>Selecciona fecha</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={watchedEndDate}
                                    onSelect={(date) => setValue("end_date", date)}
                                    initialFocus
                                    className="pointer-events-auto"
                                    disabled={(date) => 
                                      watchedStartDate ? date < watchedStartDate : false
                                    }
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                          {/* Contract Duration Display */}
                          {contractDuration && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-900">Duración del Contrato:</span>
                                <span className="text-blue-800 font-medium">{contractDuration}</span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="contract_object" className="text-base font-semibold flex items-center gap-2">
                              {watchedType === "variable_amount" ? "Detalles del Contrato (Incluir valor por hora) *" : "Objeto del Contrato *"}
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-4 h-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {watchedType === "variable_amount" 
                                      ? "Descripción del trabajo y valor por hora. Este valor se usará para calcular las cuentas de cobro por horas trabajadas."
                                      : "Descripción detallada del objeto y alcance del contrato"
                                    }
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <Textarea
                              id="contract_object"
                              {...register("contract_object", { required: "Los detalles del contrato son requeridos" })}
                              placeholder={
                                watchedType === "variable_amount" 
                                  ? "Descripción del trabajo a realizar por horas. Incluir detalles sobre el valor por hora y las actividades a desarrollar..."
                                  : "Descripción detallada del objeto del contrato y alcance del trabajo a realizar..."
                              }
                              rows={6}
                              className="text-lg resize-none"
                            />
                            {errors.contract_object && (
                              <p className="text-destructive text-sm">{errors.contract_object.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signed_contract" className="text-base font-semibold flex items-center gap-2">
                              Subir Contrato Firmado *
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-4 h-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Adjunta el contrato firmado en formato PDF</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <div className="flex items-center gap-4">
                              <Input
                                id="signed_contract"
                                type="file"
                                accept=".pdf"
                                {...register("signed_contract", { required: "El contrato firmado es requerido" })}
                                className="text-lg"
                              />
                              <FileCheck className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">Adjuntar contrato firmado en PDF</p>
                            {errors.signed_contract && (
                              <p className="text-destructive text-sm">{errors.signed_contract.message}</p>
                            )}
                          </div>

                          {watchedAmount && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 text-green-700 font-medium">
                                <DollarSign className="w-5 h-5" />
                                Valor Total del Contrato
                              </div>
                              <p className="text-2xl font-bold text-green-800 mt-1">
                                {watchedAmount}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>

                  {/* Actions */}
                  <div className="flex justify-end gap-4 pt-8 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => navigate("/contracts")}
                      className="px-8"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      size="lg"
                      className="flex items-center gap-2 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    >
                      <FileText className="w-5 h-5" />
                      {isLoading ? "Creando Contrato..." : "Crear Contrato"}
                    </Button>
                  </div>
                </form>
              </TooltipProvider>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}