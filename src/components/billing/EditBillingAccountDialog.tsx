import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { formatCurrency, formatCurrencyInput } from "@/lib/utils";
import SignatureCanvas from "react-signature-canvas";

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
    }
  }, [billingAccount, open]);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cuenta de Cobro</DialogTitle>
        </DialogHeader>
        
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

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="planilla_file">Archivo de Planilla</Label>
                <Input
                  id="planilla_file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setPlanillaFile(e.target.files?.[0] || null)}
                />
              </div>
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