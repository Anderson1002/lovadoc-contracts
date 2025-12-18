import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BillingCompletionProgressProps {
  // Detalles de Cobro
  contractId: string | null;
  amount: string | number | null;
  billingStartDate: Date | string | null;
  billingEndDate: Date | string | null;
  // Actividades
  activitiesCount: number;
  // Planilla
  planillaNumero: string | null;
  planillaValor: string | number | null;
  planillaFecha: string | null;
  planillaFile: File | string | null;
  // Firma
  hasSignature: boolean;
}

interface SectionStatus {
  name: string;
  complete: boolean;
  missing: string[];
}

export function BillingCompletionProgress({
  contractId,
  amount,
  billingStartDate,
  billingEndDate,
  activitiesCount,
  planillaNumero,
  planillaValor,
  planillaFecha,
  planillaFile,
  hasSignature
}: BillingCompletionProgressProps) {
  
  // Calculate missing fields for each section
  const getDetailsMissing = (): string[] => {
    const missing: string[] = [];
    if (!contractId) missing.push("Contrato");
    if (!amount) missing.push("Valor");
    if (!billingStartDate) missing.push("Fecha inicio");
    if (!billingEndDate) missing.push("Fecha fin");
    return missing;
  };

  const getActivitiesMissing = (): string[] => {
    if (activitiesCount === 0) return ["Agregar al menos una actividad"];
    return [];
  };

  const getPlanillaMissing = (): string[] => {
    const missing: string[] = [];
    if (!planillaNumero) missing.push("Número");
    if (!planillaValor) missing.push("Valor");
    if (!planillaFecha) missing.push("Fecha");
    if (!planillaFile) missing.push("Archivo PDF");
    return missing;
  };

  const getSignatureMissing = (): string[] => {
    if (!hasSignature) return ["Agregar firma digital"];
    return [];
  };

  const sections: SectionStatus[] = [
    {
      name: "Detalles de Cobro",
      complete: !!(contractId && amount && billingStartDate && billingEndDate),
      missing: getDetailsMissing()
    },
    {
      name: "Actividades",
      complete: activitiesCount >= 1,
      missing: getActivitiesMissing()
    },
    {
      name: "Planilla de Seguridad Social",
      complete: !!(planillaNumero && planillaValor && planillaFecha && planillaFile),
      missing: getPlanillaMissing()
    },
    {
      name: "Firma del Contratista",
      complete: hasSignature,
      missing: getSignatureMissing()
    }
  ];

  const completedCount = sections.filter(s => s.complete).length;
  const progressPercentage = (completedCount / sections.length) * 100;

  const isAllComplete = completedCount === sections.length;

  return (
    <div className={cn(
      "rounded-lg border p-4 mb-4",
      isAllComplete ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-muted/30 border-border"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          Progreso de la Cuenta de Cobro
        </h4>
        <span className={cn(
          "text-sm font-medium",
          isAllComplete ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      <Progress 
        value={progressPercentage} 
        className={cn(
          "h-2 mb-4",
          isAllComplete && "[&>div]:bg-green-500"
        )}
      />
      
      <div className="space-y-2">
        {sections.map((section, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex items-center gap-2">
              {section.complete ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm",
                section.complete ? "text-foreground" : "text-muted-foreground"
              )}>
                {section.name}
                {section.name === "Actividades" && activitiesCount > 0 && (
                  <span className="text-xs ml-1">({activitiesCount} registrada{activitiesCount > 1 ? 's' : ''})</span>
                )}
              </span>
            </div>
            
            {!section.complete && section.missing.length > 0 && (
              <div className="ml-6 mt-1 flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Falta: {section.missing.join(", ")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAllComplete && (
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ¡Listo para enviar a revisión!
          </p>
        </div>
      )}
    </div>
  );
}
