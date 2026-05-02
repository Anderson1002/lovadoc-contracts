import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function JuridicaDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("contract")
          .select("*")
          .order("OID", { ascending: false })
          .limit(1000);
        if (error) throw error;
        setRows(data || []);
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Error",
          description: "No se pudieron cargar los contratos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const totalRecords = rows.length;
  const totalValorInicial = rows.reduce(
    (s, r) => s + (parseFloat(r.VALOR_INICIAL) || 0),
    0
  );
  const totalSaldoRP = rows.reduce(
    (s, r) => s + (parseFloat(r["SALDO RP"]) || 0),
    0
  );
  const tercerosUnicos = new Set(rows.map((r) => r.TERCERO).filter(Boolean)).size;
  const ultimos = rows.slice(0, 5);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard Jurídica
            </h1>
            <p className="text-muted-foreground">
              Resumen del registro maestro de contratos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/contract-imports">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild>
            <Link to="/contract-imports/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contrato
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Total contratos</CardDescription>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRecords}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Valor inicial acumulado</CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalValorInicial)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Saldo RP acumulado</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalSaldoRP)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Terceros únicos</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tercerosUnicos}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos contratos registrados</CardTitle>
          <CardDescription>
            Los 5 registros más recientes de la tabla maestra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OID</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Tercero</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Valor Inicial</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aún no hay contratos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  ultimos.map((r) => (
                    <TableRow key={r.OID}>
                      <TableCell className="font-bold text-primary">
                        #{r.OID}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.CONTRATO || "-"}
                      </TableCell>
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/contract-imports/${r.OID}/edit`}>
                            Editar
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}