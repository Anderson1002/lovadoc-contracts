import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Award, Receipt } from "lucide-react";

interface Observation {
  documentType: string;
  comment: string;
}

interface SupervisorObservationsProps {
  comment: string | null;
  className?: string;
  compact?: boolean;
}

const DOCUMENT_CONFIG: Record<string, { label: string; badgeClass: string; icon: typeof FileText }> = {
  'INFORME': {
    label: 'Informe de Actividades',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: FileText,
  },
  'CERTIFICACIÓN': {
    label: 'Certificación',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Award,
  },
  'CUENTA DE COBRO': {
    label: 'Cuenta de Cobro',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Receipt,
  },
};

function parseObservations(comment: string): Observation[] {
  const lines = comment.split('\n').filter(l => l.trim());
  const observations: Observation[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(INFORME|CERTIFICACIÓN|CUENTA DE COBRO)\]\s*(.+)$/);
    if (match) {
      observations.push({ documentType: match[1], comment: match[2] });
    } else {
      observations.push({ documentType: '', comment: line.trim() });
    }
  }

  return observations;
}

export function SupervisorObservations({ comment, className = '', compact = false }: SupervisorObservationsProps) {
  if (!comment) return null;

  const observations = parseObservations(comment);

  if (observations.length === 0) return null;

  if (compact) {
    return (
      <div className={`space-y-1 ${className}`}>
        {observations.map((obs, i) => {
          const config = DOCUMENT_CONFIG[obs.documentType];
          return (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              {config ? (
                <Badge variant="outline" className={`${config.badgeClass} text-[10px] px-1.5 py-0 shrink-0`}>
                  {obs.documentType}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">General</Badge>
              )}
              <span className="text-muted-foreground truncate">{obs.comment}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertTriangle className="w-4 h-4" />
        Observaciones del Supervisor
      </div>
      <div className="space-y-2">
        {observations.map((obs, i) => {
          const config = DOCUMENT_CONFIG[obs.documentType];
          const Icon = config?.icon || FileText;
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="space-y-1 min-w-0">
                <Badge variant="outline" className={config?.badgeClass || 'text-muted-foreground'}>
                  {config?.label || 'Observación General'}
                </Badge>
                <p className="text-sm">{obs.comment}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
