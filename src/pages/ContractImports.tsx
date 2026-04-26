import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, Search, Download, FileSpreadsheet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const ALLOWED_ROLES = ["super_admin", "admin", "juridica"];

export default function ContractImports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("roles!profiles_role_id_fkey(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      const roleName = (profile?.roles as any)?.name;
      if (!ALLOWED_ROLES.includes(roleName)) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para ver esta sección",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from("contract")
          .select("*")
          .order("OID", { ascending: false })
          .limit(1000);

        if (error) throw error;
        setRows(data || []);
      } catch (err: any) {
        console.error("Error loading imported contracts:", err);
        toast({
          title: "Error",
          description: "No se pudieron cargar los registros importados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate, toast]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => {
      return [
        r.CONTRATO,
        r.TERCERO,
        r.DESCRIP_TERCERO,
        r.CDP,
        r.RP?.toString(),
        r["OBSERVACION RP"],
      ]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(term));
    });
  }, [rows, search]);

  const totalValue = useMemo(
    () =>
      filtered.reduce((sum, r) => sum + (parseFloat(r.VALOR_INICIAL) || 0), 0),
    [filtered]
  );

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const headers = [
      "OID",
      "CONTRATO",
      "RP",
      "FECHA RP",
      "CDP",
      "FECHA CDP",
      "TERCERO",
      "DESCRIP_TERCERO",
      "VALOR_INICIAL",
      "VALOR EJECUTADO",
      "SALDO RP",
      "OBSERVACION RP",
    ];
    const csv = [
      headers.join(","),
      ...filtered.map((r) =>
        headers
          .map((h) => {
            const val = r[h] ?? "";
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contratos-importados-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Datos Importados
              </h1>
              <p className="text-muted-foreground">
                Registros contractuales sincronizados desde el sistema externo
              </p>
            </div>
          </div>
          <Button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de registros</CardDescription>
              <CardTitle className="text-2xl">{filtered.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Valor inicial acumulado</CardDescription>
              <CardTitle className="text-2xl font-mono">
                {formatCurrency(totalValue)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Terceros únicos</CardDescription>
              <CardTitle className="text-2xl">
                {new Set(filtered.map((r) => r.TERCERO)).size}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Registros importados
              </CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por contrato, tercero, CDP, RP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OID</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>RP</TableHead>
                    <TableHead>CDP</TableHead>
                    <TableHead>Tercero</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Valor Inicial</TableHead>
                    <TableHead className="text-right">Saldo RP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.OID} className="hover:bg-muted/50">
                        <TableCell className="font-bold text-primary">
                          #{r.OID}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.CONTRATO || "-"}
                        </TableCell>
                        <TableCell>{r.RP ?? "-"}</TableCell>
                        <TableCell>{r.CDP || "-"}</TableCell>
                        <TableCell className="font-mono">
                          {r.TERCERO || "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {r.DESCRIP_TERCERO || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {r.VALOR_INICIAL
                            ? formatCurrency(parseFloat(r.VALOR_INICIAL))
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {r["SALDO RP"]
                            ? formatCurrency(parseFloat(r["SALDO RP"]))
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filtered.length === 1000 && (
              <p className="text-xs text-muted-foreground mt-2">
                Mostrando los primeros 1000 registros. Refina la búsqueda para
                ver más.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}