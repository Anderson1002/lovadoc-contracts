import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreVertical,
  MessageSquare 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContractStateActionsProps {
  contract: any;
  userRole: string;
  onStateChange?: () => void;
}

export function ContractStateActions({ 
  contract, 
  userRole, 
  onStateChange 
}: ContractStateActionsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionComments, setRejectionComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canChangeState = ["super_admin", "admin", "supervisor"].includes(userRole);
  const currentState = contract.status;

  const handleStateChange = async (newState: string, comments?: string) => {
    if (!canChangeState) return;

    try {
      setIsLoading(true);

      // Actualizar el contrato usando el campo status existente
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ 
          status: newState === 'en_ejecucion' ? 'active' : 
                 newState === 'completado' ? 'completed' : 
                 newState === 'cancelado' ? 'cancelled' : 'draft'
        })
        .eq('id', contract.id);

      if (contractError) throw contractError;

      // Registrar el cambio en actividades
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
          entity_type: 'contract',
          entity_id: contract.id,
          action: `state_change_${newState}`,
          details: {
            previous_state: currentState,
            new_state: newState,
            comments: comments
          }
        });

      if (activityError) console.warn('Error logging activity:', activityError);

      toast({
        title: "Estado actualizado",
        description: `El contrato ha sido ${getStateLabel(newState)}`,
      });

      onStateChange?.();
      setShowRejectDialog(false);
      setRejectionComments("");

    } catch (error: any) {
      console.error('Error updating contract state:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del contrato",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'registrado': return 'registrado';
      case 'devuelto': return 'devuelto';
      case 'en_ejecucion': return 'puesto en ejecución';
      case 'completado': return 'completado';
      case 'cancelado': return 'cancelado';
      default: return state;
    }
  };

  const getAvailableActions = () => {
    switch (currentState) {
      case 'draft':
        return [
          { action: 'en_ejecucion', label: 'Aprobar', icon: CheckCircle, variant: 'default' },
          { action: 'cancelado', label: 'Cancelar', icon: XCircle, variant: 'destructive' }
        ];
      case 'active':
        return [
          { action: 'completado', label: 'Completar', icon: CheckCircle, variant: 'default' },
          { action: 'cancelado', label: 'Cancelar', icon: XCircle, variant: 'destructive' }
        ];
      default:
        return [];
    }
  };

  if (!canChangeState || getAvailableActions().length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border shadow-lg">
          {getAvailableActions().map((action) => {
            const Icon = action.icon;
            if (action.action === 'cancelado' && currentState === 'draft') {
              return (
                <DropdownMenuItem 
                  key={action.action}
                  onClick={() => setShowRejectDialog(true)}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              );
            }
            return (
              <DropdownMenuItem 
                key={action.action}
                onClick={() => handleStateChange(action.action)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Contrato</DialogTitle>
            <DialogDescription>
              Ingresa los comentarios sobre por qué se cancela este contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Comentarios de devolución</Label>
              <Textarea
                id="comments"
                placeholder="Explica las razones de la devolución..."
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRejectDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleStateChange('cancelado', rejectionComments)}
              disabled={isLoading || !rejectionComments.trim()}
            >
              {isLoading ? "Cancelando..." : "Cancelar Contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}