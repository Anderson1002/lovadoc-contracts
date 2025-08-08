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
import { Eye, CheckCircle, XCircle, Calendar, DollarSign, FileText, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
          contracts(contract_number, client_name, total_amount),
          profiles!billing_accounts_created_by_fkey(name, email)
        `)
        .eq('status', 'pendiente_revision')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBillingAccounts(data || []);
      onCountChange?.(data?.length || 0);
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
  };

  const submitReview = async () => {
    if (!selectedBilling || !reviewAction) return;

    // Validate comments for rejection
    if (reviewAction === 'reject' && !comments.trim()) {
      toast({
        title: "Error",
        description: "Debe agregar un comentario al rechazar una cuenta de cobro",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      // Update billing account status (solo estado y comentario_supervisor)
      const updates: any = {
        status: reviewAction === 'approve' ? 'aprobada' : 'rechazada',
        comentario_supervisor: comments.trim() || null
      };

      const { error: updateError } = await supabase
        .from('billing_accounts')
        .update(updates)
        .eq('id', selectedBilling.id);

      if (updateError) throw updateError;

      // Create review record
      const decisionValue = reviewAction === 'approve' ? 'aprobada' : 'rechazada';
      const { error: reviewError } = await supabase
        .from('billing_reviews')
        .insert({
          billing_account_id: selectedBilling.id,
          reviewer_id: userProfile.id,
          action: reviewAction,
          comments: comments.trim() || null,
          decision: decisionValue,
          comentario: comments.trim() || null
        });

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
                        <p className="font-medium">{billing.contracts?.contract_number}</p>
                        <p className="text-sm text-muted-foreground">{billing.contracts?.client_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{billing.profiles?.name}</p>
                        <p className="text-sm text-muted-foreground">{billing.profiles?.email}</p>
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
                          title="Ver documentos"
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
                          Rechazar
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
              {reviewAction === 'approve' ? 'Aprobar' : 'Rechazar'} Cuenta de Cobro
            </DialogTitle>
            <DialogDescription>
              {selectedBilling && (
                <>
                  Cuenta: {selectedBilling.account_number} - {formatCurrency(selectedBilling.amount)}
                  <br />
                  Contrato: {selectedBilling.contracts?.contract_number}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="comments">
                {reviewAction === 'reject' ? 'Motivo del rechazo *' : 'Comentarios (opcional)'}
              </Label>
              <Textarea
                id="comments"
                placeholder={
                  reviewAction === 'reject' 
                    ? "Explique el motivo del rechazo..." 
                    : "Agregue comentarios si es necesario..."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required={reviewAction === 'reject'}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBilling(null);
                  setReviewAction(null);
                  setComments('');
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={submitReview}
                disabled={submitting || (reviewAction === 'reject' && !comments.trim())}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {submitting ? 'Procesando...' : (reviewAction === 'approve' ? 'Aprobar' : 'Rechazar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}