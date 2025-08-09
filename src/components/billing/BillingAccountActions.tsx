import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, Edit, Send, Trash2, Loader2, DollarSign, ArrowLeft } from "lucide-react";

interface BillingAccountActionsProps {
  billingAccount: any;
  userRole: string;
  userProfile: any;
  onEdit: () => void;
  onRefresh: () => void;
}

export function BillingAccountActions({
  billingAccount,
  userRole,
  userProfile,
  onEdit,
  onRefresh
}: BillingAccountActionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  const canEdit = () => {
    // Puede editar si: es dueño y estado = borrador o rechazada (admins también)
    const isOwner = billingAccount.created_by === userProfile?.id;
    const isAdmin = ['super_admin', 'admin'].includes(userRole);
    const editableStates = ['borrador', 'rechazada'];
    return (isOwner && editableStates.includes(billingAccount.status)) || isAdmin;
  };

  const canMarkAsPaid = () => {
    // Treasury puede marcar como causada si está aprobada
    return userRole === 'treasury' && billingAccount.status === 'aprobada';
  };

  const canReturnToSupervisor = () => {
    // Treasury puede devolver al supervisor si está aprobada
    return userRole === 'treasury' && billingAccount.status === 'aprobada';
  };

  const canDelete = () => {
    // Puede eliminar si: es dueño y estado = borrador (admins también)
    const isOwner = billingAccount.created_by === userProfile?.id;
    const isAdmin = ['super_admin', 'admin'].includes(userRole); // supervisor no elimina
    return (isOwner && billingAccount.status === 'borrador') || isAdmin;
  };

  const canSubmitForReview = () => {
    // Puede enviar si: es dueño y estado = borrador o rechazada
    const isOwner = billingAccount.created_by === userProfile?.id;
    const submittableStates = ['borrador', 'rechazada'];
    return isOwner && submittableStates.includes(billingAccount.status);
  };

  const handleSubmitForReview = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('billing_accounts')
        .update({
          status: 'pendiente_revision',
          updated_at: new Date().toISOString()
        })
        .eq('id', billingAccount.id);

      if (error) {
        console.error('Error submitting for review:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Cuenta de cobro enviada a revisión correctamente"
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al enviar a revisión: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowSubmitDialog(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      // First delete related billing activities
      const { error: activitiesError } = await supabase
        .from('billing_activities')
        .delete()
        .eq('billing_account_id', billingAccount.id);

      if (activitiesError) {
        console.error('Error deleting billing activities:', activitiesError);
        throw activitiesError;
      }

      // Then delete the billing account
      const { error } = await supabase
        .from('billing_accounts')
        .delete()
        .eq('id', billingAccount.id);

      if (error) {
        console.error('Error deleting billing account:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Cuenta de cobro eliminada correctamente"
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al eliminar la cuenta: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('billing_accounts')
        .update({
          status: 'causada',
          updated_at: new Date().toISOString()
        })
        .eq('id', billingAccount.id);

      if (error) {
        console.error('Error marking as paid:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Cuenta de cobro marcada como causada correctamente"
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al marcar como causada: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowPayDialog(false);
    }
  };

  const handleReturnToSupervisor = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('billing_accounts')
        .update({
          status: 'pendiente_revision',
          updated_at: new Date().toISOString()
        })
        .eq('id', billingAccount.id);

      if (error) {
        console.error('Error returning to supervisor:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Cuenta de cobro devuelta al supervisor correctamente"
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al devolver al supervisor: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowReturnDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Ver detalles"
          onClick={onEdit}
        >
          <Eye className="h-4 w-4" />
        </Button>

        {canEdit() && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Editar"
            onClick={onEdit}
            disabled={loading}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {canSubmitForReview() && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Enviar a revisión"
            onClick={() => setShowSubmitDialog(true)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        )}

        {canDelete() && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Eliminar"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {canMarkAsPaid() && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            title="Marcar como Causada"
            onClick={() => setShowPayDialog(true)}
            disabled={loading}
          >
            <DollarSign className="h-4 w-4" />
          </Button>
        )}

        {canReturnToSupervisor() && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
            title="Devolver al Supervisor"
            onClick={() => setShowReturnDialog(true)}
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Submit for Review Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar a Revisión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea enviar esta cuenta de cobro a revisión? 
              Una vez enviada, no podrá editarla hasta que sea devuelta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitForReview} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enviar a Revisión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cuenta de Cobro</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar esta cuenta de cobro? 
              Esta acción no se puede deshacer y se eliminarán también todas las actividades asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Paid Confirmation Dialog */}
      <AlertDialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Causada</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea marcar esta cuenta de cobro como causada (pagada)? 
              Esta acción indica que el pago ha sido procesado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkAsPaid} 
              disabled={loading}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Marcar como Causada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return to Supervisor Confirmation Dialog */}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Devolver al Supervisor</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea devolver esta cuenta de cobro al supervisor para revisión? 
              El supervisor tendrá que aprobarla nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReturnToSupervisor} 
              disabled={loading}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Devolver al Supervisor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}