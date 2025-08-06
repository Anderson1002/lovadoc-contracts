import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ContractStatusInfo() {
  const statuses = [
    {
      status: 'draft',
      label: 'Borrador',
      description: 'Contrato recién creado, en proceso de elaboración',
      color: 'bg-muted text-muted-foreground'
    },
    {
      status: 'pending',
      label: 'Pendiente',
      description: 'Enviado para revisión, esperando aprobación',
      color: 'bg-warning/10 text-warning border-warning/20'
    },
    {
      status: 'in_review',
      label: 'En Revisión',
      description: 'Siendo revisado por el equipo de supervisión',
      color: 'bg-primary/10 text-primary border-primary/20'
    },
    {
      status: 'approved',
      label: 'Aprobado',
      description: 'Contrato aprobado, listo para firma',
      color: 'bg-success/10 text-success border-success/20'
    },
    {
      status: 'active',
      label: 'Activo',
      description: 'Contrato firmado y en ejecución',
      color: 'bg-success/20 text-success border-success/30'
    },
    {
      status: 'completed',
      label: 'Completado',
      description: 'Contrato finalizado exitosamente',
      color: 'bg-primary/20 text-primary border-primary/30'
    },
    {
      status: 'cancelled',
      label: 'Cancelado',
      description: 'Contrato cancelado antes de finalizar',
      color: 'bg-destructive/10 text-destructive border-destructive/20'
    },
    {
      status: 'rejected',
      label: 'Rechazado',
      description: 'Contrato rechazado en el proceso de revisión',
      color: 'bg-destructive/10 text-destructive border-destructive/20'
    }
  ];

  return (
    <Card className="border-2 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info/10 rounded-lg">
            <Info className="w-6 h-6 text-info" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Estados de Contratos</CardTitle>
            <CardDescription className="text-base">
              Comprenda el ciclo de vida de un contrato
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statuses.map((item) => (
            <div key={item.status} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Badge variant="secondary" className={item.color}>
                {item.label}
              </Badge>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Todos los contratos nuevos inician en estado "Borrador". 
            Los cambios de estado deben ser gestionados por usuarios con permisos administrativos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}