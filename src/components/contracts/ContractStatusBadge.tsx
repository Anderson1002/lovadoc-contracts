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
      case 'registrado':
        return {
          label: 'Registrado',
          variant: 'secondary' as const,
          className: 'bg-state-registered/20 text-state-registered border-state-registered/30'
        };
      case 'returned':
      case 'devuelto':
        return {
          label: 'Devuelto',
          variant: 'secondary' as const,
          className: 'bg-state-returned/20 text-state-returned border-state-returned/30'
        };
      case 'active':
      case 'en_ejecucion':
        return {
          label: 'En Ejecución',
          variant: 'secondary' as const,
          className: 'bg-state-executing/20 text-state-executing border-state-executing/30'
        };
      case 'completed':
      case 'completado':
        return {
          label: 'Completado',
          variant: 'secondary' as const,
          className: 'bg-state-completed/20 text-state-completed border-state-completed/30'
        };
      case 'cancelled':
      case 'cancelado':
        return {
          label: 'Cancelado',
          variant: 'secondary' as const,
          className: 'bg-state-cancelled/20 text-state-cancelled border-state-cancelled/30'
        };
      default:
        return {
          label: 'Registrado',
          variant: 'secondary' as const,
          className: 'bg-state-registered/20 text-state-registered border-state-registered/30'
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