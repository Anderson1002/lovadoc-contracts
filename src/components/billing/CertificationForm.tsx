import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ClipboardCheck, CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CertificationFormProps {
  contractDetails: any;
  userProfile: any;
  startDate?: Date;
  endDate?: Date;
  amount: string;
  novedades: string;
  onNovedadesChange: (value: string) => void;
  isComplete: boolean;
  // Campos para formato oficial
  valorEjecutadoAntes: string;
  onValorEjecutadoAntesChange: (value: string) => void;
  riskMatrixCompliance: boolean;
  onRiskMatrixComplianceChange: (value: boolean) => void;
  socialSecurityVerified: boolean;
  onSocialSecurityVerifiedChange: (value: boolean) => void;
  anexosLista: string;
  onAnexosListaChange: (value: string) => void;
  activities?: any[];
  // Nuevos campos
  certificationMonth: string;
  onCertificationMonthChange: (value: string) => void;
  reportDeliveryDate: string;
  onReportDeliveryDateChange: (value: string) => void;
}

const MONTHS = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

export function CertificationForm({
  contractDetails,
  userProfile,
  startDate,
  endDate,
  amount,
  novedades,
  onNovedadesChange,
  isComplete,
  valorEjecutadoAntes,
  onValorEjecutadoAntesChange,
  riskMatrixCompliance,
  onRiskMatrixComplianceChange,
  socialSecurityVerified,
  onSocialSecurityVerifiedChange,
  anexosLista,
  onAnexosListaChange,
  activities = [],
  certificationMonth,
  onCertificationMonthChange,
  reportDeliveryDate,
  onReportDeliveryDateChange
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

  const currentYear = new Date().getFullYear();

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
                <span className="text-muted-foreground">Objeto del Contrato:</span>
                <p className="font-medium text-xs">{contractDetails.description || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">CDP:</span>
                <p className="font-medium">{contractDetails.cdp || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">RP:</span>
                <p className="font-medium">{contractDetails.rp || 'No especificado'}</p>
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
              <div>
                <span className="text-muted-foreground">Ciudad de expedición:</span>
                <p className="font-medium">{userProfile.document_issue_city || 'No especificado'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Período de Certificación - Mes seleccionable */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-primary">PERÍODO DE CERTIFICACIÓN</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certificationMonth">Mes del Período *</Label>
              <Select value={certificationMonth} onValueChange={onCertificationMonthChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el mes" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Mes correspondiente al período que se certifica
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportDeliveryDate">Fecha Entrega del Informe *</Label>
              <Input
                type="date"
                value={reportDeliveryDate}
                onChange={(e) => onReportDeliveryDateChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Fecha en que el contratista entregó el informe
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
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

        {/* Sección 2: Novedades - con texto por defecto */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">2. Novedades o Situaciones Anormales Presentadas Durante el Desarrollo del Contrato</Label>
          <Textarea
            value={novedades}
            onChange={(e) => onNovedadesChange(e.target.value)}
            placeholder="Durante el presente período no se han presentado novedades o situaciones anormales que afecten el desarrollo del contrato."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Si no hubo novedades, deje el texto por defecto. Indique cualquier situación relevante: incapacidades, suspensiones, etc.
          </p>
        </div>

        {/* Sección 3: Seguridad Social */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">3. Cumplimiento de Obligaciones del Contratista Relacionadas con el Pago de Seguridad Social</Label>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs">
            <p className="text-blue-700 dark:text-blue-300 mb-3">
              (Ley 100 de 1993 y sus decretos reglamentarios, en el artículo 50 de la Ley 789 de 2002, Leyes 828 de 2003, 
              1122 de 2007, 1150 de 2007 y 1562 de 2012, Decretos 1072 de 2015 y 1273 de 2018 y demás normas concordantes).
            </p>
            <p className="text-muted-foreground mb-3">
              Se verificó el cumplimiento de las obligaciones del contratista con los sistemas de Seguridad Social Integral 
              en salud, pensiones y riesgos laborales, información que se puede constatar en la planilla o certificación de 
              pago correspondiente al periodo aquí relacionado.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="socialSecurityVerified"
                checked={socialSecurityVerified}
                onCheckedChange={(checked) => onSocialSecurityVerifiedChange(checked === true)}
              />
              <label htmlFor="socialSecurityVerified" className="text-sm font-medium cursor-pointer">
                Verifico el cumplimiento de las obligaciones de seguridad social
              </label>
            </div>
          </div>
        </div>

        {/* Sección 4: Matriz de Riesgos */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">4. Actividades de Tratamiento y Monitoreo a la Matriz de Riesgo del Contrato</Label>
          <div className="p-3 bg-muted rounded-lg text-xs">
            <p className="text-muted-foreground mb-3">
              Se ha realizado el monitoreo por parte de la supervisión, de acuerdo con el tratamiento y/o control de los 
              riesgos establecido en la matriz de los estudios previos del contrato, evidenciándose que no hay materialización 
              de los mismos. Lo anterior se verifica a través del informe mensual de actividades del contratista de acuerdo 
              con las obligaciones específicas pactadas, las cuales han tenido satisfactorio cumplimiento a la fecha.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="riskMatrixCompliance"
                checked={riskMatrixCompliance}
                onCheckedChange={(checked) => onRiskMatrixComplianceChange(checked === true)}
              />
              <label htmlFor="riskMatrixCompliance" className="text-sm cursor-pointer">
                Confirmo el monitoreo y cumplimiento de la matriz de riesgos
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
            placeholder="1. Informe ejecución actividades&#10;2. Planilla pago seguridad social"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Liste los documentos anexos numerados (ej: 1. Informe..., 2. Planilla...)
          </p>
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
