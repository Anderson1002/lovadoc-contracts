import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CertificationPreviewProps {
  contractDetails: any;
  userProfile: any;
  startDate?: Date;
  endDate?: Date;
  amount: string;
  novedades: string;
  certificationDate: string;
  supervisorName?: string;
  // Nuevos campos para formato oficial
  valorEjecutadoAntes?: string;
  riskMatrixCompliance?: boolean;
  socialSecurityVerified?: boolean;
  anexosLista?: string;
  activities?: any[];
}

export function CertificationPreview({
  contractDetails,
  userProfile,
  startDate,
  endDate,
  amount,
  novedades,
  certificationDate,
  supervisorName,
  valorEjecutadoAntes = "0",
  riskMatrixCompliance = false,
  socialSecurityVerified = true,
  anexosLista = "",
  activities = []
}: CertificationPreviewProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '_______________';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Cálculos financieros
  const valorInicial = contractDetails?.total_amount || 0;
  const valorAdicion = contractDetails?.addition_amount || 0;
  const valorTotal = valorInicial + valorAdicion;
  const valorPagoActual = amount ? parseFloat(amount) : 0;
  const valorAntes = valorEjecutadoAntes ? parseFloat(valorEjecutadoAntes) : 0;
  const totalEjecutado = valorAntes + valorPagoActual;
  const saldoPorEjecutar = valorTotal - totalEjecutado;
  const porcentajeEjecutado = valorTotal > 0 ? (totalEjecutado / valorTotal) * 100 : 0;

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header table (simulating the official format)
    autoTable(doc, {
      startY: 10,
      body: [[
        { content: 'HOSPITAL SAN RAFAEL\nDE FACATATIVÁ E.S.E.', styles: { halign: 'center', fontSize: 8, fontStyle: 'bold' } },
        { content: 'TIPO DE DOCUMENTO: FORMATO\nPROCESO: GESTIÓN JURÍDICA\nNOMBRE: CERTIFICACIÓN DE CUMPLIMIENTO\nCÓDIGO: GJ-F-1561    VERSIÓN: 4\nFECHA DE APROBACIÓN: 2024-01-01', styles: { halign: 'center', fontSize: 7 } },
        { content: 'GOBERNACIÓN DE\nCUNDINAMARCA', styles: { halign: 'center', fontSize: 8, fontStyle: 'bold' } }
      ]],
      theme: 'grid',
      styles: { cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 95 }, 2: { cellWidth: 45 } }
    });
    
    let yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Certification text
    doc.setFontSize(9);
    const certText = `El supervisor del Contrato de Prestación de Servicios No. ${contractDetails?.contract_number_original || contractDetails?.contract_number || '___'} – ${new Date().getFullYear()} CERTIFICA: Que ${userProfile?.name || '_______________'}, identificado(a) con cédula de ciudadanía No. ${userProfile?.document_number || '_______________'}, ha cumplido a satisfacción con la ejecución del contrato para el período comprendido entre ${formatDate(startDate)} y ${formatDate(endDate)}.`;
    
    const splitCertText = doc.splitTextToSize(certText, pageWidth - 28);
    doc.text(splitCertText, 14, yPosition);
    yPosition += splitCertText.length * 4 + 8;
    
    // Financial table (15 fields)
    const financialData = [
      ['NÚMERO CONTRATO', contractDetails?.contract_number_original || contractDetails?.contract_number || 'N/A'],
      ['NÚMERO CDP', contractDetails?.cdp || 'N/A'],
      ['NÚMERO RP', contractDetails?.rp || 'N/A'],
      ['FECHA RP', contractDetails?.fecha_rp ? formatDate(contractDetails.fecha_rp) : 'N/A'],
      ['RUBRO PRESUPUESTAL', contractDetails?.budget_code || 'N/A'],
      ['VALOR INICIAL CONTRATO', formatCurrency(valorInicial)],
    ];
    
    if (valorAdicion > 0) {
      financialData.push(
        ['NÚMERO ADICIÓN', contractDetails?.addition_number || 'N/A'],
        ['CDP ADICIÓN', contractDetails?.addition_cdp || 'N/A'],
        ['RP ADICIÓN', contractDetails?.addition_rp || 'N/A'],
        ['VALOR ADICIÓN', formatCurrency(valorAdicion)]
      );
    }
    
    financialData.push(
      ['VALOR TOTAL CONTRATO', formatCurrency(valorTotal)],
      ['VALOR EJECUTADO ANTES DE ESTE PAGO', formatCurrency(valorAntes)],
      ['VALOR DEL PAGO ACTUAL', formatCurrency(valorPagoActual)],
      ['TOTAL EJECUTADO', formatCurrency(totalEjecutado)],
      ['SALDO POR EJECUTAR', formatCurrency(saldoPorEjecutar)],
      ['PORCENTAJE EJECUTADO', `${porcentajeEjecutado.toFixed(2)}%`]
    );
    
    autoTable(doc, {
      startY: yPosition,
      body: financialData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 100 } }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Section 1: Services received
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('1. SERVICIOS Y/O PRODUCTOS RECIBIDOS A SATISFACCIÓN:', 14, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 5;
    
    if (activities.length > 0) {
      const activitiesText = activities.map((a, i) => `${i + 1}. ${a.activityName || a.activity_name}`).join('\n');
      const splitActivities = doc.splitTextToSize(activitiesText, pageWidth - 28);
      doc.text(splitActivities, 14, yPosition);
      yPosition += splitActivities.length * 4 + 5;
    } else {
      doc.text('Ver informe de actividades adjunto.', 14, yPosition);
      yPosition += 8;
    }
    
    // Section 2: Novedades
    doc.setFont(undefined, 'bold');
    doc.text('2. NOVEDADES O SITUACIONES ANORMALES PRESENTADAS DURANTE LA EJECUCIÓN:', 14, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 5;
    
    const novedadesText = novedades || 'Ninguna';
    const splitNovedades = doc.splitTextToSize(novedadesText, pageWidth - 28);
    doc.text(splitNovedades, 14, yPosition);
    yPosition += splitNovedades.length * 4 + 8;
    
    // Section 3: Social Security
    doc.setFont(undefined, 'bold');
    doc.text('3. CUMPLIMIENTO DE OBLIGACIONES DE SEGURIDAD SOCIAL:', 14, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 5;
    
    const ssText = 'De conformidad con lo establecido en el artículo 50 de la Ley 789 de 2002, el artículo 1 de la Ley 828 de 2003 y el artículo 23 de la Ley 1150 de 2007, se verificó que el contratista se encuentra al día con los aportes al Sistema de Seguridad Social Integral (Salud, Pensión y ARL) según la Ley 100 de 1993.';
    const splitSS = doc.splitTextToSize(ssText, pageWidth - 28);
    doc.text(splitSS, 14, yPosition);
    yPosition += splitSS.length * 4 + 3;
    doc.text(socialSecurityVerified ? '✓ Verificado' : '○ Pendiente de verificación', 14, yPosition);
    yPosition += 8;
    
    // Section 4: Risk Matrix
    doc.setFont(undefined, 'bold');
    doc.text('4. ACTIVIDADES DE TRATAMIENTO Y MONITOREO A LA MATRIZ DE RIESGO:', 14, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 5;
    doc.text(riskMatrixCompliance ? '✓ El contratista ha cumplido con las actividades de la matriz de riesgos.' : '○ Pendiente de verificación.', 14, yPosition);
    yPosition += 8;
    
    // Section 5: Anexos
    doc.setFont(undefined, 'bold');
    doc.text('5. ANEXOS:', 14, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 5;
    
    const anexos = anexosLista || '- Informe de actividades\n- Planilla de seguridad social\n- Cuenta de cobro';
    const splitAnexos = doc.splitTextToSize(anexos, pageWidth - 28);
    doc.text(splitAnexos, 14, yPosition);
    yPosition += splitAnexos.length * 4 + 15;
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Signature (only supervisor)
    doc.text('_________________________________', pageWidth / 2 - 30, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'bold');
    doc.text(supervisorName || 'SUPERVISOR DEL CONTRATO', pageWidth / 2 - 30, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 4;
    doc.text('Supervisor del Contrato', pageWidth / 2 - 30, yPosition);
    
    // Footer
    yPosition += 15;
    doc.setFontSize(7);
    doc.text('Hospital San Rafael de Facatativá E.S.E.', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 3;
    doc.text('Carrera 3 #1-55 / Facatativá, Cundinamarca - Tel: (601) 842 0222', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Fecha de Certificación: ${formatDate(certificationDate)}`, pageWidth / 2, yPosition, { align: 'center' });
    
    doc.save(`Certificacion_${contractDetails?.contract_number || 'contrato'}.pdf`);
  };

  if (!contractDetails || !startDate || !endDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vista Previa - Certificación</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete los datos del contrato y período para ver la vista previa
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Vista Previa - Certificación GJ-F-1561-V4</CardTitle>
        <Button size="sm" variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 bg-white dark:bg-card text-sm space-y-4">
          {/* Header - Official Format */}
          <div className="grid grid-cols-3 border rounded text-center text-xs">
            <div className="p-2 border-r">
              <p className="font-bold">HOSPITAL SAN RAFAEL</p>
              <p className="font-bold">DE FACATATIVÁ E.S.E.</p>
            </div>
            <div className="p-2 border-r">
              <p>TIPO DE DOCUMENTO: FORMATO</p>
              <p>PROCESO: GESTIÓN JURÍDICA</p>
              <p className="font-semibold">CERTIFICACIÓN DE CUMPLIMIENTO</p>
              <p>CÓDIGO: GJ-F-1561 VERSIÓN: 4</p>
            </div>
            <div className="p-2">
              <p className="font-bold">GOBERNACIÓN DE</p>
              <p className="font-bold">CUNDINAMARCA</p>
            </div>
          </div>
          
          {/* Certification Text */}
          <div className="text-xs text-justify">
            <p>
              El supervisor del Contrato de Prestación de Servicios No. <strong>{contractDetails?.contract_number_original || contractDetails?.contract_number}</strong> – {new Date().getFullYear()} CERTIFICA: 
              Que <strong>{userProfile?.name}</strong>, identificado(a) con cédula de ciudadanía No. <strong>{userProfile?.document_number}</strong>, 
              ha cumplido a satisfacción con la ejecución del contrato para el período comprendido entre <strong>{formatDate(startDate)}</strong> y <strong>{formatDate(endDate)}</strong>.
            </p>
          </div>
          
          {/* Financial Table */}
          <div className="border rounded">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">NÚMERO CONTRATO</td>
                  <td className="p-1">{contractDetails?.contract_number_original || contractDetails?.contract_number}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">NÚMERO CDP</td>
                  <td className="p-1">{contractDetails?.cdp || 'N/A'}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">NÚMERO RP</td>
                  <td className="p-1">{contractDetails?.rp || 'N/A'}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">RUBRO PRESUPUESTAL</td>
                  <td className="p-1">{contractDetails?.budget_code || 'N/A'}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">VALOR INICIAL CONTRATO</td>
                  <td className="p-1">{formatCurrency(valorInicial)}</td>
                </tr>
                {valorAdicion > 0 && (
                  <>
                    <tr className="border-b">
                      <td className="p-1 border-r font-semibold bg-muted">VALOR ADICIÓN</td>
                      <td className="p-1">{formatCurrency(valorAdicion)}</td>
                    </tr>
                  </>
                )}
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">VALOR TOTAL CONTRATO</td>
                  <td className="p-1 font-bold">{formatCurrency(valorTotal)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">VALOR EJECUTADO ANTES</td>
                  <td className="p-1">{formatCurrency(valorAntes)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">VALOR PAGO ACTUAL</td>
                  <td className="p-1">{formatCurrency(valorPagoActual)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">TOTAL EJECUTADO</td>
                  <td className="p-1 font-bold">{formatCurrency(totalEjecutado)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1 border-r font-semibold bg-muted">SALDO POR EJECUTAR</td>
                  <td className="p-1">{formatCurrency(saldoPorEjecutar)}</td>
                </tr>
                <tr>
                  <td className="p-1 border-r font-semibold bg-muted">% EJECUTADO</td>
                  <td className="p-1 font-bold text-primary">{porcentajeEjecutado.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Section 1: Services */}
          <div>
            <p className="font-semibold text-xs text-primary">1. SERVICIOS Y/O PRODUCTOS RECIBIDOS A SATISFACCIÓN:</p>
            <div className="text-xs mt-1 pl-2">
              {activities.length > 0 ? (
                <ul className="list-disc list-inside">
                  {activities.slice(0, 5).map((act, idx) => (
                    <li key={idx}>{act.activityName || act.activity_name}</li>
                  ))}
                  {activities.length > 5 && <li>...y {activities.length - 5} más</li>}
                </ul>
              ) : (
                <p className="text-muted-foreground">Ver informe de actividades adjunto.</p>
              )}
            </div>
          </div>
          
          {/* Section 2: Novedades */}
          <div>
            <p className="font-semibold text-xs text-primary">2. NOVEDADES O SITUACIONES ANORMALES:</p>
            <p className="text-xs mt-1 pl-2">{novedades || 'Ninguna'}</p>
          </div>
          
          {/* Section 3: Social Security */}
          <div>
            <p className="font-semibold text-xs text-primary">3. CUMPLIMIENTO DE OBLIGACIONES DE SEGURIDAD SOCIAL:</p>
            <p className="text-xs mt-1 pl-2 text-muted-foreground">
              De conformidad con el artículo 50 de la Ley 789 de 2002 y la Ley 100 de 1993...
            </p>
            <p className="text-xs pl-2 mt-1">
              {socialSecurityVerified ? '✓ Verificado' : '○ Pendiente'}
            </p>
          </div>
          
          {/* Section 4: Risk Matrix */}
          <div>
            <p className="font-semibold text-xs text-primary">4. MATRIZ DE RIESGO:</p>
            <p className="text-xs mt-1 pl-2">
              {riskMatrixCompliance ? '✓ Cumple con las actividades de la matriz de riesgos' : '○ Pendiente de verificación'}
            </p>
          </div>
          
          {/* Section 5: Anexos */}
          <div>
            <p className="font-semibold text-xs text-primary">5. ANEXOS:</p>
            <p className="text-xs mt-1 pl-2 whitespace-pre-line">
              {anexosLista || '- Informe de actividades\n- Planilla de seguridad social\n- Cuenta de cobro'}
            </p>
          </div>
          
          {/* Signature (only supervisor) */}
          <div className="pt-6 text-center">
            <div className="border-t border-foreground pt-1 inline-block px-8 mt-8">
              <p className="font-semibold text-xs">{supervisorName || 'SUPERVISOR DEL CONTRATO'}</p>
              <p className="text-muted-foreground text-xs">Supervisor del Contrato</p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center pt-4 border-t mt-4">
            <p className="text-xs text-muted-foreground">Hospital San Rafael de Facatativá E.S.E.</p>
            <p className="text-xs text-muted-foreground">Carrera 3 #1-55 / Facatativá, Cundinamarca - Tel: (601) 842 0222</p>
            <p className="text-xs mt-2">Fecha de Certificación: {formatDate(certificationDate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
