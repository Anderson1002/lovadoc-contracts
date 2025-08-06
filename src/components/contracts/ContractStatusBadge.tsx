import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContractStatusBadgeProps {
  status: string;
  className?: string;
}

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          label: 'Borrador',
          variant: 'secondary' as const,
          className: 'bg-muted text-muted-foreground'
        };
      case 'pending':
        return {
          label: 'Pendiente',
          variant: 'secondary' as const,
          className: 'bg-warning/10 text-warning border-warning/20'
        };
      case 'in_review':
        return {
          label: 'En Revisión',
          variant: 'secondary' as const,
          className: 'bg-primary/10 text-primary border-primary/20'
        };
      case 'approved':
        return {
          label: 'Aprobado',
          variant: 'secondary' as const,
          className: 'bg-success/10 text-success border-success/20'
        };
      case 'active':
        return {
          label: 'Activo',
          variant: 'secondary' as const,
          className: 'bg-success/20 text-success border-success/30'
        };
      case 'completed':
        return {
          label: 'Completado',
          variant: 'secondary' as const,
          className: 'bg-primary/20 text-primary border-primary/30'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          variant: 'secondary' as const,
          className: 'bg-destructive/10 text-destructive border-destructive/20'
        };
      case 'rejected':
        return {
          label: 'Rechazado',
          variant: 'secondary' as const,
          className: 'bg-destructive/10 text-destructive border-destructive/20'
        };
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}