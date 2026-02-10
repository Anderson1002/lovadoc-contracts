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
  signatureUrl?: string;
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
  benefitEconomicDependents,
  signatureUrl
}: InvoicePreviewProps) {
  const formatDate = (date: string | undefined) => {
    if (!date) return '_______________';
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  const loadImageAsBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // --- Header: Contractor Info (centered, 6 lines) ---
    let y = 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(userProfile?.name || "", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const nitOrCc = userProfile?.nit ? `NIT: ${userProfile.nit}` : `CC. ${userProfile?.document_number || ""}`;
    doc.text(nitOrCc, pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.text(userProfile?.address || "", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.text(`Tel: ${userProfile?.phone || ""}`, pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.text(userProfile?.email || "", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.text(userProfile?.tax_regime || "", pageWidth / 2, y, { align: "center" });
    y += 6;

    // --- Divider line ---
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // --- Secondary title ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("DOCUMENTO EQUIVALENTE FACTURA No. DSE", pageWidth / 2, y, { align: "center" });
    y += 8;

    // --- Client Info (left aligned) ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ciudad y fecha: Girardot, ${formatDate(invoiceDate)}`, margin, y);
    y += 5;
    doc.text(`Cliente: MAKTUB MA S.A.S`, margin, y);
    y += 5;
    doc.text(`NIT: 900.827.439-4`, margin, y);
    y += 5;
    doc.text(`Dirección: CALLE 21 No 11 21 GIRARDOT`, margin, y);
    y += 5;
    doc.text(`Teléfono: 3113988647`, margin, y);
    y += 8;

    // --- Bordered main content box ---
    const boxStartY = y;
    const boxX = margin;
    const boxWidth = contentWidth;

    // We'll draw the rect after calculating content height
    // For now, track y inside the box
    let boxY = y + 4; // padding top

    // Narrative block
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const monthYear = invoiceDate
      ? new Date(invoiceDate + 'T00:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase()
      : '_______________';
    const narrativeText = `POR PRESTACION DE SERVICIOS COMO: (${contractDetails?.description || 'Sin descripción'}) DEL PERIODO DEL MES DE ${monthYear} SEGÚN CONTRATO No. ${contractDetails?.contract_number_original || contractDetails?.contract_number || '___'}`;
    const narrativeLines = doc.splitTextToSize(narrativeText, boxWidth - 8);
    doc.text(narrativeLines, boxX + 4, boxY);
    boxY += narrativeLines.length * 3.5 + 4;

    // Amount centered
    doc.setFont('helvetica', 'bold');
    doc.text(`SON: ${amount ? formatCurrency(parseFloat(amount)) : '$0'}`, pageWidth / 2, boxY, { align: "center" });
    boxY += 5;

    // Amount in words centered
    doc.setFont('helvetica', 'normal');
    doc.text(amountInWords || '_______________', pageWidth / 2, boxY, { align: "center" });
    boxY += 5;

    // Bank account centered
    doc.text(`N0. CUENTA BANCARIA N° ${userProfile?.bank_account || '_______________'} DE AHORROS`, pageWidth / 2, boxY, { align: "center" });
    boxY += 5;

    // Bank name centered
    doc.text(`BANCO: ${userProfile?.bank_name || '_______________'}`, pageWidth / 2, boxY, { align: "center" });
    boxY += 6;

    // Legal declaration (Art. 383) - justified
    const legalDeclaration = `Bajo la gravedad de juramento informo que no he contratado con más de 1 empleador por un término igual o superior a 90 días, y por consiguiente solicito se me aplica la retención en la fuente por salarios en virtud de lo señalado en el parágrafo 2 del artículo 383 del estatuto tributario, reglamentado por el artículo 1.2.4.1.6 del decreto 1625 de 2016, adicional informo que el 80% o más de mis ingresos totales proceden de la actividad o servicio que estoy realizando SI__x__. NO_____.`;
    const legalLines = doc.splitTextToSize(legalDeclaration, boxWidth - 8);
    doc.text(legalLines, boxX + 4, boxY);
    boxY += legalLines.length * 3.5 + 4;

    // Tax benefits intro text
    const benefitsIntro = `Deseo obtener beneficios tributarios porque cumplo con la siguiente condición y adjunto los soportes correspondientes:`;
    const benefitsIntroLines = doc.splitTextToSize(benefitsIntro, boxWidth - 8);
    doc.text(benefitsIntroLines, boxX + 4, boxY);
    boxY += benefitsIntroLines.length * 3.5 + 4;

    // Tax benefits table using autoTable
    const benefitsData = [
      ['Pago por salud a empresas de medicina prepagada o pagos por seguros de salud', benefitPrepaidHealth ? 'SI' : 'NO'],
      ['Aportes a fondos de pensiones voluntarios (APB) o cuentas para el fomento de la construcción (AFC)', benefitVoluntaryPension ? 'SI' : 'NO'],
      ['Intereses o corrección monetaria en virtud de préstamos para la adquisición de vivienda', benefitHousingInterest ? 'SI' : 'NO'],
      ['Aportes obligatorios al sistema de seguridad social integral en salud', benefitHealthContributions ? 'SI' : 'NO'],
      ['Declaración juramentada de dependencia económica', benefitEconomicDependents ? 'SI' : 'NO'],
    ];

    autoTable(doc, {
      startY: boxY,
      margin: { left: boxX + 4, right: margin + 4 },
      body: benefitsData,
      columnStyles: {
        0: { cellWidth: (boxWidth - 8) * 0.9 },
        1: { cellWidth: (boxWidth - 8) * 0.1, halign: 'center' },
      },
      styles: {
        fontSize: 8,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        font: 'helvetica',
      },
      theme: 'grid',
    });

    boxY = (doc as any).lastAutoTable.finalY + 4;

    // RUT Activity
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Actividad económica RUT', boxX + 4, boxY);
    boxY += 5;

    // Legal note Art. 774
    doc.text('Esta factura se asimila a una letra de cambio para todos los efectos legales Artículo 774 c de Código de Comercio.', boxX + 4, boxY);
    boxY += 8;

    // Signature
    let signatureBase64: string | null = null;
    if (signatureUrl) {
      signatureBase64 = await loadImageAsBase64(signatureUrl);
    }

    if (signatureBase64) {
      const sigWidth = 50;
      const sigHeight = 20;
      const sigX = (pageWidth - sigWidth) / 2;
      doc.addImage(signatureBase64, 'PNG', sigX, boxY, sigWidth, sigHeight);
      boxY += sigHeight + 2;
    } else {
      doc.line(pageWidth / 2 - 30, boxY + 10, pageWidth / 2 + 30, boxY + 10);
      boxY += 14;
    }

    // Signature label centered
    doc.setFont('helvetica', 'bold');
    doc.text('FIRMA DEL CONTRATISTA', pageWidth / 2, boxY, { align: 'center' });
    boxY += 5;

    // C.C. info centered
    doc.setFont('helvetica', 'normal');
    doc.text(`C.C. ${userProfile?.document_number || '_______________'} de ${userProfile?.document_issue_city || '_______________'}`, pageWidth / 2, boxY, { align: 'center' });
    boxY += 4;

    // Draw the border rect around all box content
    const boxEndY = boxY;
    doc.setLineWidth(0.5);
    doc.rect(boxX, boxStartY, boxWidth, boxEndY - boxStartY + 2);

    doc.save(`CuentaCobro_${invoiceNumber || 'documento'}.pdf`);
  };
  if (!userProfile || !amount) {
    return <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vista Previa - Cuenta de Cobro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete los datos para ver la vista previa
          </p>
        </CardContent>
      </Card>;
  }
  return <Card>
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
          
          
          {/* Contractor Info - Centered 6 lines */}
          <div className="text-center text-xs space-y-0.5 py-2">
            <p className="font-bold text-sm">{userProfile?.name}</p>
            <p>{userProfile?.nit ? `NIT: ${userProfile.nit}` : `CC. ${userProfile?.document_number || 'N/A'}`}</p>
            <p>{userProfile?.address || 'N/A'}</p>
            <p>Tel: {userProfile?.phone || 'N/A'}</p>
            <p>{userProfile?.email || 'N/A'}</p>
            <p>{userProfile?.tax_regime || 'N/A'}</p>
          </div>
          
          {/* Divider and Document Title */}
          <div className="border-t border-foreground my-2"></div>
          <p className="text-center font-bold text-sm">DOCUMENTO EQUIVALENTE FACTURA No. DSE</p>
          
          {/* Client Info - Left aligned */}
          <div className="text-left text-xs space-y-0.5 pt-2">
            <p><span className="font-medium">Ciudad y fecha:</span> Girardot, {formatDate(invoiceDate)}</p>
            <p><span className="font-medium">Cliente:</span> MAKTUB MA S.A.S</p>
            <p><span className="font-medium">NIT:</span> 900.827.439-4</p>
            <p><span className="font-medium">Dirección:</span> CALLE 21 No 11 21 GIRARDOT</p>
            <p><span className="font-medium">Teléfono:</span> 3113988647</p>
          </div>
          
          {/* Contract Object Box */}
          <div className="border-2 border-foreground p-4 rounded-lg space-y-2">
            <p className="text-xs text-justify">
              POR PRESTACION DE SERVICIOS COMO: ({contractDetails?.description || 'Sin descripción'}) DEL PERIODO DEL MES DE {invoiceDate ? new Date(invoiceDate + 'T00:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase() : '_______________'} SEGÚN CONTRATO No. {contractDetails?.contract_number_original || contractDetails?.contract_number || '___'}
            </p>
            
            {/* Blank row */}
            <div className="h-2"></div>
            
            {/* Amount row - centered */}
            <p className="text-xs text-center font-bold">
              SON: {amount ? formatCurrency(parseFloat(amount)) : '$0'}
            </p>
            
            {/* Amount in words - centered */}
            <p className="text-xs text-center">
              {amountInWords || '_______________'}
            </p>
            
            {/* Blank row */}
            <div className="h-2"></div>
            
            {/* Bank account row - centered */}
            <p className="text-xs text-center">
              N0. CUENTA BANCARIA N° {userProfile?.bank_account || '_______________'} DE AHORROS
            </p>
            
            {/* Bank name row - centered */}
            <p className="text-xs text-center">
              BANCO: {userProfile?.bank_name || '_______________'}
            </p>
            
            {/* Blank row */}
            <div className="h-2"></div>
            
            {/* Legal declaration - justified */}
            <p className="text-xs text-justify">
              Bajo la gravedad de juramento informo que no he contratado con más de 1 empleador por un término igual o superior a 90 días, y por consiguiente solicito se me aplica la retención en la fuente por salarios en virtud de lo señalado en el parágrafo 2 del artículo 383 del estatuto tributario, reglamentado por el artículo 1.2.4.1.6 del decreto 1625 de 2016, adicional informo que el 80% o más de mis ingresos totales proceden de la actividad o servicio que estoy realizando SI__x__. NO_____.
            </p>
            
            {/* Blank row */}
            <div className="h-2"></div>
            
            {/* Tax benefits text */}
            <p className="text-xs text-justify">
              Deseo obtener beneficios tributarios porque cumplo con la siguiente condición y adjunto los soportes correspondientes:
            </p>
            
            {/* Blank row */}
            <div className="h-2"></div>
            
            {/* Tax benefits table */}
            <table className="w-full text-xs border-collapse border border-foreground">
              <tbody>
                <tr>
                  <td className="w-[90%] py-1 px-2 align-top border border-foreground">Pago por salud a empresas de medicina prepagada o pagos por seguros de salud</td>
                  <td className="w-[10%] py-1 px-2 text-center align-top border border-foreground">
                    <span>{benefitPrepaidHealth ? 'SI' : 'NO'}</span>
                  </td>
                </tr>
                <tr>
                  <td className="w-[90%] py-1 px-2 align-top border border-foreground">Aportes a fondos de pensiones voluntarios (APB) o cuentas para el fomento de la construcción (AFC)</td>
                  <td className="w-[10%] py-1 px-2 text-center align-top border border-foreground">
                    <span>{benefitVoluntaryPension ? 'SI' : 'NO'}</span>
                  </td>
                </tr>
                <tr>
                  <td className="w-[90%] py-1 px-2 align-top border border-foreground">Intereses o corrección monetaria en virtud de préstamos para la adquisición de vivienda</td>
                  <td className="w-[10%] py-1 px-2 text-center align-top border border-foreground">
                    <span>{benefitHousingInterest ? 'SI' : 'NO'}</span>
                  </td>
                </tr>
                <tr>
                  <td className="w-[90%] py-1 px-2 align-top border border-foreground">Aportes obligatorios al sistema de seguridad social integral en salud</td>
                  <td className="w-[10%] py-1 px-2 text-center align-top border border-foreground">
                    <span>{benefitHealthContributions ? 'SI' : 'NO'}</span>
                  </td>
                </tr>
                <tr>
                  <td className="w-[90%] py-1 px-2 align-top border border-foreground">Declaración juramentada de dependencia económica</td>
                  <td className="w-[10%] py-1 px-2 text-center align-top border border-foreground">
                    <span>{benefitEconomicDependents ? 'SI' : 'NO'}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* Blank row */}
            <div className="h-2"></div>
            
            {/* RUT Activity */}
            <p className="text-xs text-left">Actividad económica RUT</p>
            
            {/* Legal note */}
            <p className="text-xs text-left">Esta factura se asimila a una letra de cambio para todos los efectos legales Artículo 774 c de Código de Comercio.</p>
            
            {/* Blank row for spacing */}
            <div className="h-4"></div>

            {/* Signature section - centered */}
            <div className="text-center space-y-2">
              {/* Signature image or placeholder */}
              {signatureUrl ? (
                <img 
                  src={signatureUrl} 
                  alt="" 
                  className="max-h-20 mx-auto"
                />
              ) : (
                <div className="h-16 border-b border-foreground max-w-xs mx-auto"></div>
              )}
              
              {/* Contractor signature label */}
              <p className="text-xs font-semibold">FIRMA DEL CONTRATISTA</p>
              
              {/* Document info */}
              <p className="text-xs">
                C.C. {userProfile?.document_number || '_______________'} de {userProfile?.document_issue_city || '_______________'}
              </p>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>;
}