import { supabase } from "@/integrations/supabase/client";

export interface ContractExecution {
  totalEjecutado: number;
  valorTotal: number;
  porcentaje: number;
  saldo: number;
  cuentasAprobadas: number;
}

/**
 * Calcula la ejecución acumulada de uno o varios contratos a partir de las
 * cuentas de cobro con estado 'aprobada' o 'causada'.
 */
export async function getMultipleContractsExecution(
  contractIds: string[],
  contractsTotalsById?: Record<string, number>
): Promise<Record<string, ContractExecution>> {
  if (!contractIds.length) return {};

  // Cargar cuentas aprobadas/causadas
  const { data: accounts, error } = await supabase
    .from("billing_accounts")
    .select("contract_id, amount, status")
    .in("contract_id", contractIds)
    .in("status", ["aprobada", "causada"]);
  if (error) {
    console.error("getMultipleContractsExecution accounts error", error);
  }

  // Si no se pasan los totales, cargarlos
  let totalsMap = contractsTotalsById;
  if (!totalsMap) {
    const { data: contracts, error: cErr } = await supabase
      .from("contracts")
      .select("id, total_amount, addition_amount")
      .in("id", contractIds);
    if (cErr) console.error("getMultipleContractsExecution contracts error", cErr);
    totalsMap = Object.fromEntries(
      (contracts || []).map((c: any) => [
        c.id,
        Number(c.total_amount || 0) + Number(c.addition_amount || 0),
      ])
    );
  }

  const result: Record<string, ContractExecution> = {};
  for (const id of contractIds) {
    const rows = (accounts || []).filter((a: any) => a.contract_id === id);
    const totalEjecutado = rows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const valorTotal = Number(totalsMap[id] || 0);
    const porcentaje = valorTotal > 0 ? (totalEjecutado / valorTotal) * 100 : 0;
    result[id] = {
      totalEjecutado,
      valorTotal,
      porcentaje: Math.min(porcentaje, 100),
      saldo: Math.max(valorTotal - totalEjecutado, 0),
      cuentasAprobadas: rows.length,
    };
  }
  return result;
}

export async function getContractExecution(
  contractId: string
): Promise<ContractExecution> {
  const map = await getMultipleContractsExecution([contractId]);
  return (
    map[contractId] || {
      totalEjecutado: 0,
      valorTotal: 0,
      porcentaje: 0,
      saldo: 0,
      cuentasAprobadas: 0,
    }
  );
}

export function executionColorClass(p: number): string {
  if (p >= 80) return "bg-green-500";
  if (p >= 40) return "bg-amber-500";
  return "bg-muted-foreground";
}

export function executionTextClass(p: number): string {
  if (p >= 80) return "text-green-600 dark:text-green-400";
  if (p >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}