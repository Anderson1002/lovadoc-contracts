import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CalendarIcon, RefreshCw, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useProfileValidation } from "@/hooks/useProfileValidation";
import { ClientSelector } from "@/components/contracts/ClientSelector";

const contractFormSchema = z.object({
  contractType: z.enum(["fixed_amount", "variable_amount", "contractor"]),
  clientProfileId: z.string().uuid("Debe seleccionar un cliente"),
  description: z.string().min(1, "La descripción es requerida"),
  totalAmount: z.string().min(1, "El valor total es requerido"),
  hourlyRate: z.string().optional(),
  startDate: z.date({
    required_error: "La fecha de inicio es requerida",
  }),
  endDate: z.date({
    required_error: "La fecha de finalización es requerida",
  }),
  area_responsable: z.string().optional(),
  supervisor_asignado: z.string().optional(),
  bankCertification: z.any().optional(),
  signedContract: z.any().optional(),
  
  // NUEVOS CAMPOS
  contractNumberOriginal: z.string().optional(),
  rp: z.string().optional(),
  cdp: z.string().optional(),
  fecha_rp: z.date().optional(),
  fecha_cdp: z.date().optional(),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: "La fecha de finalización debe ser posterior a la fecha de inicio",
  path: ["endDate"],
});

type ContractFormData = z.infer<typeof contractFormSchema>;

// Función para calcular plazo de ejecución
const calculateExecutionPeriod = (startDate: Date, endDate: Date) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30); // Aproximación de meses
  
  return {
    months: diffMonths,
    days: diffDays
  };
};

const bankOptions = [
  { value: "bancolombia", label: "Bancolombia" },
  { value: "banco_bogota", label: "Banco de Bogotá" },
  { value: "banco_popular", label: "Banco Popular" },
  { value: "bbva", label: "BBVA Colombia" },
  { value: "davivienda", label: "Davivienda" },
  { value: "banco_occidente", label: "Banco de Occidente" },
  { value: "banco_caja_social", label: "Banco Caja Social" },
  { value: "banco_av_villas", label: "Banco AV Villas" },
  { value: "citibank", label: "Citibank" },
  { value: "banco_agrario", label: "Banco Agrario" },
  { value: "banco_santander", label: "Banco Santander" },
  { value: "otro", label: "Otro" },
];

