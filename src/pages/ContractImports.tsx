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
import { Database, Search, Download, FileSpreadsheet, Plus, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ALLOWED_ROLES = ["super_admin", "admin", "juridica"];

export default function ContractImports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) {
      start = 2;
      end = 4;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }
    if (start > 2) pages.push("ellipsis");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filtered.length);

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
                Contratos
              </h1>
              <p className="text-muted-foreground">
                Listado maestro de contratos. Crea, consulta y edita los registros.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => navigate("/contract-imports/new")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Contrato
            </Button>
          </div>
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
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((r) => (
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/contract-imports/${r.OID}/edit`)
                            }
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                <span className="font-medium text-foreground">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                de{" "}
                <span className="font-medium text-foreground">
                  {filtered.length}
                </span>{" "}
                registros
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filas por página:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="w-[80px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(currentPage - 1);
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                      {pageNumbers.map((p, idx) =>
                        p === "ellipsis" ? (
                          <PaginationItem key={`e-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={p === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                goToPage(p);
                              }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(currentPage + 1);
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>

            {rows.length === 1000 && (
              <p className="text-xs text-muted-foreground mt-2">
                Cargados los primeros 1000 registros del servidor. Refina la búsqueda para
                ver más.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}