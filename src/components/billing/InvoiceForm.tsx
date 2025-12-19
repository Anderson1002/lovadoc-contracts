import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, FileText } from "lucide-react";
import { formatCurrency, formatCurrencyInput } from "@/lib/utils";

interface InvoiceFormProps {
  contractDetails: any;
  userProfile: any;
  amount: string;
  invoiceNumber: string;
  onInvoiceNumberChange: (value: string) => void;
  invoiceCity: string;
  onInvoiceCityChange: (value: string) => void;
  invoiceDate: string;
  onInvoiceDateChange: (value: string) => void;
  amountInWords: string;
  onAmountInWordsChange: (value: string) => void;
  declarationSingleEmployer: boolean;
  onDeclarationSingleEmployerChange: (value: boolean) => void;
  declaration80PercentIncome: boolean;
  onDeclaration80PercentIncomeChange: (value: boolean) => void;
  benefitPrepaidHealth: boolean;
  onBenefitPrepaidHealthChange: (value: boolean) => void;
  benefitVoluntaryPension: boolean;
  onBenefitVoluntaryPensionChange: (value: boolean) => void;
  benefitHousingInterest: boolean;
  onBenefitHousingInterestChange: (value: boolean) => void;
  benefitHealthContributions: boolean;
  onBenefitHealthContributionsChange: (value: boolean) => void;
  benefitEconomicDependents: boolean;
  onBenefitEconomicDependentsChange: (value: boolean) => void;
  isComplete: boolean;
}

export function InvoiceForm({
  contractDetails,
  userProfile,
  amount,
  invoiceNumber,
  onInvoiceNumberChange,
  invoiceCity,
  onInvoiceCityChange,
  invoiceDate,
  onInvoiceDateChange,
  amountInWords,
  onAmountInWordsChange,
  declarationSingleEmployer,
  onDeclarationSingleEmployerChange,
  declaration80PercentIncome,
  onDeclaration80PercentIncomeChange,
  benefitPrepaidHealth,
  onBenefitPrepaidHealthChange,
  benefitVoluntaryPension,
  onBenefitVoluntaryPensionChange,
  benefitHousingInterest,
  onBenefitHousingInterestChange,
  benefitHealthContributions,
  onBenefitHealthContributionsChange,
  benefitEconomicDependents,
  onBenefitEconomicDependentsChange,
  isComplete
}: InvoiceFormProps) {
  return (
    <Card className={isComplete ? "border-green-600/50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isComplete && <CheckCircle className="h-5 w-5 text-green-600" />}
              <FileText className="h-5 w-5" />
              Cuenta de Cobro - Documento Equivalente
            </CardTitle>
            <CardDescription>
              Formato de cuenta de cobro según normativa tributaria
            </CardDescription>
          </div>
          {isComplete && (
            <Badge variant="default" className="bg-green-600">Completo</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
                <span className="text-muted-foreground">NIT/CC:</span>
                <p className="font-medium">{userProfile.nit || userProfile.document_number || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Dirección:</span>
                <p className="font-medium">{userProfile.address || 'No especificada'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span>
                <p className="font-medium">{userProfile.phone || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Régimen:</span>
                <p className="font-medium">{userProfile.tax_regime || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ciudad:</span>
                <p className="font-medium">{userProfile.city || 'No especificada'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Actividad RUT:</span>
                <p className="font-medium">{userProfile.rut_activity_code || 'No especificada'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Documento Equivalente No. *</Label>
            <Input
              value={invoiceNumber}
              onChange={(e) => onInvoiceNumberChange(e.target.value)}
              placeholder="Ej: 001"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Ciudad *</Label>
            <Input
              value={invoiceCity}
              onChange={(e) => onInvoiceCityChange(e.target.value)}
              placeholder="Ej: Villavicencio"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Fecha *</Label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => onInvoiceDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Valor en Letras *</Label>
            <Input
              value={amountInWords}
              onChange={(e) => onAmountInWordsChange(e.target.value)}
              placeholder="Ej: Un millón de pesos M/CTE"
            />
          </div>
        </div>

        {/* Amount Summary */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">VALOR TOTAL A COBRAR:</span>
            <span className="text-2xl font-bold text-primary">
              {amount ? formatCurrency(parseFloat(amount)) : '$0'}
            </span>
          </div>
        </div>

        {/* Declarations */}
        <div className="space-y-4">
          <h4 className="font-medium text-base">DECLARACIONES BAJO LA GRAVEDAD DEL JURAMENTO:</h4>
          
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="singleEmployer"
                checked={declarationSingleEmployer}
                onCheckedChange={(checked) => onDeclarationSingleEmployerChange(checked as boolean)}
              />
              <Label htmlFor="singleEmployer" className="text-sm font-normal leading-relaxed cursor-pointer">
                Que el pagador (Hospital Departamental de Villavicencio E.S.E.) es mi único empleador
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="income80Percent"
                checked={declaration80PercentIncome}
                onCheckedChange={(checked) => onDeclaration80PercentIncomeChange(checked as boolean)}
              />
              <Label htmlFor="income80Percent" className="text-sm font-normal leading-relaxed cursor-pointer">
                Que el 80% o más de mis ingresos provienen de la prestación de servicios
              </Label>
            </div>
          </div>
        </div>

        {/* Tax Benefits */}
        <div className="space-y-4">
          <h4 className="font-medium text-base">BENEFICIOS TRIBUTARIOS:</h4>
          <p className="text-sm text-muted-foreground">
            Marque los beneficios tributarios que le aplican:
          </p>
          
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="prepaidHealth"
                checked={benefitPrepaidHealth}
                onCheckedChange={(checked) => onBenefitPrepaidHealthChange(checked as boolean)}
              />
              <Label htmlFor="prepaidHealth" className="text-sm font-normal cursor-pointer">
                Pagos de planes complementarios de medicina prepagada
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="voluntaryPension"
                checked={benefitVoluntaryPension}
                onCheckedChange={(checked) => onBenefitVoluntaryPensionChange(checked as boolean)}
              />
              <Label htmlFor="voluntaryPension" className="text-sm font-normal cursor-pointer">
                Aportes a fondos voluntarios de pensión
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="housingInterest"
                checked={benefitHousingInterest}
                onCheckedChange={(checked) => onBenefitHousingInterestChange(checked as boolean)}
              />
              <Label htmlFor="housingInterest" className="text-sm font-normal cursor-pointer">
                Pago de intereses de préstamos para adquisición de vivienda
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="healthContributions"
                checked={benefitHealthContributions}
                onCheckedChange={(checked) => onBenefitHealthContributionsChange(checked as boolean)}
              />
              <Label htmlFor="healthContributions" className="text-sm font-normal cursor-pointer">
                Aportes obligatorios a salud
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="economicDependents"
                checked={benefitEconomicDependents}
                onCheckedChange={(checked) => onBenefitEconomicDependentsChange(checked as boolean)}
              />
              <Label htmlFor="economicDependents" className="text-sm font-normal cursor-pointer">
                Dependientes económicos
              </Label>
            </div>
          </div>
        </div>

        {/* Legal Note */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Nota Legal:</strong> Este documento equivalente presta mérito ejecutivo y tiene la naturaleza de letra de cambio según el Artículo 774 del Código de Comercio. El firmante declara bajo juramento que la información aquí consignada es veraz.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
