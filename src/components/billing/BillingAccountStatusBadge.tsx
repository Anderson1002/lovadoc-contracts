import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BillingAccountStatusBadgeProps {
  status: string;
  className?: string;
}

export function BillingAccountStatusBadge({ status, className }: BillingAccountStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'borrador':
        return {
          label: 'Borrador',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-700 border-gray-300'
        };
      case 'pendiente_revision':
        return {
          label: 'Pendiente Revisión',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-700 border-yellow-300'
        };
      case 'aprobada':
        return {
          label: 'Aprobada',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-700 border-green-300'
        };
      case 'rechazada':
        return {
          label: 'Rechazada',
          variant: 'secondary' as const,
          className: 'bg-red-100 text-red-700 border-red-300'
        };
      case 'causada':
        return {
          label: 'Causada',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-700 border-blue-300'
        };
      default:
        return {
          label: 'Borrador',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-700 border-gray-300'
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