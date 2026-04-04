import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, User } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ContractStateActions } from "@/components/contracts/ContractStateActions";
import { ContractStateHistory } from "@/components/contracts/ContractStateHistory";

export default function SupervisorContractReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    contract_number: '',
    contract_type: '',
    status: '',
    total_amount: '',
    start_date: '',
    end_date: '',
    description: '',
    cdp: '',
    rp: ''
  });
  const [contractData, setContractData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [calculatedPeriod, setCalculatedPeriod] = useState({ months: 0, days: 0 });
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (isMounted) navigate('/auth'); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*, roles!profiles_role_id_fkey(name)')
          .eq('user_id', user.id)
          .maybeSingle();

        const roleName = (profile as any)?.roles?.name;
        if (isMounted) {
          if (typeof roleName !== 'string') {
            console.error('Could not resolve role for supervisor review');
            navigate('/auth');
            return;
          }
          const resolved = roleName;
          // Only supervisor should be here
          if (resolved !== 'supervisor') {
            if (resolved === 'employee') {
              navigate(`/contracts/${id}/edit`, { replace: true });
            } else {
              navigate(`/contracts/${id}`, { replace: true });
            }
            return;
          }
          setUserRole(resolved);
        }
      } catch {
        if (isMounted) navigate('/auth');
      }
    };
    fetchRole();
    return () => { isMounted = false; };
  }, [id, navigate]);

  useEffect(() => {
    if (id && userRole === 'supervisor') loadContract(id);
  }, [id, userRole]);

  const loadContract = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:profiles!client_profile_id(
            name, email, phone, address, document_number, bank_name, bank_account
          )
        `)
        .eq('id', contractId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: "Error", description: "Contrato no encontrado", variant: "destructive" });
        navigate('/contracts');
        return;
      }

      setFormData({
        contract_number: data.contract_number || '',
        contract_type: data.contract_type || '',
        status: data.estado || '',
        total_amount: data.total_amount?.toString() || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        description: data.description || '',
        cdp: (data as any).cdp || '',
        rp: (data as any).rp || ''
      });
      setContractData(data);
      setClientData(data.client);

      if (data.signed_contract_path) {
        const { data: urlData } = await supabase.storage
          .from('contracts')
          .createSignedUrl(data.signed_contract_path, 3600);
        if (urlData?.signedUrl) setCurrentPdfUrl(urlData.signedUrl);
      }
    } catch (error: any) {
      console.error('Error loading contract:', error);
      toast({ title: "Error", description: "No se pudo cargar el contrato", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date + 'T00:00:00');
      const end = new Date(formData.end_date + 'T00:00:00');
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setCalculatedPeriod({ months: Math.floor(diffDays / 30), days: diffDays });
    }
  }, [formData.start_date, formData.end_date]);

  if (loading || userRole === null) {
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
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/contracts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Revisión de Contrato</h1>
              <p className="text-muted-foreground">{formData.contract_number}</p>
            </div>
          </div>
          {contractData && userRole && (
            <ContractStateActions
              contract={contractData}
              userRole={userRole}
              onStateChange={() => id && loadContract(id)}
            />
          )}
        </div>

        {/* Form - all fields disabled */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contract_number">Número de Contrato</Label>
                  <Input id="contract_number" value={formData.contract_number} disabled />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cdp">CDP</Label>
                    <Input id="cdp" value={formData.cdp} disabled placeholder="Sin CDP" />
                  </div>
                  <div>
                    <Label htmlFor="rp">RP</Label>
                    <Input id="rp" value={formData.rp} disabled placeholder="Sin RP" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contract_type">Tipo de Contrato</Label>
                  <Select value={formData.contract_type} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
                      <SelectItem value="variable_amount">Monto Variable</SelectItem>
                      <SelectItem value="company_contract">Contrato Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descripción / Objeto del Contrato</Label>
                  <Textarea id="description" value={formData.description} rows={3} disabled />
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente / Contratista
                  </Label>
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-70 cursor-not-allowed">
                    <span className="line-clamp-1">{clientData?.name || 'No asignado'}</span>
                  </div>
                  <Alert>
                    <AlertDescription className="text-sm">
                      <div className="space-y-1">
                        <p><strong>Nombre:</strong> {clientData?.name || 'No asignado'}</p>
                        <p><strong>Documento:</strong> {clientData?.document_number || 'N/A'}</p>
                        <p><strong>Email:</strong> {clientData?.email || 'N/A'}</p>
                        {clientData?.phone && (
                          <p><strong>Teléfono:</strong> {clientData.phone}</p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Financial and Dates */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Información Financiera y Fechas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="total_amount">Valor Total (en millones)</Label>
                    <Input id="total_amount" type="number" value={formData.total_amount} disabled />
                  </div>
                  <div>
                    <Label htmlFor="start_date">Fecha de Inicio</Label>
                    <Input id="start_date" type="date" value={formData.start_date} disabled />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Fecha de Fin</Label>
                    <Input id="end_date" type="date" value={formData.end_date} disabled />
                  </div>

                  {formData.start_date && formData.end_date && (
                    <div className="md:col-span-3">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm font-medium">
                          📅 Plazo de Ejecución Calculado:
                          <span className="ml-2 font-bold text-primary">
                            {calculatedPeriod.months} meses ({calculatedPeriod.days} días)
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documento del Contrato */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contrato Firmado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentPdfUrl ? (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">Contrato actual</p>
                          <p className="text-xs text-muted-foreground">PDF del contrato firmado</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(currentPdfUrl, '_blank')}
                      >
                        Ver PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No se ha subido contrato firmado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions - solo Volver */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/contracts')}
            >
              Volver
            </Button>
          </div>
        </div>

        {/* Historial de Estados */}
        {id && <ContractStateHistory contractId={id} />}
      </div>
    </Layout>
  );
}
