import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
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

  // Build monthly cumulative chart data
  const chartData = (() => {
    const byMonth = new Map<string, { label: string; date: Date; mensual: number }>();
    for (const a of accounts) {
      const d = parseLocalDate(a.billing_month);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
      const prev = byMonth.get(key);
      byMonth.set(key, {
        label,
        date: new Date(d.getFullYear(), d.getMonth(), 1),
        mensual: (prev?.mensual || 0) + Number(a.amount || 0),
      });
    }
    const sorted = Array.from(byMonth.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    let acc = 0;
    return sorted.map((r) => {
      acc += r.mensual;
      return {
        mes: r.label,
        Mensual: r.mensual,
        Acumulado: acc,
        Porcentaje: valorTotal > 0 ? Math.min((acc / valorTotal) * 100, 100) : 0,
      };
    });
  })();

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

            {chartData.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Ejecución acumulada por mes
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="execAcum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="execMes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
                        }
                      />
                      <RTooltip
                        formatter={(value: any, name: string) =>
                          name === "Porcentaje" ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value))
                        }
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      {valorTotal > 0 && (
                        <ReferenceLine
                          y={valorTotal}
                          stroke="hsl(var(--destructive))"
                          strokeDasharray="4 4"
                          label={{ value: "Valor total", fontSize: 10, fill: "hsl(var(--destructive))", position: "insideTopRight" }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="Acumulado"
                        stroke="hsl(var(--primary))"
                        fill="url(#execAcum)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Mensual"
                        stroke="hsl(142 76% 36%)"
                        fill="url(#execMes)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}