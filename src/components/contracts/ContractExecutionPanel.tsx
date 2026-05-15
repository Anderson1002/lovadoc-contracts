import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingDown, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"money" | "percent">("money");
  const [rangeMonths, setRangeMonths] = useState<string>("all");

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
    const byMonth = new Map<string, { key: string; label: string; date: Date; mensual: number }>();
    for (const a of accounts) {
      const d = parseLocalDate(a.billing_month);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
      const prev = byMonth.get(key);
      byMonth.set(key, {
        key,
        label,
        date: new Date(d.getFullYear(), d.getMonth(), 1),
        mensual: (prev?.mensual || 0) + Number(a.amount || 0),
      });
    }
    const sorted = Array.from(byMonth.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    // Filter by range BEFORE computing the running cumulative so we still see
    // the real cumulative at the start of the visible window.
    let visible = sorted;
    if (rangeMonths !== "all" && sorted.length > 0) {
      const n = parseInt(rangeMonths, 10);
      if (!Number.isNaN(n) && n > 0 && sorted.length > n) {
        visible = sorted.slice(-n);
      }
    }
    const firstVisibleKey = visible[0]?.key;
    let acc = 0;
    let prevPct = 0;
    const all = sorted.map((r, idx) => {
      const prevAcc = acc;
      acc += r.mensual;
      const pct = valorTotal > 0 ? Math.min((acc / valorTotal) * 100, 100) : 0;
      const deltaMonto = r.mensual - (idx === 0 ? 0 : sorted[idx - 1].mensual);
      const deltaPct = pct - prevPct;
      prevPct = pct;
      return {
        key: r.key,
        mes: r.label,
        Mensual: r.mensual,
        Acumulado: acc,
        Porcentaje: pct,
        deltaMonto,
        deltaPct,
        prevAcc,
      };
    });
    if (!firstVisibleKey) return all;
    const startIdx = all.findIndex((p) => p.key === firstVisibleKey);
    return startIdx >= 0 ? all.slice(startIdx) : all;
  })();

  // Highlights: top contributor (max) and lowest (min) for current mode
  const highlights = (() => {
    if (chartData.length === 0) return { maxIdx: -1, minIdx: -1 };
    const metric = (d: any) => (chartMode === "percent" ? d.deltaPct : d.Mensual);
    let maxIdx = 0;
    let minIdx = 0;
    chartData.forEach((d, i) => {
      if (metric(d) > metric(chartData[maxIdx])) maxIdx = i;
      if (metric(d) < metric(chartData[minIdx])) minIdx = i;
    });
    // If only one point, no min/max distinction
    if (chartData.length === 1) return { maxIdx, minIdx: -1 };
    return { maxIdx, minIdx };
  })();

  const accountsByMonth = (() => {
    const m = new Map<string, any[]>();
    for (const a of accounts) {
      const d = parseLocalDate(a.billing_month);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    }
    return m;
  })();

  const selectedPoint = selectedMonth ? chartData.find((p) => p.key === selectedMonth) : null;
  const selectedMonthAccounts = selectedMonth ? accountsByMonth.get(selectedMonth) || [] : [];
  const selectedCumulativeAccounts = selectedMonth
    ? accounts.filter((a) => {
        const d = parseLocalDate(a.billing_month);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return k <= selectedMonth;
      })
    : [];

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
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Ejecución acumulada por mes
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground italic hidden sm:inline">Haz clic en un mes para ver detalle</span>
                    <Select value={rangeMonths} onValueChange={setRangeMonths}>
                      <SelectTrigger className="h-7 w-[140px] text-[11px]">
                        <SelectValue placeholder="Rango" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Últimos 3 meses</SelectItem>
                        <SelectItem value="6">Últimos 6 meses</SelectItem>
                        <SelectItem value="12">Últimos 12 meses</SelectItem>
                        <SelectItem value="24">Últimos 24 meses</SelectItem>
                        <SelectItem value="all">Todo el periodo</SelectItem>
                      </SelectContent>
                    </Select>
                    <ToggleGroup
                      type="single"
                      size="sm"
                      value={chartMode}
                      onValueChange={(v) => v && setChartMode(v as "money" | "percent")}
                      className="h-7"
                    >
                      <ToggleGroupItem value="money" className="h-7 px-2 text-[11px]">$ Monto</ToggleGroupItem>
                      <ToggleGroupItem value="percent" className="h-7 px-2 text-[11px]">% Ejecución</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                      onClick={(e: any) => {
                        const k = e?.activePayload?.[0]?.payload?.key;
                        if (k) setSelectedMonth((prev) => (prev === k ? null : k));
                      }}
                      style={{ cursor: "pointer" }}
                    >
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
                      {chartMode === "money" ? (
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) =>
                            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
                          }
                        />
                      ) : (
                        <YAxis
                          tick={{ fontSize: 11 }}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                      )}
                      <RTooltip
                        formatter={(value: any, name: string, item: any) => {
                          if (chartMode === "percent") {
                            const dpct = item?.payload?.deltaPct ?? 0;
                            return [
                              `${Number(value).toFixed(1)}% (Δ ${dpct >= 0 ? "+" : ""}${dpct.toFixed(1)}pp)`,
                              name,
                            ];
                          }
                          if (name === "Mensual") {
                            const dm = item?.payload?.deltaMonto ?? 0;
                            return [
                              `${formatCurrency(Number(value))} (Δ ${dm >= 0 ? "+" : ""}${formatCurrency(dm)})`,
                              name,
                            ];
                          }
                          return [formatCurrency(Number(value)), name];
                        }}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      {chartMode === "money" && valorTotal > 0 && (
                        <ReferenceLine
                          y={valorTotal}
                          stroke="hsl(var(--destructive))"
                          strokeDasharray="4 4"
                          label={{ value: "Valor total", fontSize: 10, fill: "hsl(var(--destructive))", position: "insideTopRight" }}
                        />
                      )}
                      {chartMode === "percent" && (
                        <ReferenceLine
                          y={100}
                          stroke="hsl(var(--destructive))"
                          strokeDasharray="4 4"
                          label={{ value: "100%", fontSize: 10, fill: "hsl(var(--destructive))", position: "insideTopRight" }}
                        />
                      )}
                      {selectedPoint && (
                        <ReferenceLine
                          x={selectedPoint.mes}
                          stroke="hsl(var(--primary))"
                          strokeDasharray="2 2"
                        />
                      )}
                      {chartMode === "money" ? (
                        <>
                          <Area
                            type="monotone"
                            dataKey="Acumulado"
                            stroke="hsl(var(--primary))"
                            fill="url(#execAcum)"
                            strokeWidth={2}
                            activeDot={{ r: 6, style: { cursor: "pointer" } }}
                          />
                          <Area
                            type="monotone"
                            dataKey="Mensual"
                            stroke="hsl(142 76% 36%)"
                            fill="url(#execMes)"
                            strokeWidth={2}
                            dot={(props: any) => {
                              const i = props.index;
                              if (i === highlights.maxIdx) {
                                return (
                                  <g key={`dot-${i}`}>
                                    <circle cx={props.cx} cy={props.cy} r={7} fill="hsl(142 76% 36%)" stroke="white" strokeWidth={2} />
                                    <text x={props.cx} y={props.cy - 12} textAnchor="middle" fontSize={10} fontWeight={700} fill="hsl(142 76% 36%)">
                                      ▲ {formatCurrency(props.payload.Mensual)}
                                    </text>
                                  </g>
                                );
                              }
                              if (i === highlights.minIdx) {
                                return (
                                  <g key={`dot-${i}`}>
                                    <circle cx={props.cx} cy={props.cy} r={7} fill="hsl(var(--destructive))" stroke="white" strokeWidth={2} />
                                    <text x={props.cx} y={props.cy + 18} textAnchor="middle" fontSize={10} fontWeight={700} fill="hsl(var(--destructive))">
                                      ▼ {formatCurrency(props.payload.Mensual)}
                                    </text>
                                  </g>
                                );
                              }
                              return <circle key={`dot-${i}`} cx={props.cx} cy={props.cy} r={3} fill="hsl(142 76% 36%)" />;
                            }}
                            activeDot={{ r: 6, style: { cursor: "pointer" } }}
                          />
                        </>
                      ) : (
                        <Area
                          type="monotone"
                          dataKey="Porcentaje"
                          name="% Acumulado"
                          stroke="hsl(var(--primary))"
                          fill="url(#execAcum)"
                          strokeWidth={2}
                          dot={(props: any) => {
                            const i = props.index;
                            const dp = props.payload.deltaPct ?? 0;
                            if (i === highlights.maxIdx) {
                              return (
                                <g key={`dot-${i}`}>
                                  <circle cx={props.cx} cy={props.cy} r={7} fill="hsl(142 76% 36%)" stroke="white" strokeWidth={2} />
                                  <text x={props.cx} y={props.cy - 12} textAnchor="middle" fontSize={10} fontWeight={700} fill="hsl(142 76% 36%)">
                                    ▲ +{dp.toFixed(1)}pp
                                  </text>
                                </g>
                              );
                            }
                            if (i === highlights.minIdx) {
                              return (
                                <g key={`dot-${i}`}>
                                  <circle cx={props.cx} cy={props.cy} r={7} fill="hsl(var(--destructive))" stroke="white" strokeWidth={2} />
                                  <text x={props.cx} y={props.cy + 18} textAnchor="middle" fontSize={10} fontWeight={700} fill="hsl(var(--destructive))">
                                    ▼ {dp >= 0 ? "+" : ""}{dp.toFixed(1)}pp
                                  </text>
                                </g>
                              );
                            }
                            return <circle key={`dot-${i}`} cx={props.cx} cy={props.cy} r={3} fill="hsl(var(--primary))" />;
                          }}
                          activeDot={{ r: 6, style: { cursor: "pointer" } }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {chartData.length > 1 && highlights.maxIdx >= 0 && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded border bg-green-50 dark:bg-green-950/20">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Mayor aporte</p>
                        <p className="font-semibold capitalize">
                          {chartData[highlights.maxIdx].mes}
                          <span className="ml-2 text-green-700 dark:text-green-400">
                            {chartMode === "percent"
                              ? `+${chartData[highlights.maxIdx].deltaPct.toFixed(1)}pp`
                              : formatCurrency(chartData[highlights.maxIdx].Mensual)}
                          </span>
                        </p>
                      </div>
                    </div>
                    {highlights.minIdx >= 0 && highlights.minIdx !== highlights.maxIdx && (
                      <div className="flex items-center gap-2 p-2 rounded border bg-red-50 dark:bg-red-950/20">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Menor aporte</p>
                          <p className="font-semibold capitalize">
                            {chartData[highlights.minIdx].mes}
                            <span className="ml-2 text-destructive">
                              {chartMode === "percent"
                                ? `${chartData[highlights.minIdx].deltaPct >= 0 ? "+" : ""}${chartData[highlights.minIdx].deltaPct.toFixed(1)}pp`
                                : formatCurrency(chartData[highlights.minIdx].Mensual)}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedPoint && (
                  <div className="mt-3 rounded border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-semibold capitalize">{selectedPoint.mes}</span>
                        <span className="text-muted-foreground"> · Mes: </span>
                        <span className="font-semibold">{formatCurrency(selectedPoint.Mensual)}</span>
                        <span className="text-muted-foreground"> · Acumulado: </span>
                        <span className="font-semibold">{formatCurrency(selectedPoint.Acumulado)}</span>
                        <span className="text-muted-foreground"> ({selectedPoint.Porcentaje.toFixed(1)}%)</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={() => setSelectedMonth(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                        Cuentas del mes ({selectedMonthAccounts.length})
                      </p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {selectedMonthAccounts.map((a) => (
                          <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded bg-background border">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">#{a.oid}</span>
                              <span className="font-medium">{a.account_number}</span>
                              <Badge variant="outline" className="text-[10px] py-0">{a.status}</Badge>
                            </div>
                            <span className="font-semibold">{formatCurrency(Number(a.amount))}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver todas las cuentas que componen el acumulado ({selectedCumulativeAccounts.length})
                      </summary>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {selectedCumulativeAccounts.map((a) => (
                          <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded bg-background border">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">#{a.oid}</span>
                              <span className="font-medium">{a.account_number}</span>
                              <span className="text-muted-foreground">
                                {parseLocalDate(a.billing_month).toLocaleDateString("es-ES", { month: "short", year: "2-digit" })}
                              </span>
                            </div>
                            <span className="font-semibold">{formatCurrency(Number(a.amount))}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}