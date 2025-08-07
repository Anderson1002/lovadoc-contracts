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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";

const contractFormSchema = z.object({
  contractType: z.enum(["fixed_amount", "variable_amount", "contractor"]),
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  clientAccountNumber: z.string().optional(),
  clientBankName: z.string().min(1, "El banco es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  totalAmount: z.string().min(1, "El valor total es requerido"),
  hourlyRate: z.string().optional(),
  startDate: z.date({
    required_error: "La fecha de inicio es requerida",
  }),
  endDate: z.date().optional(),
  area_responsable: z.string().min(1, "El área responsable es requerida"),
  supervisor_asignado: z.string().min(1, "El supervisor asignado es requerido"),
  bankCertification: z.any().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

const areaOptions = [
  { value: "cirugia_salas_partos", label: "Cirugía y Salas de Partos" },
  { value: "servicios_conexos_salud", label: "Servicios Conexos a la Salud" },
  { value: "talento_humano", label: "Talento Humano" },
  { value: "administracion", label: "Administración" },
  { value: "sistemas_informaticos", label: "Sistemas Informáticos" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "seguridad", label: "Seguridad" },
  { value: "servicios_generales", label: "Servicios Generales" },
];

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
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load supervisors for the dropdown
  useEffect(() => {
    loadSupervisors();
  }, []);

  const loadSupervisors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          name, 
          email,
          roles!profiles_role_id_fkey(name, display_name)
        `)
        .eq('roles.name', 'supervisor');

      if (error) {
        console.error('Error loading supervisors:', error);
        return;
      }
      
      console.log('Supervisors loaded:', data);
      setSupervisors(data || []);
    } catch (error) {
      console.error('Error loading supervisors:', error);
    }
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

      // Get user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error("Perfil de usuario no encontrado");

      const contractData = {
        contract_number: '', // Se generará automáticamente por trigger
        contract_type: data.contractType,
        client_name: data.clientName,
        client_email: data.clientEmail || null,
        client_phone: data.clientPhone || null,
        client_address: data.clientAddress || null,
        client_account_number: data.clientAccountNumber || null,
        client_bank_name: data.clientBankName || null,
        description: data.description,
        total_amount: parseFloat(data.totalAmount),
        hourly_rate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        start_date: data.startDate.toISOString().split('T')[0],
        end_date: data.endDate ? data.endDate.toISOString().split('T')[0] : null,
        area_responsable: data.area_responsable,
        supervisor_asignado: data.supervisor_asignado,
        status: 'draft' as const, // Estado inicial: Registrado
        created_by: profile.id
      };

      const { data: contract, error } = await supabase
        .from('contracts')
        .insert(contractData)
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
          client_name: data.clientName,
          total_amount: parseFloat(data.totalAmount)
        }
      });

      toast({
        title: "Contrato creado exitosamente",
        description: `El contrato ${contract.contract_number} ha sido registrado.`,
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

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
              <CardDescription>
                Datos principales del cliente o proveedor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nombre del Cliente *</Label>
                  <Input
                    id="clientName"
                    placeholder="Nombre completo o razón social"
                    {...register("clientName")}
                  />
                  {errors.clientName && (
                    <p className="text-sm text-destructive">
                      {errors.clientName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email del Cliente</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="cliente@email.com"
                    {...register("clientEmail")}
                  />
                  {errors.clientEmail && (
                    <p className="text-sm text-destructive">
                      {errors.clientEmail.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Teléfono del Cliente</Label>
                  <Input
                    id="clientPhone"
                    placeholder="Número de teléfono"
                    {...register("clientPhone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Dirección</Label>
                  <Input
                    id="clientAddress"
                    placeholder="Dirección del cliente"
                    {...register("clientAddress")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientAccountNumber">Número de Cuenta</Label>
                  <Input
                    id="clientAccountNumber"
                    placeholder="Número de cuenta bancaria"
                    {...register("clientAccountNumber")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientBankName">Banco *</Label>
                  <Select
                    value={watch("clientBankName")}
                    onValueChange={(value) => setValue("clientBankName", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar banco" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {bankOptions.map((bank) => (
                        <SelectItem key={bank.value} value={bank.label}>
                          {bank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientBankName && (
                    <p className="text-sm text-destructive">
                      {errors.clientBankName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Certificación Bancaria */}
              <div className="space-y-2">
                <Label htmlFor="bankCertification">Certificación Bancaria</Label>
                <Input
                  id="bankCertification"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  {...register("bankCertification")}
                />
                <p className="text-xs text-muted-foreground">
                  Formatos permitidos: PDF, Word, JPG, PNG (máx. 10MB)
                </p>
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
              <div className="space-y-2">
                <Label htmlFor="description">Objeto del Contrato *</Label>
                <Textarea
                  id="description"
                  placeholder="Describa el objeto del contrato, servicios a prestar, etc."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">
                    {selectedContractType === "variable_amount" 
                      ? "Valor Estimado Total *" 
                      : "Valor Total del Contrato *"}
                  </Label>
                  <Input
                    id="totalAmount"
                    type="text"
                    placeholder="$0"
                    {...register("totalAmount")}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      const formatted = value ? `$${parseInt(value).toLocaleString('es-CO')}` : '';
                      e.target.value = formatted;
                      setValue("totalAmount", value);
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      const formatted = value ? `$${parseInt(value).toLocaleString('es-CO')}` : '';
                      e.target.value = formatted;
                    }}
                  />
                  {errors.totalAmount && (
                    <p className="text-sm text-destructive">
                      {errors.totalAmount.message}
                    </p>
                  )}
                </div>

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
              </div>

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

              {/* Nuevos campos obligatorios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="area_responsable">
                    Área o Proceso Institucional Responsable del Contrato *
                  </Label>
                  <Select
                    value={watch("area_responsable")}
                    onValueChange={(value) => setValue("area_responsable", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área responsable" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg">
                      {areaOptions.map((area) => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.area_responsable && (
                    <p className="text-sm text-destructive">
                      {errors.area_responsable.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisor_asignado">
                    Supervisor Responsable *
                  </Label>
                  <Select
                    value={watch("supervisor_asignado")}
                    onValueChange={(value) => setValue("supervisor_asignado", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar supervisor" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {supervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.name}>
                          Supervisor ({supervisor.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supervisor_asignado && (
                    <p className="text-sm text-destructive">
                      {errors.supervisor_asignado.message}
                    </p>
                  )}
                </div>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Contrato"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}