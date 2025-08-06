import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ContractStatusInfo() {
  const statuses = [
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
            <strong>Nota:</strong> Los contratos nuevos inician como "Activo" ya que se crean cuando están firmados. 
            Los cambios de estado son gestionados por usuarios administrativos según el progreso del contrato.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}