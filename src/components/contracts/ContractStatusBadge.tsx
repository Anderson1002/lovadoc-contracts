import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContractStatusBadgeProps {
  status: string;
  className?: string;
}

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    // Manejar casos donde status es undefined, null o vacío
    if (!status) {
      return {
        label: 'Registrado',
        variant: 'secondary' as const,
        className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
      };
    }
    
    switch (status.toLowerCase()) {
      case 'registrado':
        return {
          label: 'Registrado',
          variant: 'secondary' as const,
          className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
        };
      case 'devuelto':
        return {
          label: 'Devuelto',
          variant: 'destructive' as const,
          className: 'bg-red-500/20 text-red-700 border-red-500/30'
        };
      case 'en_ejecucion':
        return {
          label: 'En Ejecución',
          variant: 'default' as const,
          className: 'bg-green-500/20 text-green-700 border-green-500/30'
        };
      case 'completado':
        return {
          label: 'Completado',
          variant: 'secondary' as const,
          className: 'bg-blue-500/20 text-blue-700 border-blue-500/30'
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          variant: 'secondary' as const,
          className: 'bg-gray-500/20 text-gray-700 border-gray-500/30'
        };
      default:
        return {
          label: 'Registrado',
          variant: 'secondary' as const,
          className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
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