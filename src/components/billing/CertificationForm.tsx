import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  // Nuevos campos para formato oficial
  valorEjecutadoAntes: string;
  onValorEjecutadoAntesChange: (value: string) => void;
  riskMatrixCompliance: boolean;
  onRiskMatrixComplianceChange: (value: boolean) => void;
  socialSecurityVerified: boolean;
  onSocialSecurityVerifiedChange: (value: boolean) => void;
  anexosLista: string;
  onAnexosListaChange: (value: string) => void;
  activities?: any[];
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
  isComplete,
  valorEjecutadoAntes,
  onValorEjecutadoAntesChange,
  riskMatrixCompliance,
  onRiskMatrixComplianceChange,
  socialSecurityVerified,
  onSocialSecurityVerifiedChange,
  anexosLista,
  onAnexosListaChange,
  activities = []
}: CertificationFormProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No especificada';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Cálculos automáticos
  const valorInicial = contractDetails?.total_amount || 0;
  const valorAdicion = contractDetails?.addition_amount || 0;
  const valorTotal = valorInicial + valorAdicion;
  const valorPagoActual = amount ? parseFloat(amount) : 0;
  const valorAntes = valorEjecutadoAntes ? parseFloat(valorEjecutadoAntes) : 0;
  const totalEjecutado = valorAntes + valorPagoActual;
  const saldoPorEjecutar = valorTotal - totalEjecutado;
  const porcentajeEjecutado = valorTotal > 0 ? (totalEjecutado / valorTotal) * 100 : 0;

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
              Formato GJ-F-1561-V4 - Hospital San Rafael de Facatativá E.S.E.
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
                <span className="text-muted-foreground">Rubro Presupuestal:</span>
                <p className="font-medium">{contractDetails.budget_code || 'No especificado'}</p>
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

        {/* Tabla Financiera Completa */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h4 className="font-medium text-sm text-primary">INFORMACIÓN FINANCIERA</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Valor Inicial Contrato:</span>
              <p className="font-medium">{formatCurrency(valorInicial)}</p>
            </div>
            {valorAdicion > 0 && (
              <>
                <div>
                  <span className="text-muted-foreground">Número Adición:</span>
                  <p className="font-medium">{contractDetails?.addition_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CDP Adición:</span>
                  <p className="font-medium">{contractDetails?.addition_cdp || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">RP Adición:</span>
                  <p className="font-medium">{contractDetails?.addition_rp || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor Adición:</span>
                  <p className="font-medium">{formatCurrency(valorAdicion)}</p>
                </div>
              </>
            )}
            <div>
              <span className="text-muted-foreground">Valor Total Contrato:</span>
              <p className="font-bold text-primary">{formatCurrency(valorTotal)}</p>
            </div>
          </div>

          {/* Campo editable: Valor ejecutado antes */}
          <div className="space-y-2 pt-3 border-t">
            <Label htmlFor="valorEjecutadoAntes">Valor Ejecutado Antes de Este Pago *</Label>
            <Input
              id="valorEjecutadoAntes"
              type="number"
              value={valorEjecutadoAntes}
              onChange={(e) => onValorEjecutadoAntesChange(e.target.value)}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Ingrese el valor total ejecutado en pagos anteriores a este período
            </p>
          </div>

          {/* Valores calculados */}
          <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
            <div>
              <span className="text-muted-foreground">Valor Pago Actual:</span>
              <p className="font-medium">{formatCurrency(valorPagoActual)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Ejecutado:</span>
              <p className="font-bold">{formatCurrency(totalEjecutado)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Saldo por Ejecutar:</span>
              <p className="font-medium">{formatCurrency(saldoPorEjecutar)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">% Ejecutado:</span>
              <p className="font-bold text-primary">{porcentajeEjecutado.toFixed(2)}%</p>
            </div>
          </div>
        </div>

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
          </div>
        </div>

        {/* Sección 1: Servicios recibidos (resumen de actividades) */}
        {activities.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base font-semibold">1. Servicios y/o Productos Recibidos a Satisfacción</Label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="text-muted-foreground mb-2">{activities.length} actividad(es) registrada(s):</p>
              <ul className="list-disc list-inside space-y-1">
                {activities.slice(0, 5).map((act, idx) => (
                  <li key={idx} className="text-sm">{act.activityName || act.activity_name}</li>
                ))}
                {activities.length > 5 && (
                  <li className="text-muted-foreground">...y {activities.length - 5} más</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Sección 2: Novedades */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">2. Novedades o Situaciones Anormales Presentadas</Label>
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

        {/* Sección 3: Seguridad Social */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">3. Cumplimiento de Obligaciones de Seguridad Social</Label>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <p className="text-blue-700 dark:text-blue-300 mb-3">
              De conformidad con lo establecido en el artículo 50 de la Ley 789 de 2002, el artículo 1 de la Ley 828 de 2003 
              y el artículo 23 de la Ley 1150 de 2007, se verificó que el contratista se encuentra al día con los aportes al 
              Sistema de Seguridad Social Integral (Salud, Pensión y ARL) según la Ley 100 de 1993.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="socialSecurityVerified"
                checked={socialSecurityVerified}
                onCheckedChange={(checked) => onSocialSecurityVerifiedChange(checked === true)}
              />
              <label htmlFor="socialSecurityVerified" className="text-sm font-medium cursor-pointer">
                Verifico que el contratista está al día con sus aportes de seguridad social
              </label>
            </div>
          </div>
        </div>

        {/* Sección 4: Matriz de Riesgos */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">4. Actividades de Tratamiento y Monitoreo a la Matriz de Riesgo</Label>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="riskMatrixCompliance"
                checked={riskMatrixCompliance}
                onCheckedChange={(checked) => onRiskMatrixComplianceChange(checked === true)}
              />
              <label htmlFor="riskMatrixCompliance" className="text-sm cursor-pointer">
                El contratista ha cumplido con las actividades de tratamiento y monitoreo establecidas en la matriz de riesgos del contrato
              </label>
            </div>
          </div>
        </div>

        {/* Sección 5: Anexos */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">5. Anexos</Label>
          <Textarea
            value={anexosLista}
            onChange={(e) => onAnexosListaChange(e.target.value)}
            placeholder="Liste los documentos anexos separados por líneas. Ejemplo:&#10;- Informe de actividades&#10;- Planilla de seguridad social&#10;- Cuenta de cobro"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Indique todos los documentos que se adjuntan a esta certificación
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
