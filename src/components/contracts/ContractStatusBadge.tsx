import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContractStatusBadgeProps {
  status: string;
  className?: string;
}

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
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
      default:
        return {
          label: 'Activo',
          variant: 'secondary' as const,
          className: 'bg-success/20 text-success border-success/30'
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