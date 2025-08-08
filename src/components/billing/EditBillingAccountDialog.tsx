import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

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
    notes: ''
  });

  useEffect(() => {
    if (billingAccount && open) {
      setFormData({
        amount: billingAccount.amount?.toString() || '',
        billing_month: billingAccount.billing_month || '',
        billing_start_date: billingAccount.billing_start_date || '',
        billing_end_date: billingAccount.billing_end_date || '',
        notes: billingAccount.notes || ''
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

      const { error } = await supabase
        .from('billing_accounts')
        .update({
          amount: parseFloat(formData.amount),
          billing_month: formData.billing_month,
          billing_start_date: formData.billing_start_date || null,
          billing_end_date: formData.billing_end_date || null,
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
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
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