import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, CheckCircle, XCircle, Calendar, DollarSign, FileText, MessageCircle, Plus, Trash2 } from "lucide-react";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { BillingDocumentPreview } from "@/components/billing/BillingDocumentPreview";
import { CertificationPreview } from "@/components/billing/CertificationPreview";
import { InvoicePreview } from "@/components/billing/InvoicePreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BillingReviewListProps {
  userProfile: any;
  userRole: string;
  onCountChange?: (count: number) => void;
}

export function BillingReviewList({ userProfile, userRole, onCountChange }: BillingReviewListProps) {
  const { toast } = useToast();
  const [billingAccounts, setBillingAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBilling, setPreviewBilling] = useState<any>(null);
  const [observations, setObservations] = useState<Array<{ documentType: string; comment: string }>>([{ documentType: '', comment: '' }]);

  useEffect(() => {
    loadPendingBillingAccounts();
  }, []);

  const loadPendingBillingAccounts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('billing_accounts')
        .select(`
          *,
          contracts(contract_number, contract_number_original, total_amount, client_profile_id, profiles:client_profile_id(name))
        `)
        .eq('status', 'pendiente_revision')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load creators' profiles to show contractor name/email
      const creatorIds = Array.from(new Set((data || []).map((d: any) => d.created_by).filter(Boolean)));
      let withProfiles = data || [];
      if (creatorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', creatorIds);
        if (profilesError) throw profilesError;
        const map = Object.fromEntries((profilesData || []).map((p: any) => [p.id, p]));
        withProfiles = (data || []).map((d: any) => ({ ...d, created_by_profile: map[d.created_by] }));
      }

      setBillingAccounts(withProfiles);
      onCountChange?.(withProfiles.length || 0);
    } catch (error: any) {
      console.error('Error loading pending billing accounts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas pendientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const handleReview = (billing: any, action: 'approve' | 'reject') => {
    setSelectedBilling(billing);
    setReviewAction(action);
    setComments('');
    setObservations([{ documentType: '', comment: '' }]);
  };

  const addObservation = () => {
    setObservations(prev => [...prev, { documentType: '', comment: '' }]);
  };

  const removeObservation = (index: number) => {
    setObservations(prev => prev.filter((_, i) => i !== index));
  };

  const updateObservation = (index: number, field: 'documentType' | 'comment', value: string) => {
    setObservations(prev => prev.map((obs, i) => i === index ? { ...obs, [field]: value } : obs));
  };

  const handlePreview = async (billing: any) => {
    try {
      // Load full billing data
      const { data: fullBilling, error } = await supabase
        .from('billing_accounts')
        .select(`
          *,
          contracts(
            contract_number,
            contract_number_original,
            client_profile_id,
            profiles:client_profile_id(name, document_number, email, phone, address, bank_account, bank_name, document_issue_city, nit, tax_regime, signature_url),
            total_amount,
            start_date,
            end_date,
            description,
            cdp,
            rp,
            fecha_rp,
            budget_code,
            addition_number,
            addition_cdp,
            addition_rp,
            addition_amount,
            execution_period_months,
            execution_period_days
          )
        `)
        .eq('id', billing.id)
        .single();

      if (error) throw error;

      // Load activities separately
      const { data: activities, error: activitiesError } = await supabase
        .from('billing_activities')
        .select('id, activity_name, actions_developed')
        .eq('billing_account_id', billing.id);

      if (activitiesError) {
        console.error('Error loading activities:', activitiesError);
      }

      // Load creator profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', fullBilling.created_by)
        .single();

      // Load review comments
      const { data: reviewComments, error: reviewsError } = await supabase
        .from('billing_reviews')
        .select(`
          action,
          comments,
          created_at,
          reviewer:profiles!billing_reviews_reviewer_id_fkey(name)
        `)
        .eq('billing_account_id', billing.id)
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;
      if (reviewsError) {
        console.error('Error loading review comments:', reviewsError);
      }

      // Transform activities to match the expected interface
      const transformedActivities = (activities || []).map((activity: any) => ({
        activityName: activity.activity_name,
        actions: activity.actions_developed,
        evidences: [] // No evidences for now
      }));

      setPreviewBilling({
        ...fullBilling,
        created_by_profile: profile,
        transformedActivities,
        reviewComments: reviewComments || []
      });
      setShowPreview(true);
    } catch (error: any) {
      console.error('Error loading billing preview:', error);
      toast({
        title: "Error",
        description: `Error al cargar la vista previa: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const submitReview = async () => {
    if (!selectedBilling || !reviewAction) return;

    // Validate observations for rejection
    if (reviewAction === 'reject') {
      const validObs = observations.filter(o => o.documentType && o.comment.trim());
      if (validObs.length === 0) {
        toast({
          title: "Error",
          description: "Debe agregar al menos una observación con documento y comentario",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setSubmitting(true);

      // Build combined comment from all observations
      let fullComment: string | null = null;
      if (reviewAction === 'reject') {
        const validObs = observations.filter(o => o.documentType && o.comment.trim());
        fullComment = validObs.map(o => `[${o.documentType}] ${o.comment.trim()}`).join('\n');
      } else {
        fullComment = comments.trim() || null;
      }

      const updates: any = {
        status: reviewAction === 'approve' ? 'aprobada' : 'rechazada',
        comentario_supervisor: fullComment
      };

      const { error: updateError } = await supabase
        .from('billing_accounts')
        .update(updates)
        .eq('id', selectedBilling.id);

      if (updateError) throw updateError;

      // Create review record
      const decisionValue = reviewAction === 'approve' ? 'aprobada' : 'rechazada';
      const actionValue = reviewAction === 'approve' ? 'approved' : 'rejected';
      const reviewData = {
        billing_account_id: selectedBilling.id,
        reviewer_id: userProfile.id,
        action: actionValue,
        comments: fullComment,
        decision: decisionValue,
        comentario: fullComment
      };

      const { error: reviewError } = await supabase
        .from('billing_reviews')
        .insert(reviewData);

      if (reviewError) throw reviewError;

      toast({
        title: "Éxito",
        description: `Cuenta de cobro ${reviewAction === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`,
      });

      // Refresh the list
      loadPendingBillingAccounts();
      
      // Close dialog
      setSelectedBilling(null);
      setReviewAction(null);
      setComments('');
      setObservations([{ documentType: '', comment: '' }]);

    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la revisión",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando cuentas pendientes...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (billingAccounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Cuentas Pendientes de Revisión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay cuentas de cobro pendientes de revisión
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Cuentas Pendientes de Revisión
            <Badge variant="outline" className="ml-auto">
              {billingAccounts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Contratista</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Fecha Envío</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingAccounts.map((billing) => (
                  <TableRow key={billing.id}>
                    <TableCell className="font-medium">
                      {billing.account_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{billing.contracts?.contract_number_original || billing.contracts?.contract_number}</p>
                        <p className="text-sm text-muted-foreground">{billing.contracts?.profiles?.name || billing.created_by_profile?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{billing.created_by_profile?.name}</p>
                        <p className="text-sm text-muted-foreground">{billing.created_by_profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatMonth(billing.billing_month)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatCurrency(billing.amount)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(billing.enviado_el || billing.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Ver vista previa"
                          onClick={() => handlePreview(billing)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(billing, 'approve')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(billing, 'reject')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Devolver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog 
        open={!!selectedBilling && !!reviewAction} 
        onOpenChange={(open) => {
           if (!open) {
            setSelectedBilling(null);
            setReviewAction(null);
            setComments('');
            setObservations([{ documentType: '', comment: '' }]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {reviewAction === 'approve' ? 'Aprobar' : 'Devolver'} Cuenta de Cobro
            </DialogTitle>
            <DialogDescription>
              {selectedBilling && (
                <>
                  Cuenta: {selectedBilling.account_number} - {formatCurrency(selectedBilling.amount)}
                  <br />
                  Contrato: {selectedBilling.contracts?.contract_number_original || selectedBilling.contracts?.contract_number}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === 'reject' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Observaciones por documento *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addObservation}
                    disabled={observations.length >= 3}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar observación
                  </Button>
                </div>
                {observations.map((obs, index) => (
                  <div key={index} className="border rounded-md p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select value={obs.documentType} onValueChange={(val) => updateObservation(index, 'documentType', val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el documento..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INFORME">Informe de Actividades</SelectItem>
                            <SelectItem value="CERTIFICACIÓN">Certificación</SelectItem>
                            <SelectItem value="CUENTA DE COBRO">Cuenta de Cobro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {observations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeObservation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder="Detalle la observación..."
                      value={obs.comment}
                      onChange={(e) => updateObservation(index, 'comment', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Label htmlFor="comments">Comentarios (opcional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Agregue comentarios si es necesario..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBilling(null);
                  setReviewAction(null);
                  setComments('');
                  setObservations([{ documentType: '', comment: '' }]);
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={submitReview}
                disabled={submitting || (reviewAction === 'reject' && observations.filter(o => o.documentType && o.comment.trim()).length === 0)}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {submitting ? 'Procesando...' : (reviewAction === 'approve' ? 'Aprobar' : 'Devolver')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa - Documentos de la Cuenta de Cobro</DialogTitle>
          </DialogHeader>
          {previewBilling && (
            <Tabs defaultValue="informe" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="informe">Informe de Actividades</TabsTrigger>
                <TabsTrigger value="certificacion">Certificación</TabsTrigger>
                <TabsTrigger value="cuenta">Cuenta de Cobro</TabsTrigger>
              </TabsList>
              <TabsContent value="informe">
                <BillingDocumentPreview
                  userProfile={previewBilling.created_by_profile}
                  selectedContract={previewBilling.contracts}
                  startDate={previewBilling.billing_start_date ? parseLocalDate(previewBilling.billing_start_date) : new Date()}
                  endDate={previewBilling.billing_end_date ? parseLocalDate(previewBilling.billing_end_date) : new Date()}
                  activities={previewBilling.transformedActivities || []}
                  amount={previewBilling.amount.toString()}
                  reviewComments={previewBilling.reviewComments}
                  saludNumero={previewBilling.salud_planilla_numero}
                  saludValor={previewBilling.salud_planilla_valor?.toString()}
                  saludFecha={previewBilling.salud_planilla_fecha}
                  pensionNumero={previewBilling.pension_planilla_numero}
                  pensionValor={previewBilling.pension_planilla_valor?.toString()}
                  pensionFecha={previewBilling.pension_planilla_fecha}
                  arlNumero={previewBilling.arl_planilla_numero}
                  arlValor={previewBilling.arl_planilla_valor?.toString()}
                  arlFecha={previewBilling.arl_planilla_fecha}
                />
              </TabsContent>
              <TabsContent value="certificacion">
                <CertificationPreview
                  contractDetails={previewBilling.contracts}
                  userProfile={previewBilling.created_by_profile}
                  startDate={previewBilling.billing_start_date ? parseLocalDate(previewBilling.billing_start_date) : undefined}
                  endDate={previewBilling.billing_end_date ? parseLocalDate(previewBilling.billing_end_date) : undefined}
                  amount={previewBilling.amount.toString()}
                  novedades={previewBilling.novedades || ''}
                  certificationDate={previewBilling.certification_date || ''}
                  supervisorName={previewBilling.created_by_profile?.name}
                  valorEjecutadoAntes={previewBilling.valor_ejecutado_antes?.toString() || '0'}
                  riskMatrixCompliance={previewBilling.risk_matrix_compliance || false}
                  socialSecurityVerified={previewBilling.social_security_verified || true}
                  anexosLista={previewBilling.anexos_lista || ''}
                  activities={previewBilling.transformedActivities || []}
                  certificationMonth={previewBilling.certification_month || ''}
                  reportDeliveryDate={previewBilling.report_delivery_date || ''}
                />
              </TabsContent>
              <TabsContent value="cuenta">
                <InvoicePreview
                  contractDetails={previewBilling.contracts}
                  userProfile={previewBilling.created_by_profile}
                  amount={previewBilling.amount.toString()}
                  invoiceNumber={previewBilling.invoice_number || ''}
                  invoiceCity={previewBilling.invoice_city || ''}
                  invoiceDate={previewBilling.invoice_date || ''}
                  amountInWords={previewBilling.amount_in_words || ''}
                  declarationSingleEmployer={previewBilling.declaration_single_employer ?? true}
                  declaration80PercentIncome={previewBilling.declaration_80_percent_income ?? true}
                  benefitPrepaidHealth={previewBilling.benefit_prepaid_health ?? false}
                  benefitVoluntaryPension={previewBilling.benefit_voluntary_pension ?? false}
                  benefitHousingInterest={previewBilling.benefit_housing_interest ?? false}
                  benefitHealthContributions={previewBilling.benefit_health_contributions ?? true}
                  benefitEconomicDependents={previewBilling.benefit_economic_dependents ?? false}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}