import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ContractStatusInfo() {
  const statuses = [
    {
      status: 'draft',
      label: 'Registrado',
      description: 'Contrato creado por el funcionario, pendiente de revisión',
      color: 'bg-state-registered/20 text-state-registered border-state-registered/30'
    },
    {
      status: 'returned',
      label: 'Devuelto',
      description: 'El supervisor devolvió el contrato por inconsistencias',
      color: 'bg-state-returned/20 text-state-returned border-state-returned/30'
    },
    {
      status: 'active',
      label: 'En Ejecución',
      description: 'Contrato aprobado por el supervisor y está dentro del rango de fechas',
      color: 'bg-state-executing/20 text-state-executing border-state-executing/30'
    },
    {
      status: 'completed',
      label: 'Completado',
      description: 'Contrato finalizado exitosamente al llegar su fecha fin',
      color: 'bg-state-completed/20 text-state-completed border-state-completed/30'
    },
    {
      status: 'cancelled',
      label: 'Cancelado',
      description: 'Contrato cancelado manualmente',
      color: 'bg-state-cancelled/20 text-state-cancelled border-state-cancelled/30'
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
            <strong>Nota:</strong> Los contratos nuevos inician como "Registrado" ya que se crean cuando están pendientes de revisión. 
            Los cambios de estado son gestionados por usuarios administrativos según el progreso del contrato.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}