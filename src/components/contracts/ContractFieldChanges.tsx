import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FieldChange {
  old: string;
  new: string;
  label: string;
}

interface ContractFieldChangesProps {
  changes: Record<string, FieldChange> | null;
}

export function ContractFieldChanges({ changes }: ContractFieldChangesProps) {
  if (!changes || Object.keys(changes).length === 0) {
    return null;
  }

  const getFieldIcon = (fieldName: string) => {
    if (fieldName.includes('date')) return Calendar;
    if (fieldName.includes('amount')) return DollarSign;
    if (fieldName.includes('contract_path')) return FileText;
    return AlertCircle;
  };

  const formatValue = (value: string, fieldName: string) => {
    // Formatear fechas
    if (fieldName.includes('date') && value !== '(vacío)') {
      try {
        return format(new Date(value), 'dd/MM/yyyy', { locale: es });
      } catch {
        return value;
      }
    }
    
    // Formatear montos
    if (fieldName.includes('amount') && value !== '(vacío)') {
      return `$${parseFloat(value).toLocaleString('es-CO')}`;
    }
    
    // Formatear rutas de archivo (solo mostrar nombre)
    if (fieldName.includes('path') && value !== '(vacío)') {
      return value.split('/').pop() || value;
    }
    
    return value;
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-orange-900">
            Campos Modificados
          </h4>
          <Badge variant="secondary" className="ml-auto">
            {Object.keys(changes).length}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {Object.entries(changes).map(([fieldName, change]) => {
            const Icon = getFieldIcon(fieldName);
            
            return (
              <div 
                key={fieldName} 
                className="flex items-start gap-3 p-3 bg-background rounded-lg border border-orange-100"
              >
                <Icon className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {change.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Anterior:</p>
                      <p className="text-foreground bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
                        {formatValue(change.old, fieldName)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Nuevo:</p>
                      <p className="text-foreground bg-green-50 px-2 py-1 rounded border border-green-200 dark:bg-green-950 dark:border-green-800">
                        {formatValue(change.new, fieldName)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
