import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillingAccountStatusBadge } from "@/components/billing/BillingAccountStatusBadge";
import { Eye, Search, FileText, FileCheck, Receipt, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AllBillingAccounts() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('roles!profiles_role_id_fkey(name)')
        .eq('user_id', user.id)
        .maybeSingle();
      const role = (profile as any)?.roles?.name;
      if (role !== 'super_admin') {
        toast({ title: 'Acceso restringido', description: 'Solo Super Administradores', variant: 'destructive' });
        navigate('/', { replace: true });
        return;
      }
      setAuthorized(true);
      await loadAccounts();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('billing_accounts')
        .select(`
          id, oid, account_number, status, amount, billing_month, enviado_el, created_at,
          informe_complete, certificacion_complete, cuenta_cobro_complete,
          contract_id, created_by, reviewed_by,
          contracts:contract_id(id, contract_number, contract_number_original, area_responsable),
          creator:created_by(id, name, email, document_number, proceso_id),
          reviewer:reviewed_by(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      setAccounts(data || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'No se pudieron cargar las cuentas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let rows = accounts;
    if (filterParam === 'stuck') {
      const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000;
      rows = rows.filter(r => r.status === 'pendiente_revision' && r.enviado_el && new Date(r.enviado_el).getTime() < cutoff);
    }
    if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      rows = rows.filter(r =>
        r.account_number?.toLowerCase().includes(q) ||
        r.creator?.name?.toLowerCase().includes(q) ||
        r.creator?.email?.toLowerCase().includes(q) ||
        r.creator?.document_number?.toLowerCase().includes(q) ||
        r.contracts?.contract_number?.toLowerCase().includes(q) ||
        r.contracts?.contract_number_original?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [accounts, statusFilter, search, filterParam]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize, filterParam]);

  if (!authorized) return <Layout><div className="container mx-auto px-4 py-8">Cargando...</div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Consulta Global de Cuentas de Cobro</h1>
          <p className="text-muted-foreground">Vista solo lectura para auditoría y soporte</p>
        </div>

        {filterParam === 'stuck' && (
          <Card className="border-destructive">
            <CardContent className="pt-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Mostrando solo cuentas atascadas más de 15 días en revisión.</span>
              <Button variant="link" size="sm" onClick={() => navigate('/billing/all')}>Quitar filtro</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Cuentas de cobro ({filtered.length})</CardTitle>
            <CardDescription>Total en el sistema: {accounts.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por número, contratista, documento o contrato..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="pendiente_revision">Pendiente revisión</SelectItem>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                  <SelectItem value="causada">Causada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-full md:w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n} / pág</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Cargando...</div>
            ) : paged.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Sin resultados</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>N° Cuenta</TableHead>
                      <TableHead>Contratista</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Mes</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Documentos</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.oid}</TableCell>
                        <TableCell className="font-medium">{r.account_number}</TableCell>
                        <TableCell>
                          <div className="text-sm">{r.creator?.name || '—'}</div>
                          <div className="text-xs text-muted-foreground">{r.creator?.document_number || ''}</div>
                        </TableCell>
                        <TableCell className="text-sm">{r.contracts?.contract_number_original || r.contracts?.contract_number || '—'}</TableCell>
                        <TableCell className="text-sm">{r.billing_month ? format(parseLocalDate(r.billing_month) || new Date(), 'MMM yyyy', { locale: es }) : '—'}</TableCell>
                        <TableCell className="font-mono text-sm">{formatCurrency(Number(r.amount) || 0)}</TableCell>
                        <TableCell><BillingAccountStatusBadge status={r.status} /></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={r.informe_complete ? 'default' : 'secondary'} title="Informe">I</Badge>
                            <Badge variant={r.certificacion_complete ? 'default' : 'secondary'} title="Certificación">C</Badge>
                            <Badge variant={r.cuenta_cobro_complete ? 'default' : 'secondary'} title="Cuenta de Cobro">CC</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setSelected(r)}>
                            <Eye className="h-4 w-4 mr-1" /> Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginación */}
            {filtered.length > pageSize && (
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Página {currentPage} de {totalPages}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalle */}
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalle de cuenta {selected?.account_number}</DialogTitle>
              <DialogDescription>Vista solo lectura para auditoría</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Contratista:</span> <strong>{selected.creator?.name}</strong></div>
                  <div><span className="text-muted-foreground">Documento:</span> {selected.creator?.document_number || '—'}</div>
                  <div><span className="text-muted-foreground">Email:</span> {selected.creator?.email}</div>
                  <div><span className="text-muted-foreground">Contrato:</span> {selected.contracts?.contract_number_original || selected.contracts?.contract_number}</div>
                  <div><span className="text-muted-foreground">Área:</span> {selected.contracts?.area_responsable || '—'}</div>
                  <div><span className="text-muted-foreground">Monto:</span> <strong>{formatCurrency(Number(selected.amount) || 0)}</strong></div>
                  <div><span className="text-muted-foreground">Mes facturado:</span> {selected.billing_month ? format(parseLocalDate(selected.billing_month) || new Date(), 'MMMM yyyy', { locale: es }) : '—'}</div>
                  <div><span className="text-muted-foreground">Estado:</span> <BillingAccountStatusBadge status={selected.status} /></div>
                  <div><span className="text-muted-foreground">Enviada:</span> {selected.enviado_el ? format(new Date(selected.enviado_el), 'dd MMM yyyy HH:mm', { locale: es }) : '—'}</div>
                  <div><span className="text-muted-foreground">Revisor:</span> {selected.reviewer?.name || '—'}</div>
                </div>

                <div className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium text-sm">Estado de los 3 documentos</div>
                  <div className="grid grid-cols-3 gap-2">
                    <DocFlag label="Informe" icon={FileText} ok={!!selected.informe_complete} />
                    <DocFlag label="Certificación" icon={FileCheck} ok={!!selected.certificacion_complete} />
                    <DocFlag label="Cuenta de Cobro" icon={Receipt} ok={!!selected.cuenta_cobro_complete} />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Para visualizar los PDF generados, abre la cuenta como el contratista responsable o solicita al supervisor del proceso compartir el documento.
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function DocFlag({ label, icon: Icon, ok }: { label: string; icon: any; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm flex-1">{label}</span>
      {ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}