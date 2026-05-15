import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { executionTextClass } from "@/lib/contractExecution";
import { cn } from "@/lib/utils";

interface Props {
  contractId: string;
  totalAmount: number;
  additionAmount?: number | null;
}

export function ContractExecutionPanel({ contractId, totalAmount, additionAmount }: Props) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const valorTotal = Number(totalAmount || 0) + Number(additionAmount || 0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("billing_accounts")
        .select("id, oid, account_number, billing_month, amount, status, reviewed_at")
        .eq("contract_id", contractId)
        .in("status", ["aprobada", "causada"])
        .order("billing_month", { ascending: true });
      if (!cancel) {
        setAccounts(data || []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [contractId]);

  const totalEjecutado = accounts.reduce((s, a) => s + Number(a.amount || 0), 0);
  const porcentaje = valorTotal > 0 ? Math.min((totalEjecutado / valorTotal) * 100, 100) : 0;
  const saldo = Math.max(valorTotal - totalEjecutado, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Ejecución del Contrato
          <Badge variant="outline" className="ml-auto">
            {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} aprobada{accounts.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="h-24 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avance ejecutado</span>
                <span className={cn("font-bold", executionTextClass(porcentaje))}>
                  {porcentaje.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={porcentaje}
                className={cn(
                  "h-3",
                  porcentaje >= 80 && "[&>div]:bg-green-500",
                  porcentaje >= 40 && porcentaje < 80 && "[&>div]:bg-amber-500"
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded border">
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="font-bold">{formatCurrency(valorTotal)}</p>
              </div>
              <div className="p-3 rounded border bg-green-50 dark:bg-green-950/20">
                <p className="text-xs text-muted-foreground">Ejecutado</p>
                <p className="font-bold text-green-700 dark:text-green-400">{formatCurrency(totalEjecutado)}</p>
              </div>
              <div className="p-3 rounded border">
                <p className="text-xs text-muted-foreground">Saldo por Ejecutar</p>
                <p className="font-bold">{formatCurrency(saldo)}</p>
              </div>
            </div>

            {accounts.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Cuentas que componen la ejecución
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {accounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">#{a.oid}</span>
                        <span className="font-medium">{a.account_number}</span>
                        <span className="text-muted-foreground">
                          {parseLocalDate(a.billing_month).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <span className="font-semibold">{formatCurrency(Number(a.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}