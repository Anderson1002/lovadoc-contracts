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
  // Campos para formato oficial
  valorEjecutadoAntes?: string;
  riskMatrixCompliance?: boolean;
  socialSecurityVerified?: boolean;
  anexosLista?: string;
  activities?: any[];
  // Nuevos campos
  certificationMonth?: string;
  reportDeliveryDate?: string;
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
  activities = [],
  certificationMonth = "",
  reportDeliveryDate = ""
}: CertificationPreviewProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '_______________';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatDateShort = (date: string | undefined) => {
    if (!date) return '___/___/______';
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  const currentYear = new Date().getFullYear();
  const contractNumber = contractDetails?.contract_number_original || contractDetails?.contract_number || '___';
  const contractObject = contractDetails?.description || '[OBJETO DEL CONTRATO]';

  // Texto de novedades por defecto
  const novedadesTexto = novedades || 'Durante el presente período no se han presentado novedades o situaciones anormales que afecten el desarrollo del contrato.';

  // Anexos por defecto
  const anexosTexto = anexosLista || '1. Informe ejecución actividades\n2. Planilla pago seguridad social';

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header table (official format)
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
    
    // Main certification title
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(`El supervisor del Contrato de Prestación de Servicios No. ${contractNumber} – ${currentYear}`, 14, yPosition);
    yPosition += 5;
    doc.text('CERTIFICA:', 14, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'normal');
    
    // Main certification text with object in bold
    const certPart1 = `Que ${userProfile?.name || '_______________'}, identificada(o) con la cédula de ciudadanía No. ${userProfile?.document_number || '_______________'} de ${userProfile?.city || '_______________'}, cumplió a satisfacción con las actividades relacionadas con el objeto: "`;
    const certPart2 = contractObject.toUpperCase();
    const certPart3 = `", del Contrato de Prestación de Servicios No. ${contractNumber} – ${currentYear}, correspondiente al periodo del mes de ${certificationMonth || '_______________'} del año ${currentYear}, y cumple con el pago de la Seguridad Social Integral.`;
    
    // Write text with bold object
    doc.setFontSize(9);
    let xPos = 14;
    const splitPart1 = doc.splitTextToSize(certPart1, pageWidth - 28);
    doc.text(splitPart1, xPos, yPosition);
    yPosition += splitPart1.length * 4;
    
    doc.setFont(undefined, 'bold');
    const splitPart2 = doc.splitTextToSize(certPart2, pageWidth - 28);
    doc.text(splitPart2, xPos, yPosition);
    yPosition += splitPart2.length * 4;
    
    doc.setFont(undefined, 'normal');
    const splitPart3 = doc.splitTextToSize(certPart3, pageWidth - 28);
    doc.text(splitPart3, xPos, yPosition);
    yPosition += splitPart3.length * 4 + 6;
    
    // Section 1: Services received
    doc.setFont(undefined, 'bold');
    doc.text(`1. SERVICIOS Y/O PRODUCTOS RECIBIDOS A SATISFACCIÓN CORRESPONDIENTES AL PERIODO DEL MES DE ${certificationMonth || '___'} DE ${currentYear}.`, 14, yPosition, { maxWidth: pageWidth - 28 });
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    
    const section1Text = `Las actividades desarrolladas por el contratista en el periodo descrito anteriormente, relacionadas con cada una de las actividades específicas establecidas en los estudios previos y del contrato se verifica el cumplimiento a satisfacción de la obligación establecida.`;
    const splitSection1 = doc.splitTextToSize(section1Text, pageWidth - 28);
    doc.text(splitSection1, 14, yPosition);
    yPosition += splitSection1.length * 4 + 4;
    
    // NOTA 1
    doc.setFont(undefined, 'bold');
    doc.text('NOTA 1:', 14, yPosition);
    doc.setFont(undefined, 'normal');
    const nota1Text = ` Forma parte del presente documento el informe de actividades previamente entregado por el contratista el ${formatDateShort(reportDeliveryDate)} el cual deberá contener como mínimo: 1. Detalle del cumplimiento de cada una de las obligaciones con sus debidos soportes y evidencias.`;
    const splitNota1 = doc.splitTextToSize(nota1Text, pageWidth - 35);
    doc.text(splitNota1, 28, yPosition);
    yPosition += splitNota1.length * 4 + 3;
    
    // NOTA 2
    doc.setFont(undefined, 'bold');
    doc.text('NOTA 2:', 14, yPosition);
    doc.setFont(undefined, 'normal');
    const nota2Text = ` El informe de ejecución del contratista junto con los soportes del caso deben reposar igualmente en el expediente contractual electrónico. Si existen entregables físicos deberán reposar en la carpeta contractual.`;
    const splitNota2 = doc.splitTextToSize(nota2Text, pageWidth - 35);
    doc.text(splitNota2, 28, yPosition);
    yPosition += splitNota2.length * 4 + 6;
    
    // Section 2: Novedades
    doc.setFont(undefined, 'bold');
    doc.text('2. NOVEDADES O SITUACIONES ANORMALES PRESENTADAS DURANTE EL DESARROLLO DEL CONTRATO.', 14, yPosition, { maxWidth: pageWidth - 28 });
    yPosition += 6;
    doc.setFont(undefined, 'normal');
    const splitNovedades = doc.splitTextToSize(novedadesTexto, pageWidth - 28);
    doc.text(splitNovedades, 14, yPosition);
    yPosition += splitNovedades.length * 4 + 6;
    
    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Section 3: Social Security
    doc.setFont(undefined, 'bold');
    const section3Title = '3. CUMPLIMIENTO DE OBLIGACIONES DEL CONTRATISTA RELACIONADAS CON EL PAGO DE SEGURIDAD SOCIAL INTEGRAL Y APORTES PARAFISCALES';
    const splitSection3Title = doc.splitTextToSize(section3Title, pageWidth - 28);
    doc.text(splitSection3Title, 14, yPosition);
    yPosition += splitSection3Title.length * 4 + 2;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    const section3Subtitle = '(Ley 100 de 1993 y sus decretos reglamentarios, en el artículo 50 de la Ley 789 de 2002, Leyes 828 de 2003, 1122 de 2007, 1150 de 2007 y 1562 de 2012, Decretos 1072 de 2015 y 1273 de 2018 y demás normas concordantes).';
    const splitSection3Sub = doc.splitTextToSize(section3Subtitle, pageWidth - 28);
    doc.text(splitSection3Sub, 14, yPosition);
    yPosition += splitSection3Sub.length * 3 + 3;
    
    doc.setFontSize(9);
    const section3Text = 'Se verificó el cumplimiento de las obligaciones del contratista con los sistemas de Seguridad Social Integral en salud, pensiones y riesgos laborales, información que se puede constatar en la planilla o certificación de pago correspondiente al periodo aquí relacionado.';
    const splitSection3 = doc.splitTextToSize(section3Text, pageWidth - 28);
    doc.text(splitSection3, 14, yPosition);
    yPosition += splitSection3.length * 4 + 6;
    
    // Section 4: Risk Matrix
    doc.setFont(undefined, 'bold');
    doc.text('4. ACTIVIDADES DE TRATAMIENTO Y MONITOREO A LA MATRIZ DE RIESGO DEL CONTRATO.', 14, yPosition, { maxWidth: pageWidth - 28 });
    yPosition += 6;
    doc.setFont(undefined, 'normal');
    
    const section4Text = 'Se ha realizado el monitoreo por parte de la supervisión, de acuerdo con el tratamiento y/o control de los riesgos establecido en la matriz de los estudios previos del contrato, evidenciándose que no hay materialización de los mismos. Lo anterior se verifica a través del informe mensual de actividades del contratista de acuerdo con las obligaciones específicas pactadas, las cuales han tenido satisfactorio cumplimiento a la fecha.';
    const splitSection4 = doc.splitTextToSize(section4Text, pageWidth - 28);
    doc.text(splitSection4, 14, yPosition);
    yPosition += splitSection4.length * 4 + 6;
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Section 5: Anexos
    doc.setFont(undefined, 'bold');
    doc.text('5. ANEXOS', 14, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'normal');
    
    const splitAnexos = doc.splitTextToSize(anexosTexto, pageWidth - 28);
    doc.text(splitAnexos, 14, yPosition);
    yPosition += splitAnexos.length * 4 + 15;
    
    // Check if we need a new page for signature
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
    
    doc.save(`Certificacion_${contractNumber}.pdf`);
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
          
          {/* Certification Title */}
          <div className="text-xs">
            <p className="font-bold">
              El supervisor del Contrato de Prestación de Servicios No. {contractNumber} – {currentYear}
            </p>
            <p className="font-bold">CERTIFICA:</p>
          </div>
          
          {/* Certification Text with object in bold */}
          <div className="text-xs text-justify">
            <p>
              Que <strong>{userProfile?.name}</strong>, identificada(o) con la cédula de ciudadanía No. <strong>{userProfile?.document_number}</strong> de {userProfile?.city || '_______________'}, 
              cumplió a satisfacción con las actividades relacionadas con el objeto: "<strong className="uppercase">{contractObject}</strong>", 
              del Contrato de Prestación de Servicios No. {contractNumber} – {currentYear}, correspondiente al periodo del mes de <strong>{certificationMonth || '_______________'}</strong> del año {currentYear}, 
              y cumple con el pago de la Seguridad Social Integral.
            </p>
          </div>
          
          {/* Section 1: Services */}
          <div>
            <p className="font-bold text-xs text-primary">
              1. SERVICIOS Y/O PRODUCTOS RECIBIDOS A SATISFACCIÓN CORRESPONDIENTES AL PERIODO DEL MES DE {certificationMonth || '___'} DE {currentYear}.
            </p>
            <p className="text-xs mt-2 text-justify">
              Las actividades desarrolladas por el contratista en el periodo descrito anteriormente, relacionadas con cada una de las actividades específicas establecidas en los estudios previos y del contrato se verifica el cumplimiento a satisfacción de la obligación establecida.
            </p>
            <p className="text-xs mt-2">
              <strong>NOTA 1:</strong> Forma parte del presente documento el informe de actividades previamente entregado por el contratista el <strong>{formatDateShort(reportDeliveryDate)}</strong> el cual deberá contener como mínimo: 1. Detalle del cumplimiento de cada una de las obligaciones con sus debidos soportes y evidencias.
            </p>
            <p className="text-xs mt-2">
              <strong>NOTA 2:</strong> El informe de ejecución del contratista junto con los soportes del caso deben reposar igualmente en el expediente contractual electrónico. Si existen entregables físicos deberán reposar en la carpeta contractual.
            </p>
          </div>
          
          {/* Section 2: Novedades */}
          <div>
            <p className="font-bold text-xs text-primary">2. NOVEDADES O SITUACIONES ANORMALES PRESENTADAS DURANTE EL DESARROLLO DEL CONTRATO.</p>
            <p className="text-xs mt-1 text-justify">{novedadesTexto}</p>
          </div>
          
          {/* Section 3: Social Security */}
          <div>
            <p className="font-bold text-xs text-primary">3. CUMPLIMIENTO DE OBLIGACIONES DEL CONTRATISTA RELACIONADAS CON EL PAGO DE SEGURIDAD SOCIAL INTEGRAL Y APORTES PARAFISCALES</p>
            <p className="text-xs text-muted-foreground mt-1">
              (Ley 100 de 1993 y sus decretos reglamentarios, en el artículo 50 de la Ley 789 de 2002, Leyes 828 de 2003, 1122 de 2007, 1150 de 2007 y 1562 de 2012, Decretos 1072 de 2015 y 1273 de 2018 y demás normas concordantes).
            </p>
            <p className="text-xs mt-2 text-justify">
              Se verificó el cumplimiento de las obligaciones del contratista con los sistemas de Seguridad Social Integral en salud, pensiones y riesgos laborales, información que se puede constatar en la planilla o certificación de pago correspondiente al periodo aquí relacionado.
            </p>
          </div>
          
          {/* Section 4: Risk Matrix */}
          <div>
            <p className="font-bold text-xs text-primary">4. ACTIVIDADES DE TRATAMIENTO Y MONITOREO A LA MATRIZ DE RIESGO DEL CONTRATO.</p>
            <p className="text-xs mt-1 text-justify">
              Se ha realizado el monitoreo por parte de la supervisión, de acuerdo con el tratamiento y/o control de los riesgos establecido en la matriz de los estudios previos del contrato, evidenciándose que no hay materialización de los mismos. Lo anterior se verifica a través del informe mensual de actividades del contratista de acuerdo con las obligaciones específicas pactadas, las cuales han tenido satisfactorio cumplimiento a la fecha.
            </p>
          </div>
          
          {/* Section 5: Anexos */}
          <div>
            <p className="font-bold text-xs text-primary">5. ANEXOS</p>
            <p className="text-xs mt-1 whitespace-pre-line">{anexosTexto}</p>
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
