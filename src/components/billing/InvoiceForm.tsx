import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

      </CardContent>
    </Card>
  );
}
