import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { getMultipleContractsExecution, executionTextClass } from "@/lib/contractExecution";
import { cn } from "@/lib/utils";

interface Props {
  userRole: string;
  userProfileId?: string;
}

export function ContractExecutionSummary({ userRole, userProfileId }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("contracts")
        .select("id, contract_number, contract_number_original, total_amount, addition_amount, estado")
        .in("estado", ["en_ejecucion", "completado"]);
      if (userRole === "employee" && userProfileId) {
        q = q.eq("created_by", userProfileId);
      }
      const { data: contracts } = await q;
      if (!contracts || contracts.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const totals = Object.fromEntries(
        contracts.map((c: any) => [c.id, Number(c.total_amount || 0) + Number(c.addition_amount || 0)])
      );
      const exec = await getMultipleContractsExecution(contracts.map((c: any) => c.id), totals);
      const merged = contracts
        .map((c: any) => ({ ...c, execution: exec[c.id] }))
        .filter((c: any) => c.execution.cuentasAprobadas > 0)
        .sort((a: any, b: any) => b.execution.porcentaje - a.execution.porcentaje)
        .slice(0, 5);
      setItems(merged);
      setLoading(false);
    })();
  }, [userRole, userProfileId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Ejecución de Contratos
        </CardTitle>
        <CardDescription>Top 5 contratos por % ejecutado (cuentas aprobadas/causadas)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="h-32 bg-muted animate-pulse rounded" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aún no hay cuentas de cobro aprobadas
          </p>
        ) : (
          items.map((c) => {
            const e = c.execution;
            return (
              <Link key={c.id} to={`/contracts/${c.id}`} className="block">
                <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">
                        {c.contract_number_original || c.contract_number}
                      </span>
                      {e.porcentaje >= 90 && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" /> Próximo a agotarse
                        </Badge>
                      )}
                    </div>
                    <span className={cn("text-sm font-bold", executionTextClass(e.porcentaje))}>
                      {e.porcentaje.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={e.porcentaje}
                    className={cn(
                      "h-2 mb-1",
                      e.porcentaje >= 80 && "[&>div]:bg-green-500",
                      e.porcentaje >= 40 && e.porcentaje < 80 && "[&>div]:bg-amber-500"
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(e.totalEjecutado)} ejecutado</span>
                    <span>de {formatCurrency(e.valorTotal)}</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}