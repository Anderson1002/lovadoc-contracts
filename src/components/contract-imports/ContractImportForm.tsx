import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, X, Loader2 } from "lucide-react";

const formSchema = z.object({
  CONTRATO: z.string().min(1, "El número de contrato es requerido"),
  CDP: z.string().optional(),
  "FECHA CDP": z.string().optional(),
  RP: z.string().optional(),
  "FECHA RP": z.string().optional(),
  TERCERO: z.string().min(1, "El tercero es requerido"),
  DESCRIP_TERCERO: z.string().min(1, "La descripción del tercero es requerida"),
  VALOR_INICIAL: z.string().optional(),
  MODIFIC_CREDITO: z.string().optional(),
  MODIFIC_DEBITO: z.string().optional(),
  "VALOR EJECUTADO": z.string().optional(),
  "SALDO RP": z.string().optional(),
  "OBSERVACION RP": z.string().optional(),
});

export type ContractImportFormValues = z.infer<typeof formSchema>;

interface Props {
  initialValues?: Partial<ContractImportFormValues>;
  onSubmit: (values: ContractImportFormValues) => Promise<void>;
  submitting: boolean;
  mode: "create" | "edit";
  oid?: number;
}

export function ContractImportForm({
  initialValues,
  onSubmit,
  submitting,
  mode,
  oid,
}: Props) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractImportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      CONTRATO: initialValues?.CONTRATO ?? "",
      CDP: initialValues?.CDP ?? "",
      "FECHA CDP": initialValues?.["FECHA CDP"] ?? "",
      RP: initialValues?.RP ?? "",
      "FECHA RP": initialValues?.["FECHA RP"] ?? "",
      TERCERO: initialValues?.TERCERO ?? "",
      DESCRIP_TERCERO: initialValues?.DESCRIP_TERCERO ?? "",
      VALOR_INICIAL: initialValues?.VALOR_INICIAL ?? "",
      MODIFIC_CREDITO: initialValues?.MODIFIC_CREDITO ?? "",
      MODIFIC_DEBITO: initialValues?.MODIFIC_DEBITO ?? "",
      "VALOR EJECUTADO": initialValues?.["VALOR EJECUTADO"] ?? "",
      "SALDO RP": initialValues?.["SALDO RP"] ?? "",
      "OBSERVACION RP": initialValues?.["OBSERVACION RP"] ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Contrato</CardTitle>
          <CardDescription>
            {mode === "edit" && oid
              ? `Editando registro #${oid}. El OID y número de contrato se conservan.`
              : "El OID se asigna automáticamente al guardar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="CONTRATO">
              Número de Contrato <span className="text-destructive">*</span>
            </Label>
            <Input
              id="CONTRATO"
              placeholder="Ej: 032-2025"
              readOnly={mode === "edit"}
              {...register("CONTRATO")}
            />
            {errors.CONTRATO && (
              <p className="text-xs text-destructive">{errors.CONTRATO.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="TERCERO">
              Tercero (Documento) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="TERCERO"
              placeholder="Ej: 80197840"
              {...register("TERCERO")}
            />
            {errors.TERCERO && (
              <p className="text-xs text-destructive">{errors.TERCERO.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="DESCRIP_TERCERO">
              Nombre / Razón Social <span className="text-destructive">*</span>
            </Label>
            <Input
              id="DESCRIP_TERCERO"
              placeholder="Nombre completo o razón social"
              {...register("DESCRIP_TERCERO")}
            />
            {errors.DESCRIP_TERCERO && (
              <p className="text-xs text-destructive">{errors.DESCRIP_TERCERO.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Presupuestal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="CDP">CDP</Label>
            <Input id="CDP" placeholder="Ej: 19" {...register("CDP")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="FECHA CDP">Fecha CDP</Label>
            <Input
              id="FECHA CDP"
              type="date"
              {...register("FECHA CDP")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="RP">RP</Label>
            <Input
              id="RP"
              type="number"
              placeholder="Ej: 193"
              {...register("RP")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="FECHA RP">Fecha RP</Label>
            <Input
              id="FECHA RP"
              type="date"
              {...register("FECHA RP")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="VALOR_INICIAL">Valor Inicial</Label>
            <Input
              id="VALOR_INICIAL"
              placeholder="0"
              {...register("VALOR_INICIAL")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="VALOR EJECUTADO">Valor Ejecutado</Label>
            <Input
              id="VALOR EJECUTADO"
              placeholder="0"
              {...register("VALOR EJECUTADO")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="MODIFIC_CREDITO">Modificación Crédito</Label>
            <Input
              id="MODIFIC_CREDITO"
              placeholder="0"
              {...register("MODIFIC_CREDITO")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="MODIFIC_DEBITO">Modificación Débito</Label>
            <Input
              id="MODIFIC_DEBITO"
              placeholder="0"
              {...register("MODIFIC_DEBITO")}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="SALDO RP">Saldo RP</Label>
            <Input
              id="SALDO RP"
              placeholder="0"
              {...register("SALDO RP")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="OBSERVACION RP">Observación RP</Label>
            <Textarea
              id="OBSERVACION RP"
              rows={4}
              placeholder="Notas u observaciones del registro presupuestal..."
              {...register("OBSERVACION RP")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/contract-imports")}
          disabled={submitting}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {mode === "create" ? "Crear Contrato" : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}