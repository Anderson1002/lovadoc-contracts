import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { GitCompare, Filter, ChevronDown, Search } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, parseLocalDate } from "@/lib/utils";

interface Props {
  userRole: string;
  userProfileId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  fixed_amount: "Monto fijo",
  variable_amount: "Monto variable",
  contractor: "Contratista",
};

const SERIES_COLORS = [
  "hsl(var(--primary))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
  "hsl(24 75% 50%)",
  "hsl(173 80% 40%)",
];

export function ContractExecutionComparison({ userRole, userProfileId }: Props) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"percent" | "money">("percent");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("contracts")
        .select("id, contract_number, contract_number_original, client_name, contract_type, total_amount, addition_amount, estado");
      if (userRole === "employee" && userProfileId) {
        q = q.eq("created_by", userProfileId);
      }
      // Supervisor: limitar a contratos de su mismo proceso
      if (userRole === "supervisor") {
        const { data: procRes } = await supabase.rpc("get_current_user_proceso_id");
        const procesoId = procRes as number | null;
        if (procesoId != null) {
          const { data: peers } = await supabase
            .from("profiles")
            .select("id")
            .eq("proceso_id", procesoId);
          const ids = (peers || []).map((p: any) => p.id);
          if (ids.length === 0) {
            setContracts([]);
            setAccounts([]);
            setLoading(false);
            return;
          }
          q = q.in("created_by", ids);
        }
      }
      const { data: cData } = await q;
      const list = cData || [];
      setContracts(list);

      if (list.length > 0) {
        const { data: aData } = await supabase
          .from("billing_accounts")
          .select("contract_id, billing_month, amount, status")
          .in("contract_id", list.map((c: any) => c.id))
          .in("status", ["aprobada", "causada"])
          .order("billing_month", { ascending: true });
        setAccounts(aData || []);
      }
      setLoading(false);
    })();
  }, [userRole, userProfileId]);

  // contracts filtered by type filter
  const filteredContracts = useMemo(() => {
    return typeFilter === "all"
      ? contracts
      : contracts.filter((c) => c.contract_type === typeFilter);
  }, [contracts, typeFilter]);

  // Ranking of contracts by execution to suggest defaults
  const ranked = useMemo(() => {
    const sumByContract = new Map<string, number>();
    for (const a of accounts) {
      sumByContract.set(a.contract_id, (sumByContract.get(a.contract_id) || 0) + Number(a.amount || 0));
    }
    return [...filteredContracts]
      .map((c) => {
        const total = Number(c.total_amount || 0) + Number(c.addition_amount || 0);
        const exec = sumByContract.get(c.id) || 0;
        const pct = total > 0 ? Math.min((exec / total) * 100, 100) : 0;
        return { ...c, exec, total, pct };
      })
      .sort((a, b) => b.exec - a.exec);
  }, [filteredContracts, accounts]);

  // ranked filtered by search query (contract number or razón social)
  const visibleRanked = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((c) => {
      const num = `${c.contract_number_original || ""} ${c.contract_number || ""}`.toLowerCase();
      const name = (c.client_name || "").toLowerCase();
      return num.includes(q) || name.includes(q);
    });
  }, [ranked, search]);

  // Auto-pick top 3 when filter changes & no manual selection
  useEffect(() => {
    if (loading) return;
    setSelectedIds((prev) => {
      const stillValid = prev.filter((id) => ranked.some((r) => r.id === id));
      if (stillValid.length > 0) return stillValid;
      return ranked.slice(0, 3).map((r) => r.id);
    });
  }, [ranked, loading]);

  // Build chart data: per-month cumulative for each selected contract
  const { chartData, seriesKeys } = useMemo(() => {
    if (selectedIds.length === 0) return { chartData: [], seriesKeys: [] as string[] };
    const monthsSet = new Set<string>();
    const perContractMonth: Record<string, Map<string, number>> = {};
    for (const id of selectedIds) perContractMonth[id] = new Map();
    for (const a of accounts) {
      if (!selectedIds.includes(a.contract_id)) continue;
      const d = parseLocalDate(a.billing_month);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthsSet.add(k);
      const m = perContractMonth[a.contract_id];
      m.set(k, (m.get(k) || 0) + Number(a.amount || 0));
    }
    const months = Array.from(monthsSet).sort();
    const totals: Record<string, number> = {};
    const labels: Record<string, string> = {};
    for (const id of selectedIds) {
      const c = contracts.find((x) => x.id === id);
      totals[id] = Number(c?.total_amount || 0) + Number(c?.addition_amount || 0);
      labels[id] = c?.contract_number_original || c?.contract_number || id.slice(0, 6);
    }
    const cumulative: Record<string, number> = Object.fromEntries(selectedIds.map((id) => [id, 0]));
    const data = months.map((k) => {
      const [y, mo] = k.split("-").map(Number);
      const label = new Date(y, mo - 1, 1).toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
      const row: any = { mes: label };
      for (const id of selectedIds) {
        cumulative[id] += perContractMonth[id].get(k) || 0;
        const seriesName = labels[id];
        row[seriesName] =
          mode === "percent"
            ? totals[id] > 0
              ? Math.min((cumulative[id] / totals[id]) * 100, 100)
              : 0
            : cumulative[id];
      }
      return row;
    });
    return { chartData: data, seriesKeys: selectedIds.map((id) => labels[id]) };
  }, [selectedIds, accounts, contracts, mode]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Comparación de Ejecución
            </CardTitle>
            <CardDescription>Compara la ejecución acumulada por tipo o contrato específico</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="fixed_amount">{TYPE_LABELS.fixed_amount}</SelectItem>
                <SelectItem value="variable_amount">{TYPE_LABELS.variable_amount}</SelectItem>
                <SelectItem value="contractor">{TYPE_LABELS.contractor}</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Contratos ({selectedIds.length}) <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-2 border-b flex items-center justify-between text-xs">
                  <span className="font-medium">Selecciona contratos</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSelectedIds(ranked.slice(0, 5).map((r) => r.id))}
                    >
                      Top 5
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSelectedIds([])}
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por número o razón social..."
                      className="h-7 pl-7 text-xs"
                    />
                  </div>
                </div>
                <ScrollArea className="h-72">
                  <div className="p-2 space-y-1">
                    {visibleRanked.length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">No hay contratos disponibles.</p>
                    )}
                    {visibleRanked.map((c) => {
                      const checked = selectedIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-xs p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleSelected(c.id)} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {c.contract_number_original || c.contract_number}
                            </div>
                            {c.client_name && (
                              <div className="text-muted-foreground text-[10px] truncate">{c.client_name}</div>
                            )}
                            <div className="text-muted-foreground text-[10px]">
                              {TYPE_LABELS[c.contract_type] || c.contract_type} · {c.pct.toFixed(1)}% ejecutado
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <ToggleGroup
              type="single"
              size="sm"
              value={mode}
              onValueChange={(v) => v && setMode(v as any)}
              className="h-8"
            >
              <ToggleGroupItem value="percent" className="h-8 px-2 text-xs">%</ToggleGroupItem>
              <ToggleGroupItem value="money" className="h-8 px-2 text-xs">$</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-72 bg-muted animate-pulse rounded" />
        ) : selectedIds.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Selecciona uno o más contratos para comparar.
          </p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Los contratos seleccionados aún no tienen cuentas aprobadas.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mb-3">
              {seriesKeys.map((k, i) => (
                <Badge
                  key={k}
                  variant="outline"
                  className="text-[10px]"
                  style={{ borderColor: SERIES_COLORS[i % SERIES_COLORS.length], color: SERIES_COLORS[i % SERIES_COLORS.length] }}
                >
                  {k}
                </Badge>
              ))}
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    domain={mode === "percent" ? [0, 100] : ["auto", "auto"]}
                    tickFormatter={(v) =>
                      mode === "percent"
                        ? `${v}%`
                        : v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}M`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : `${v}`
                    }
                  />
                  <RTooltip
                    formatter={(value: any) =>
                      mode === "percent" ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value))
                    }
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {seriesKeys.map((k, i) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}