export default function CreateContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [selectedActiveContract, setSelectedActiveContract] = useState<any>(null);
  const [registeredContracts, setRegisteredContracts] = useState<Set<string>>(new Set());
  const [loadingActiveContracts, setLoadingActiveContracts] = useState(false);
  const { isProfileComplete, missingFields, loading: profileLoading } = useProfileValidation();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load user profile and active contracts
  useEffect(() => {
    loadActiveContracts();
  }, []);

  const loadActiveContracts = async () => {
    try {
      setLoadingActiveContracts(true);
      console.log('🔄 Iniciando carga de contratos activos...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('document_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.document_number) {
        console.log('❌ No se encontró document_number en el perfil');
        return;
      }

      console.log('📋 Buscando contratos para document_number:', profile.document_number);

      // Cargar contratos activos de la tabla externa
      const { data: contracts, error } = await (supabase as any)
        .from('contract')
        .select('*')
        .eq('TERCERO', profile.document_number);

      if (error) {
        console.error('❌ Error loading active contracts:', error);
        return;
      }

      // Verificar cuáles ya están registrados
      const { data: existingContracts } = await supabase
        .from('contracts')
        .select('contract_number_original')
        .not('contract_number_original', 'is', null);

      // Crear Set con los números de contrato ya registrados
      const registered = new Set(
        (existingContracts || []).map(c => c.contract_number_original)
      );

      console.log('✅ Contratos activos encontrados:', contracts?.length || 0);
      console.log('🔒 Contratos ya registrados:', registered.size);
      console.log('📊 Datos de contratos:', contracts);
      
      setActiveContracts(contracts || []);
      setRegisteredContracts(registered);
    } catch (error) {
      console.error('❌ Error loading active contracts:', error);
    } finally {
      setLoadingActiveContracts(false);
      console.log('✅ Carga de contratos finalizada');
    }
  };

  const handleSelectActiveContract = (selectedIndex: string) => {
    const contract = activeContracts[parseInt(selectedIndex)];
    if (!contract) return;

    // Verificar si ya está registrado
    if (registeredContracts.has(contract.CONTRATO)) {
      toast({
        title: "Contrato ya registrado",
        description: "Este contrato ya ha sido registrado en el sistema",
        variant: "destructive"
      });
      return;
    }

    // Pre-cargar campos de texto/números
    setValue("contractNumberOriginal", contract.CONTRATO || '');
    setValue("rp", contract.RP?.toString() || '');
    setValue("cdp", contract.CDP || '');
    setValue("totalAmount", contract.VALOR_INICIAL || '');
    setValue("description", contract["OBSERVACION RP"] || '');
    
    // Pre-cargar fechas si existen y son válidas
    if (contract["FECHA RP"]) {
      try {
        const fechaRP = new Date(contract["FECHA RP"]);
        if (!isNaN(fechaRP.getTime())) {
          setValue("fecha_rp", fechaRP);
        }
      } catch (e) {
        console.warn("Fecha RP inválida:", contract["FECHA RP"]);
      }
    }
    
    if (contract["FECHA CDP"]) {
      try {
        const fechaCDP = new Date(contract["FECHA CDP"]);
        if (!isNaN(fechaCDP.getTime())) {
          setValue("fecha_cdp", fechaCDP);
        }
      } catch (e) {
        console.warn("Fecha CDP inválida:", contract["FECHA CDP"]);
      }
    }
    
    setSelectedActiveContract(contract);

    toast({
      title: "Contrato seleccionado",
      description: `Datos pre-cargados del contrato ${contract.CONTRATO}`,
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
  });

  const selectedContractType = watch("contractType");
  const selectedStartDate = watch("startDate");
  const selectedEndDate = watch("endDate");

  const onSubmit = async (data: ContractFormData) => {
    try {
      setIsLoading(true);

      // Calcular plazo de ejecución
      const executionPeriod = calculateExecutionPeriod(
        data.startDate, 
        data.endDate
      );

      // Get user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error("Perfil de usuario no encontrado");

      // SUBIR PDF DEL CONTRATO FIRMADO (si existe)
      let signedContractPath = null;
      let signedContractMime = null;

      if (data.signedContract && data.signedContract.length > 0) {
        const file = data.signedContract[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Error al subir el contrato: ${uploadError.message}`);
        }

        signedContractPath = filePath;
        signedContractMime = file.type;

        toast({
          title: "PDF subido exitosamente",
          description: "El contrato firmado se guardó correctamente.",
        });
      }

      const contractData = {
        contract_number: '', // Se generará automáticamente por trigger
        contract_type: data.contractType,
        client_profile_id: data.clientProfileId,
        description: data.description,
        total_amount: parseFloat(data.totalAmount),
        hourly_rate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        start_date: data.startDate.toISOString().split('T')[0],
        end_date: data.endDate.toISOString().split('T')[0],
        execution_period_months: executionPeriod.months,
        execution_period_days: executionPeriod.days,
        area_responsable: data.area_responsable || null,
        supervisor_asignado: data.supervisor_asignado || null,
        estado: 'registrado' as const,
        state_code: 'REG',
        created_by: profile.id,
        
        // NUEVOS CAMPOS PRE-CARGADOS
        contract_number_original: data.contractNumberOriginal || null,
        rp: data.rp || null,
        cdp: data.cdp || null,
        fecha_rp: data.fecha_rp ? data.fecha_rp.toISOString().split('T')[0] : null,
        fecha_cdp: data.fecha_cdp ? data.fecha_cdp.toISOString().split('T')[0] : null,
        
        // PDF DEL CONTRATO FIRMADO
        signed_contract_path: signedContractPath,
        signed_contract_mime: signedContractMime,
      };

      const { data: contract, error } = await supabase
        .from('contracts')
        .insert(contractData as any)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activities').insert({
        user_id: user.id,
        entity_type: 'contract',
        entity_id: contract.id,
        action: 'contract_created',
        details: {
          contract_number: contract.contract_number,
          oid: contract.oid,
          total_amount: parseFloat(data.totalAmount)
        }
      });

      toast({
        title: "Contrato creado exitosamente",
        description: `Contrato #${contract.oid} - ${contract.contract_number_original || contract.contract_number} registrado.`,
      });

      navigate(`/contracts/${contract.id}`);
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error al crear contrato",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Crear Nuevo Contrato</h1>
          <p className="text-muted-foreground">
            Complete la información del contrato para registrarlo en el sistema
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Validación de Perfil Incompleto */}
          {!profileLoading && !isProfileComplete && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Perfil Incompleto</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Debes completar tu perfil antes de crear contratos.
                </p>
                <p className="text-sm mb-3">
                  <strong>Campos faltantes:</strong> {missingFields.join(", ")}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/profile")}
                  type="button"
                >
                  Ir a Mi Perfil
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Selección de Contrato Activo - Siempre visible si perfil completo */}
          {isProfileComplete && (
            <Card className="border-primary/20 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Contrato a Radicar</CardTitle>
                    <CardDescription>
                      Selecciona un contrato activo para pre-cargar sus datos
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadActiveContracts}
                    disabled={loadingActiveContracts}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", loadingActiveContracts && "animate-spin")} />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingActiveContracts ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : activeContracts.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No se encontraron contratos activos asociados a tu número de documento.
                      <br />
                      <span className="text-sm text-muted-foreground">
                        Completa el formulario manualmente a continuación.
                      </span>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Contrato</Label>
                      <Select onValueChange={handleSelectActiveContract}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un contrato" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeContracts.map((contract, index) => {
                            const isRegistered = registeredContracts.has(contract.CONTRATO);
                            
                            return (
                              <SelectItem 
                                key={`${contract.CONTRATO}-${index}`} 
                                value={index.toString()}
                                disabled={isRegistered}
                                className={isRegistered ? "opacity-60" : ""}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>
                                    {contract.CONTRATO}
                                    {contract.RP && ` | RP: ${contract.RP}`}
                                    {contract.CDP && ` | CDP: ${contract.CDP}`}
                                  </span>
                                  {isRegistered && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                                      Ya registrado
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {registeredContracts.size > 0 && (
                      <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                        <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                          <strong>{registeredContracts.size}</strong> contrato(s) ya registrado(s) en el sistema.
                          Los contratos marcados como "Ya registrado" no pueden ser seleccionados.
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedActiveContract && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* FILA 1: Número de Contrato, RP, CDP */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Número de Contrato</Label>
                            <Input 
                              value={selectedActiveContract.CONTRATO} 
                              disabled 
                              className="bg-muted"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">RP</Label>
                            <Input 
                              value={selectedActiveContract.RP || 'N/A'} 
                              disabled 
                              className="bg-muted"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">CDP</Label>
                            <Input 
                              value={selectedActiveContract.CDP || 'N/A'} 
                              disabled 
                              className="bg-muted"
                            />
                          </div>
                        </div>

                        {/* FILA 2: Objeto del Contrato (ancho completo) */}
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Objeto del Contrato</Label>
                          <Textarea 
                            value={selectedActiveContract["OBSERVACION RP"] || 'N/A'} 
                            disabled 
                            className="bg-muted resize-none"
                            rows={4}
                          />
                        </div>

                        {/* FILA 3: Valor Total del Contrato (ancho completo) */}
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Valor Total del Contrato</Label>
                          <Input 
                            value={`$${Number(selectedActiveContract.VALOR_INICIAL || 0).toLocaleString('es-CO')}`}
                            disabled 
                            className="bg-muted text-xl font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tipo de Contrato */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Contrato</CardTitle>
              <CardDescription>
                Seleccione el tipo de contrato que desea crear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedContractType === "fixed_amount"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => setValue("contractType", "fixed_amount")}
                >
                  <h3 className="font-semibold">Monto Fijo</h3>
                  <p className="text-sm text-muted-foreground">
                    Contrato con valor total predefinido
                  </p>
                </div>
                <div
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedContractType === "variable_amount"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => setValue("contractType", "variable_amount")}
                >
                  <h3 className="font-semibold">Monto Variable</h3>
                  <p className="text-sm text-muted-foreground">
                    Contrato basado en tarifa por hora
                  </p>
                </div>
                <div
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedContractType === "contractor"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => setValue("contractType", "contractor")}
                >
                  <h3 className="font-semibold">Contrato Empresa</h3>
                  <p className="text-sm text-muted-foreground">
                    Contrato institucional con empresa
                  </p>
                </div>
              </div>
              {errors.contractType && (
                <p className="text-sm text-destructive mt-2">
                  {errors.contractType.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
              <CardDescription>
                Seleccione el cliente o contratista para este contrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientSelector
                value={watch("clientProfileId")}
                onChange={(value) => setValue("clientProfileId", value)}
                error={errors.clientProfileId?.message}
              />
            </CardContent>
          </Card>

          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción del Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción / Objeto del Contrato</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción detallada del contrato..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monto Total */}
          <Card>
            <CardHeader>
              <CardTitle>Información Financiera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Valor Total del Contrato</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("totalAmount")}
                />
                {errors.totalAmount && (
                  <p className="text-sm text-destructive">
                    {errors.totalAmount.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          

          {/* Detalles del Contrato */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Contrato</CardTitle>
              <CardDescription>
                Información específica del contrato y servicios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedContractType === "variable_amount" && (
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Tarifa por Hora</Label>
                  <Input
                    id="hourlyRate"
                    type="text"
                    placeholder="$0.00"
                    {...register("hourlyRate")}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      const parts = value.split('.');
                      const formatted = parts[0] ? `$${parseInt(parts[0]).toLocaleString('es-CO')}` : '$0';
                      const finalFormatted = parts[1] !== undefined ? `${formatted}.${parts[1].slice(0, 2)}` : formatted + '.00';
                      e.target.value = finalFormatted;
                      setValue("hourlyRate", value);
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      const number = parseFloat(value) || 0;
                      const formatted = `$${number.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      e.target.value = formatted;
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Fecha de Inicio *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedStartDate ? (
                          format(selectedStartDate, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha de inicio</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedStartDate}
                        onSelect={(date) => setValue("startDate", date!)}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-destructive">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Finalización</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedEndDate ? (
                          format(selectedEndDate, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha de finalización</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedEndDate}
                        onSelect={(date) => setValue("endDate", date)}
                        disabled={(date) =>
                          selectedStartDate ? date < selectedStartDate : false
                        }
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Plazo de Ejecución - Calculado automáticamente */}
              {(selectedStartDate && selectedEndDate) && (
                <div className="space-y-2">
                  <Label>Plazo de Ejecución</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      {(() => {
                        const diffTime = Math.abs(selectedEndDate.getTime() - selectedStartDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const diffMonths = Math.round(diffDays / 30.44); // Promedio de días por mes
                        const diffYears = Math.round(diffDays / 365.25); // Considerando años bisiestos

                        if (diffDays <= 90) {
                          return `${diffDays} días`;
                        } else if (diffDays <= 730) {
                          return `${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'} (${diffDays} días)`;
                        } else {
                          return `${diffYears} ${diffYears === 1 ? 'año' : 'años'} (${diffDays} días)`;
                        }
                      })()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Desde el {format(selectedStartDate, "d 'de' MMMM 'de' yyyy", { locale: es })} hasta el {format(selectedEndDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              )}

              {/* Campo para contrato firmado */}
              <div className="space-y-2 mt-6">
                <Label htmlFor="signedContract">Contrato Firmado</Label>
                <Input
                  id="signedContract"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  {...register("signedContract")}
                />
                <p className="text-xs text-muted-foreground">
                  Suba el contrato firmado. Formatos permitidos: PDF, Word (máx. 10MB)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/contracts")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isProfileComplete}>
              {isLoading ? "Creando..." : "Crear Contrato"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}