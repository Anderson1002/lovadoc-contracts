import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingProgressTrackerProps {
  informeComplete: boolean;
  certificacionComplete: boolean;
  cuentaCobroComplete: boolean;
  currentTab: string;
}

export function BillingProgressTracker({
  informeComplete,
  certificacionComplete,
  cuentaCobroComplete,
  currentTab
}: BillingProgressTrackerProps) {
  const allComplete = informeComplete && certificacionComplete && cuentaCobroComplete;
  const completedCount = [informeComplete, certificacionComplete, cuentaCobroComplete].filter(Boolean).length;
  const progressPercent = (completedCount / 3) * 100;

  const steps = [
    {
      id: 'informe',
      label: 'Informe de Actividades',
      complete: informeComplete,
      description: 'Actividades y planilla'
    },
    {
      id: 'certificacion',
      label: 'Certificación',
      complete: certificacionComplete,
      description: 'Certificación del supervisor'
    },
    {
      id: 'cuenta-cobro',
      label: 'Cuenta de Cobro',
      complete: cuentaCobroComplete,
      description: 'Documento equivalente'
    }
  ];

  return (
    <Card className={cn(
      "transition-all",
      allComplete ? "border-green-600/50 bg-green-50/30 dark:bg-green-950/10" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Progreso de Radicación</CardTitle>
          <Badge 
            variant={allComplete ? "default" : "secondary"}
            className={allComplete ? "bg-green-600" : ""}
          >
            {completedCount}/3 completos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                currentTab === step.id ? "bg-primary/5" : "",
                step.complete ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
              )}
            >
              {step.complete ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              ) : currentTab === step.id ? (
                <Circle className="h-5 w-5 text-primary shrink-0 animate-pulse" />
              ) : (
                <Circle className="h-5 w-5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  step.complete ? "text-green-700 dark:text-green-400" : ""
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
              {step.complete && (
                <Badge variant="outline" className="text-green-600 border-green-600 shrink-0">
                  ✓
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Status Message */}
        {allComplete ? (
          <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              ¡Todos los documentos están completos! Puede radicar la cuenta de cobro.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Complete los {3 - completedCount} documento{3 - completedCount !== 1 ? 's' : ''} restante{3 - completedCount !== 1 ? 's' : ''} para poder radicar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
