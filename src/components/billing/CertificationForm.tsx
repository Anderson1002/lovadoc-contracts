import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ClipboardCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CertificationFormProps {
  contractDetails: any;
  userProfile: any;
  startDate?: Date;
  endDate?: Date;
  amount: string;
  novedades: string;
  onNovedadesChange: (value: string) => void;
  certificationDate: string;
  onCertificationDateChange: (value: string) => void;
  isComplete: boolean;
}

export function CertificationForm({
  contractDetails,
  userProfile,
  startDate,
  endDate,
  amount,
  novedades,
  onNovedadesChange,
  certificationDate,
  onCertificationDateChange,
  isComplete
}: CertificationFormProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No especificada';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <Card className={isComplete ? "border-green-600/50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isComplete && <CheckCircle className="h-5 w-5 text-green-600" />}
              <ClipboardCheck className="h-5 w-5" />
              Certificación de Cumplimiento
            </CardTitle>
            <CardDescription>
              Formato GJ-F-1561-V4 - Certificación de ejecución de contrato
            </CardDescription>
          </div>
          {isComplete && (
            <Badge variant="default" className="bg-green-600">Completo</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Info (Auto-populated) */}
        {contractDetails && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium text-sm text-primary">DATOS DEL CONTRATO (Automático)</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Número de Contrato:</span>
                <p className="font-medium">{contractDetails.contract_number_original || contractDetails.contract_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">CDP:</span>
                <p className="font-medium">{contractDetails.cdp || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">RP:</span>
                <p className="font-medium">{contractDetails.rp || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Total:</span>
                <p className="font-medium">{formatCurrency(contractDetails.total_amount)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contractor Info (Auto-populated) */}
        {userProfile && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium text-sm text-primary">DATOS DEL CONTRATISTA (Automático)</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span>
                <p className="font-medium">{userProfile.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Documento:</span>
                <p className="font-medium">{userProfile.document_number || 'No especificado'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Execution Period */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h4 className="font-medium text-sm text-primary">PERÍODO DE EJECUCIÓN CERTIFICADO</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Desde:</span>
              <p className="font-medium">{formatDate(startDate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hasta:</span>
              <p className="font-medium">{formatDate(endDate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Valor del Período:</span>
              <p className="font-medium">{amount ? formatCurrency(parseFloat(amount)) : 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Novedades */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">5. Novedades Presentadas Durante la Ejecución</Label>
          <Textarea
            value={novedades}
            onChange={(e) => onNovedadesChange(e.target.value)}
            placeholder="Describa cualquier novedad ocurrida durante el período de ejecución. Si no hubo novedades, escriba 'Ninguna'."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Indique cualquier situación relevante: incapacidades, suspensiones, modificaciones, etc.
          </p>
        </div>

        {/* Certification Date */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Fecha de Certificación *</Label>
          <Input
            type="date"
            value={certificationDate}
            onChange={(e) => onCertificationDateChange(e.target.value)}
          />
        </div>

        {/* Info about supervisor signature */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Nota:</strong> La firma del supervisor se agregará automáticamente cuando el supervisor apruebe la cuenta de cobro.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
