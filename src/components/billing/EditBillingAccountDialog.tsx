import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, RefreshCw, FileText, X, Download } from "lucide-react";
import { formatCurrency, formatCurrencyInput } from "@/lib/utils";
import SignatureCanvas from "react-signature-canvas";
import { BillingCompletionProgress } from "./BillingCompletionProgress";

interface EditBillingAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingAccount: any;
  onSuccess: () => void;
}

export function EditBillingAccountDialog({
  open,
  onOpenChange,
  billingAccount,
  onSuccess
}: EditBillingAccountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    billing_month: '',
    billing_start_date: '',
    billing_end_date: '',
    notes: '',
    planilla_numero: '',
    planilla_valor: '',
    planilla_fecha: ''
  });
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const [planillaFile, setPlanillaFile] = useState<File | null>(null);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [existingPlanillaUrl, setExistingPlanillaUrl] = useState<string | null>(null);
  const [existingPlanillaName, setExistingPlanillaName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (billingAccount && open) {
      setFormData({
        amount: billingAccount.amount?.toString() || '',
        billing_month: billingAccount.billing_month || '',
        billing_start_date: billingAccount.billing_start_date || '',
        billing_end_date: billingAccount.billing_end_date || '',
        notes: billingAccount.notes || '',
        planilla_numero: billingAccount.planilla_numero || '',
        planilla_valor: billingAccount.planilla_valor?.toString() || '',
        planilla_fecha: billingAccount.planilla_fecha || ''
      });
      // Reset file state
      setPlanillaFile(null);
      // Load activities count
      loadActivitiesCount(billingAccount.id);
      // Load existing planilla URL
      loadExistingPlanillaUrl(billingAccount.planilla_file_url);
    }
  }, [billingAccount, open]);

  const loadExistingPlanillaUrl = async (filePath: string | null) => {
    if (!filePath) {
      setExistingPlanillaUrl(null);
      setExistingPlanillaName(null);
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('billing-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      setExistingPlanillaUrl(data?.signedUrl || null);
      setExistingPlanillaName(filePath.split('/').pop() || 'planilla.pdf');
    } catch (error) {
      console.error('Error loading planilla URL:', error);
      setExistingPlanillaUrl(null);
    }
  };

  const loadActivitiesCount = async (billingAccountId: string) => {
    try {
      const { count, error } = await supabase
        .from('billing_activities')
        .select('*', { count: 'exact', head: true })
        .eq('billing_account_id', billingAccountId);
      
      if (!error) {
        setActivitiesCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading activities count:', error);
    }
  };

  const hasSignature = !!(signatureRef && !signatureRef.isEmpty()) || !!billingAccount?.firma_url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!billingAccount?.id) return;
    
    try {
      setLoading(true);

      // Validate that billing account is in draft status
      if (billingAccount.status !== 'draft') {
        toast({
          title: "Error",
          description: "Solo se pueden editar cuentas en estado borrador",
          variant: "destructive"
        });
        return;
      }

      // Upload signature if present
      let firmaUrl = billingAccount.firma_url;
      if (signatureRef && !signatureRef.isEmpty()) {
        const signatureBlob = await new Promise<Blob>((resolve) => {
          signatureRef.getCanvas().toBlob(resolve as any, 'image/png');
        });
        
        const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });
        const signaturePath = `${billingAccount.id}/signature.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('billing-signatures')
          .upload(signaturePath, signatureFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        firmaUrl = uploadData.path;
      }

      // Upload planilla file if present
      let planillaFileUrl = billingAccount.planilla_file_url;
      if (planillaFile) {
        const planillaPath = `${billingAccount.id}/planilla.${planillaFile.name.split('.').pop()}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('billing-documents')
          .upload(planillaPath, planillaFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        planillaFileUrl = uploadData.path;
      }

      const { error } = await supabase
        .from('billing_accounts')
        .update({
          amount: parseFloat(formData.amount),
          billing_month: formData.billing_month,
          billing_start_date: formData.billing_start_date || null,
          billing_end_date: formData.billing_end_date || null,
          notes: formData.notes,
          planilla_numero: formData.planilla_numero || null,
          planilla_valor: formData.planilla_valor ? parseFloat(formData.planilla_valor) : null,
          planilla_fecha: formData.planilla_fecha || null,
          planilla_file_url: planillaFileUrl,
          firma_url: firmaUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', billingAccount.id);

      if (error) {
        console.error('Error updating billing account:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Cuenta de cobro actualizada correctamente"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al actualizar la cuenta: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cuenta de Cobro</DialogTitle>
        </DialogHeader>

        <BillingCompletionProgress
          contractId={billingAccount?.contract_id || null}
          amount={formData.amount}
          billingStartDate={formData.billing_start_date}
          billingEndDate={formData.billing_end_date}
          activitiesCount={activitiesCount}
          planillaNumero={formData.planilla_numero}
          planillaValor={formData.planilla_valor}
          planillaFecha={formData.planilla_fecha}
          planillaFile={planillaFile || billingAccount?.planilla_file_url}
          hasSignature={hasSignature}
        />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="text"
              value={formData.amount ? formatCurrencyInput(formData.amount) : ''}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^\d]/g, '');
                setFormData(prev => ({ ...prev, amount: numericValue }));
              }}
              placeholder="$ 0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_month">Mes de Facturación *</Label>
            <Input
              id="billing_month"
              type="date"
              value={formData.billing_month}
              onChange={(e) => setFormData(prev => ({ ...prev, billing_month: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_start_date">Fecha Inicio</Label>
              <Input
                id="billing_start_date"
                type="date"
                value={formData.billing_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, billing_start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_end_date">Fecha Fin</Label>
              <Input
                id="billing_end_date"
                type="date"
                value={formData.billing_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, billing_end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Planilla de Seguridad Social</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planilla_numero">Número de Planilla</Label>
                <Input
                  id="planilla_numero"
                  value={formData.planilla_numero}
                  onChange={(e) => setFormData(prev => ({ ...prev, planilla_numero: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planilla_valor">Valor Pagado</Label>
                <Input
                  id="planilla_valor"
                  type="text"
                  value={formData.planilla_valor ? formatCurrencyInput(formData.planilla_valor) : ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    setFormData(prev => ({ ...prev, planilla_valor: numericValue }));
                  }}
                  placeholder="$ 0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planilla_fecha">Fecha de Pago</Label>
              <Input
                id="planilla_fecha"
                type="date"
                value={formData.planilla_fecha}
                onChange={(e) => setFormData(prev => ({ ...prev, planilla_fecha: e.target.value }))}
              />
            </div>
              
            <div className="space-y-2">
              <Label>Archivo de Planilla</Label>
              
              {/* Input oculto para seleccionar archivo */}
              <Input
                ref={fileInputRef}
                id="planilla_file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setPlanillaFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              {/* Si hay archivo existente y NO hay nuevo archivo seleccionado */}
              {existingPlanillaUrl && !planillaFile ? (
                <div className="border rounded-lg p-3 bg-muted/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {existingPlanillaName}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(existingPlanillaUrl, '_blank')}
                        title="Ver archivo"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = existingPlanillaUrl;
                          link.download = existingPlanillaName || 'planilla.pdf';
                          link.click();
                        }}
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        title="Cambiar archivo"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <span>✓</span> Archivo subido correctamente
                  </p>
                </div>
              ) : planillaFile ? (
                /* Nuevo archivo seleccionado (pendiente de guardar) */
                <div className="border rounded-lg p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                      <span className="text-sm font-medium truncate">{planillaFile.name}</span>
                      <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">
                        Pendiente
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPlanillaFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      title="Cancelar cambio"
                      className="text-amber-600 hover:text-amber-700 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    ℹ️ {existingPlanillaUrl ? 'Este archivo reemplazará al anterior cuando guardes los cambios' : 'El archivo se subirá cuando guardes los cambios'}
                  </p>
                </div>
              ) : (
                /* No hay archivo */
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clic para seleccionar archivo PDF
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, JPG, PNG
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Firma del Contratista</h3>
            <div className="border rounded-lg p-4">
              <SignatureCanvas
                ref={(ref) => setSignatureRef(ref)}
                canvasProps={{
                  className: 'signature-canvas border rounded w-full h-32',
                  width: 400,
                  height: 128
                }}
              />
              <div className="flex justify-between mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signatureRef?.clear()}
                >
                  Limpiar
                </Button>
                <span className="text-sm text-muted-foreground">
                  Dibuje su firma en el recuadro
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}