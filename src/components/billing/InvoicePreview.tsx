import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoicePreviewProps {
  contractDetails: any;
  userProfile: any;
  amount: string;
  invoiceNumber: string;
  invoiceCity: string;
  invoiceDate: string;
  amountInWords: string;
  declarationSingleEmployer: boolean;
  declaration80PercentIncome: boolean;
  benefitPrepaidHealth: boolean;
  benefitVoluntaryPension: boolean;
  benefitHousingInterest: boolean;
  benefitHealthContributions: boolean;
  benefitEconomicDependents: boolean;
}

export function InvoicePreview({
  contractDetails,
  userProfile,
  amount,
  invoiceNumber,
  invoiceCity,
  invoiceDate,
  amountInWords,
  declarationSingleEmployer,
  declaration80PercentIncome,
  benefitPrepaidHealth,
  benefitVoluntaryPension,
  benefitHousingInterest,
  benefitHealthContributions,
  benefitEconomicDependents
}: InvoicePreviewProps) {
  const formatDate = (date: string | undefined) => {
    if (!date) return '_______________';
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("CUENTA DE COBRO", pageWidth / 2, 15, { align: "center" });
    doc.text("DOCUMENTO EQUIVALENTE", pageWidth / 2, 22, { align: "center" });
    doc.setFont(undefined, "normal");
    
    doc.setFontSize(10);
    doc.text(`No. ${invoiceNumber || '___'}`, pageWidth - 40, 15);
    
    let yPosition = 35;
    
    // Contractor Info
    doc.setFontSize(9);
    const contractorInfo = [
      ["NOMBRE:", userProfile?.name || ""],
      ["NIT/CC:", userProfile?.nit || userProfile?.document_number || ""],
      ["DIRECCIÓN:", userProfile?.address || ""],
      ["TELÉFONO:", userProfile?.phone || ""],
      ["CIUDAD:", userProfile?.city || invoiceCity || ""],
      ["RÉGIMEN:", userProfile?.tax_regime || ""],
      ["ACTIVIDAD RUT:", userProfile?.rut_activity_code || ""],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      body: contractorInfo,
      theme: 'plain',
      styles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Amount
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("DEBE A:", 14, yPosition);
    doc.text(userProfile?.name || "_______________", 35, yPosition);
    yPosition += 8;
    
    doc.text("LA SUMA DE:", 14, yPosition);
    doc.setFont(undefined, "normal");
    doc.text(amountInWords || "_______________", 45, yPosition);
    yPosition += 8;
    
    doc.setFont(undefined, "bold");
    doc.text("VALOR:", 14, yPosition);
    doc.text(amount ? formatCurrency(parseFloat(amount)) : "$0", 35, yPosition);
    doc.setFont(undefined, "normal");
    yPosition += 15;
    
    // Declarations
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("DECLARO BAJO LA GRAVEDAD DEL JURAMENTO:", 14, yPosition);
    doc.setFont(undefined, "normal");
    yPosition += 8;
    
    if (declarationSingleEmployer) {
      doc.text("✓ El pagador es mi único empleador", 14, yPosition);
      yPosition += 5;
    }
    if (declaration80PercentIncome) {
      doc.text("✓ El 80% o más de mis ingresos provienen de prestación de servicios", 14, yPosition);
      yPosition += 5;
    }
    
    yPosition += 10;
    
    // Benefits
    doc.setFont(undefined, "bold");
    doc.text("BENEFICIOS TRIBUTARIOS APLICABLES:", 14, yPosition);
    doc.setFont(undefined, "normal");
    yPosition += 8;
    
    if (benefitPrepaidHealth) {
      doc.text("✓ Medicina prepagada", 14, yPosition);
      yPosition += 5;
    }
    if (benefitVoluntaryPension) {
      doc.text("✓ Aportes voluntarios a pensión", 14, yPosition);
      yPosition += 5;
    }
    if (benefitHousingInterest) {
      doc.text("✓ Intereses de vivienda", 14, yPosition);
      yPosition += 5;
    }
    if (benefitHealthContributions) {
      doc.text("✓ Aportes obligatorios a salud", 14, yPosition);
      yPosition += 5;
    }
    if (benefitEconomicDependents) {
      doc.text("✓ Dependientes económicos", 14, yPosition);
      yPosition += 5;
    }
    
    yPosition += 15;
    
    // Legal note
    doc.setFontSize(7);
    const legalNote = "Nota: Este documento equivalente presta mérito ejecutivo y tiene la naturaleza de letra de cambio según el Artículo 774 del Código de Comercio.";
    const splitLegal = doc.splitTextToSize(legalNote, pageWidth - 28);
    doc.text(splitLegal, 14, yPosition);
    yPosition += splitLegal.length * 4 + 15;
    
    // Signature
    doc.setFontSize(9);
    doc.text("_________________________________", 14, yPosition);
    yPosition += 5;
    doc.text("FIRMA DEL CONTRATISTA", 14, yPosition);
    yPosition += 5;
    doc.text(userProfile?.name || "", 14, yPosition);
    yPosition += 5;
    doc.text(`C.C. ${userProfile?.document_number || ""}`, 14, yPosition);
    
    // Date and City
    yPosition += 15;
    doc.text(`${invoiceCity || "_______________"}, ${formatDate(invoiceDate)}`, 14, yPosition);
    
    doc.save(`CuentaCobro_${invoiceNumber || 'documento'}.pdf`);
  };

  if (!userProfile || !amount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vista Previa - Cuenta de Cobro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete los datos para ver la vista previa
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Vista Previa - Cuenta de Cobro</CardTitle>
        <Button size="sm" variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 bg-white dark:bg-card text-sm space-y-4">
          {/* Header */}
          <div className="text-center border-b pb-3">
            <p className="font-bold text-lg">CUENTA DE COBRO</p>
            <p className="font-semibold">DOCUMENTO EQUIVALENTE</p>
            <p className="text-xs mt-2">No. {invoiceNumber || '___'}</p>
          </div>
          
          {/* Contractor Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p><span className="text-muted-foreground">Nombre:</span> <strong>{userProfile?.name}</strong></p>
            <p><span className="text-muted-foreground">NIT/CC:</span> {userProfile?.nit || userProfile?.document_number}</p>
            <p><span className="text-muted-foreground">Dirección:</span> {userProfile?.address || 'N/A'}</p>
            <p><span className="text-muted-foreground">Teléfono:</span> {userProfile?.phone || 'N/A'}</p>
            <p><span className="text-muted-foreground">Ciudad:</span> {userProfile?.city || invoiceCity || 'N/A'}</p>
            <p><span className="text-muted-foreground">Régimen:</span> {userProfile?.tax_regime || 'N/A'}</p>
          </div>
          
          {/* Amount Box */}
          <div className="bg-primary/5 p-4 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">DEBE A: {userProfile?.name}</p>
            <p className="text-xs text-muted-foreground mt-1">LA SUMA DE: {amountInWords || '_______________'}</p>
            <p className="text-2xl font-bold text-primary mt-2">
              {amount ? formatCurrency(parseFloat(amount)) : '$0'}
            </p>
          </div>
          
          {/* Declarations */}
          <div>
            <p className="font-semibold text-xs mb-2">DECLARACIONES:</p>
            <div className="space-y-1 text-xs">
              {declarationSingleEmployer && (
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  El pagador es mi único empleador
                </p>
              )}
              {declaration80PercentIncome && (
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  80%+ de ingresos por prestación de servicios
                </p>
              )}
            </div>
          </div>
          
          {/* Benefits */}
          <div>
            <p className="font-semibold text-xs mb-2">BENEFICIOS TRIBUTARIOS:</p>
            <div className="space-y-1 text-xs">
              {benefitPrepaidHealth && (
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Medicina prepagada
                </p>
              )}
              {benefitVoluntaryPension && (
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Aportes voluntarios a pensión
                </p>
              )}
              {benefitHousingInterest && (
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Intereses de vivienda
                </p>
              )}
              {benefitHealthContributions && (
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Aportes obligatorios a salud
                </p>
              )}
              {benefitEconomicDependents && (
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Dependientes económicos
                </p>
              )}
            </div>
          </div>
          
          {/* Signature */}
          <div className="pt-4 border-t mt-4">
            <div className="text-center text-xs">
              <div className="border-t border-foreground pt-1 mt-8 max-w-xs mx-auto">
                <p className="font-semibold">FIRMA DEL CONTRATISTA</p>
                <p>{userProfile?.name}</p>
                <p className="text-muted-foreground">C.C. {userProfile?.document_number}</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center pt-2">
            {invoiceCity || '_______________'}, {formatDate(invoiceDate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
