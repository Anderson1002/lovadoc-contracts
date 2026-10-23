import { Search, X, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseLocalDate } from "@/lib/utils";

const normalize = (s: any) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador", pendiente_revision: "Pendiente revisión", aprobada: "Aprobada",
  rechazada: "Devuelta", causada: "Causada", pagada: "Pagada",
};

export function exportBillingCsv(rows: any[], fileLabel = "cuentas") {
  const fmtDate = (d: any) => {
    if (!d) return "";
    try { return parseLocalDate(String(d).slice(0, 10)).toLocaleDateString("es-CO"); } catch { return String(d); }
  };
  const fmtMonth = (d: any) => {
    if (!d) return "";
    try { return parseLocalDate(d).toLocaleDateString("es-ES", { month: "long", year: "numeric" }); } catch { return String(d); }
  };
  const header = ["#", "Número de cuenta", "Contrato", "Contratista", "Cédula", "Correo", "Período", "Inicio", "Fin", "Valor", "Estado", "Fecha creación"];
  const lines = rows.map((b) => [
    b.oid,
    b.account_number,
    b.contracts?.contract_number_original || b.contracts?.contract_number,
    b.created_by_profile?.name || b.contracts?.client?.name,
    b.created_by_profile?.document_number,
    b.created_by_profile?.email || b.contracts?.client?.email,
    fmtMonth(b.billing_month),
    fmtDate(b.billing_start_date),
    fmtDate(b.billing_end_date),
    b.amount ?? "",
    STATUS_LABELS[b.status] || b.status,
    fmtDate(b.created_at),
  ]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [header, ...lines].map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function matchesBillingSearch(billing: any, term: string): boolean {
  const q = normalize(term.trim());
  if (!q) return true;
  let month = "";
  try {
    month = billing.billing_month
      ? parseLocalDate(billing.billing_month).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
      : "";
  } catch { /* ignore */ }
  const haystack = normalize([
    billing.oid,
    billing.account_number,
    billing.contracts?.contract_number_original,
    billing.contracts?.contract_number,
    billing.contracts?.client?.name,
    billing.contracts?.client?.email,
    billing.contracts?.profiles?.name,
    billing.created_by_profile?.name,
    billing.created_by_profile?.email,
    billing.created_by_profile?.document_number,
    month,
  ].join(" "));
  return q.split(/\s+/).every((w) => haystack.includes(w));
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  shown: number;
  total: number;
  status?: string;
  onStatusChange?: (v: string) => void;
  onExport?: () => void;
}

export function BillingSearchBar({ value, onChange, shown, total, status, onStatusChange, onExport }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por contratista, cédula, contrato, número de cuenta o mes..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-9"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onChange("")}
            title="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {onStatusChange && (
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente_revision">Pendiente revisión</SelectItem>
            <SelectItem value="aprobada">Aprobadas</SelectItem>
            <SelectItem value="rechazada">Devueltas</SelectItem>
            <SelectItem value="causada">Causadas</SelectItem>
            <SelectItem value="pagada">Pagadas</SelectItem>
            <SelectItem value="borrador">Borradores</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Badge variant="outline" className="w-fit whitespace-nowrap">
        Mostrando {shown} de {total}
      </Badge>
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} disabled={shown === 0} className="w-fit">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      )}
    </div>
  );
}
