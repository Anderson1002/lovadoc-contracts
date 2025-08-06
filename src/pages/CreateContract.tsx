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
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";

interface ContractFormData {
  contract_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  contract_type: string;
  total_amount: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
  description: string;
}

const contractTypes = [
  {
    value: "fixed_amount",
    label: "Monto Fijo",
    description: "Valor total definido al inicio del contrato",
    icon: DollarSign
  },
  {
    value: "variable_amount", 
    label: "Monto Variable",
    description: "Valor basado en horas trabajadas o unidades",
    icon: Clock
  },
  {
    value: "company_contract",
    label: "Contrato Empresa",
    description: "Contrato con empresas prestadoras de servicios",
    icon: Building2
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
  const watchedStartDate = watch("start_date");
  const watchedEndDate = watch("end_date");
  const watchedAmount = watch("total_amount");

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
        .select('*, roles!role_id(name)')
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

    setIsLoading(true);
    try {
      const contractData = {
        contract_number: data.contract_number,
        client_name: data.client_name,
        client_email: data.client_email || null,
        client_phone: data.client_phone || null,
        client_address: data.client_address || null,
        contract_type: data.contract_type as any,
        total_amount: parseFloat(data.total_amount.replace(/[^\d.-]/g, '')),
        start_date: data.start_date?.toISOString().split('T')[0],
        end_date: data.end_date?.toISOString().split('T')[0] || null,
        description: data.description || null,
        created_by: userProfile.id,
        status: 'draft' as any
      };

      const { data: contract, error } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "¡Contrato creado exitosamente!",
        description: `El contrato ${contract.contract_number} ha sido creado`,
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
    const numberValue = value.replace(/[^\d]/g, '');
    const formattedValue = new Intl.NumberFormat('es-CO').format(Number(numberValue));
    return formattedValue;
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
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    Crear Nuevo Contrato
                  </h1>
                  <p className="text-muted-foreground">
                    Complete la información para crear un nuevo contrato
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Información Básica
                    </CardTitle>
                    <CardDescription>
                      Datos generales del contrato
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contract_number">Número de Contrato *</Label>
                        <Input
                          id="contract_number"
                          {...register("contract_number", { required: "El número de contrato es requerido" })}
                          placeholder="CON-2024-001"
                          readOnly
                          className="bg-muted"
                        />
                        {errors.contract_number && (
                          <p className="text-destructive text-sm">{errors.contract_number.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contract_type">Tipo de Contrato *</Label>
                        <Select onValueChange={(value) => setValue("contract_type", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de contrato" />
                          </SelectTrigger>
                          <SelectContent>
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
                    </div>

                    {watchedType && (
                      <div className="p-4 bg-primary-soft rounded-lg">
                        <Badge variant="outline" className="mb-2">
                          {contractTypes.find(t => t.value === watchedType)?.label}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {contractTypes.find(t => t.value === watchedType)?.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Client Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información del Cliente
                    </CardTitle>
                    <CardDescription>
                      Datos del contratista o empresa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="client_name">Nombre del Cliente *</Label>
                        <Input
                          id="client_name"
                          {...register("client_name", { required: "El nombre del cliente es requerido" })}
                          placeholder="Nombre completo o razón social"
                        />
                        {errors.client_name && (
                          <p className="text-destructive text-sm">{errors.client_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_email">Email</Label>
                        <Input
                          id="client_email"
                          type="email"
                          {...register("client_email")}
                          placeholder="cliente@ejemplo.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_phone">Teléfono</Label>
                        <Input
                          id="client_phone"
                          {...register("client_phone")}
                          placeholder="+57 300 123 4567"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_address">Dirección</Label>
                        <Input
                          id="client_address"
                          {...register("client_address")}
                          placeholder="Dirección completa"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contract Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Detalles del Contrato
                    </CardTitle>
                    <CardDescription>
                      Montos, fechas y descripción del trabajo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="total_amount">Valor Total *</Label>
                        <Input
                          id="total_amount"
                          {...register("total_amount", { required: "El valor total es requerido" })}
                          placeholder="$0"
                          onChange={(e) => {
                            const formatted = formatAmountInput(e.target.value);
                            setValue("total_amount", `$${formatted}`);
                          }}
                        />
                        {errors.total_amount && (
                          <p className="text-destructive text-sm">{errors.total_amount.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="start_date">Fecha de Inicio *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
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
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end_date">Fecha de Fin</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
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
                              disabled={(date) => 
                                watchedStartDate ? date < watchedStartDate : false
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción del Trabajo</Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Descripción detallada del trabajo a realizar..."
                        rows={4}
                      />
                    </div>

                    {watchedAmount && (
                      <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                        <div className="flex items-center gap-2 text-success font-medium">
                          <DollarSign className="w-4 h-4" />
                          Valor Total del Contrato
                        </div>
                        <p className="text-lg font-bold text-success mt-1">
                          {watchedAmount}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/contracts")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? "Guardando..." : "Crear Contrato"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}