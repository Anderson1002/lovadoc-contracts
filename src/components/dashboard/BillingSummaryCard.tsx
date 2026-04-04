import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Receipt, Send, Clock, CheckCircle, XCircle } from "lucide-react";

interface BillingSummaryProps {
  drafts: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function BillingSummaryCard({ drafts, pending, approved, rejected }: BillingSummaryProps) {
  const total = drafts + pending + approved + rejected;

  const items = [
    { label: "Borradores", value: drafts, icon: Receipt, color: "text-muted-foreground" },
    { label: "Pendientes revisión", value: pending, icon: Clock, color: "text-warning" },
    { label: "Aprobadas", value: approved, icon: CheckCircle, color: "text-green-600" },
    { label: "Rechazadas", value: rejected, icon: XCircle, color: "text-destructive" },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Cuentas de Cobro
          </CardTitle>
          <CardDescription>Resumen de tus cuentas de cobro</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/billing-accounts">Ver todas</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-3 border rounded-lg">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Receipt className="mx-auto h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No hay cuentas de cobro registradas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
