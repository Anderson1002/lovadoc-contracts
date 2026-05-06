import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarClock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseLocalDate } from "@/lib/utils";

interface Contract {
  id: string;
  contract_number: string;
  contract_number_original?: string;
  end_date: string;
  client_name?: string;
  estado?: string;
}

interface UpcomingExpirationsProps {
  contracts: Contract[];
}

export function UpcomingExpirations({ contracts }: UpcomingExpirationsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = contracts
    .filter(c => {
      if (c.estado === 'completado' || c.estado === 'cancelado') return false;
      const endDate = parseLocalDate(c.end_date);
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    })
    .map(c => {
      const endDate = parseLocalDate(c.end_date);
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, daysLeft: diffDays };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const getDaysLabel = (days: number) => {
    if (days === 0) return "Hoy";
    if (days === 1) return "Mañana";
    return `${days} días`;
  };

  const getDaysBadgeVariant = (days: number): "destructive" | "secondary" | "outline" => {
    if (days <= 3) return "destructive";
    if (days <= 7) return "secondary";
    return "outline";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-warning" />
          Próximos Vencimientos
        </CardTitle>
        <CardDescription>Contratos que vencen en los próximos 30 días</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length > 0 ? (
          upcoming.map((contract) => (
            <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {contract.contract_number_original || contract.contract_number}
                </p>
                {contract.client_name && (
                  <p className="text-xs text-muted-foreground truncate">{contract.client_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                {contract.daysLeft <= 3 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <Badge variant={getDaysBadgeVariant(contract.daysLeft)}>
                  {getDaysLabel(contract.daysLeft)}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarClock className="mx-auto h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No hay contratos próximos a vencer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
