import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoHospital from "@/assets/logo-hospital.jpg";
import logoGobernacion from "@/assets/logo-gobernacion.jpg";
import logoCertificaciones from "@/assets/logo-certificaciones.png";

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

  // Función helper para convertir imagen a base64
  const getBase64FromUrl = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.src = url;
    });
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Cargar logos como base64
    const hospitalLogoBase64 = await getBase64FromUrl(logoHospital);
    const gobernacionLogoBase64 = await getBase64FromUrl(logoGobernacion);
    
    // Header table with logos on sides
    autoTable(doc, {
      startY: 10,
      body: [[
        { content: '', styles: { halign: 'center', minCellHeight: 28 } },
        { content: '', styles: { halign: 'center', minCellHeight: 28 } },
        { content: '', styles: { halign: 'center', minCellHeight: 28 } }
      ]],
      theme: 'grid',
      styles: { cellPadding: 0 },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 100 }, 2: { cellWidth: 45 } },
      didDrawCell: (data) => {
        // Logo Hospital (columna izquierda)
        if (data.row.index === 0 && data.column.index === 0) {
          doc.addImage(hospitalLogoBase64, 'JPEG', data.cell.x + 2, data.cell.y + 4, 40, 20);
        }
        // Logo Gobernación (columna derecha)
        if (data.row.index === 0 && data.column.index === 2) {
          doc.addImage(gobernacionLogoBase64, 'JPEG', data.cell.x + 2, data.cell.y + 4, 40, 20);
        }
        // Tabla central con estructura de 4 filas
        if (data.row.index === 0 && data.column.index === 1) {
          const cellX = data.cell.x;
          const cellY = data.cell.y;
          const cellWidth = data.cell.width;
          const cellHeight = data.cell.height;
          const rowHeight = cellHeight / 4;
          
          doc.setFontSize(6);
          doc.setDrawColor(0);
          doc.setLineWidth(0.1);
          
          // Fila 1: Encabezados
          doc.setFillColor(240, 240, 240);
          doc.rect(cellX, cellY, cellWidth / 2, rowHeight, 'FD');
          doc.rect(cellX + cellWidth / 2, cellY, cellWidth / 2, rowHeight, 'FD');
          
          doc.setFont(undefined, 'bold');
          doc.text('Tipo de Documento', cellX + 2, cellY + rowHeight / 2 + 1);
          doc.text('Proceso, Servicio o actividad que lo Genera:', cellX + cellWidth / 2 + 2, cellY + rowHeight / 2 + 1);
          
          // Fila 2: Valores
          doc.setFillColor(255, 255, 255);
          doc.rect(cellX, cellY + rowHeight, cellWidth / 2, rowHeight, 'FD');
          doc.rect(cellX + cellWidth / 2, cellY + rowHeight, cellWidth / 2, rowHeight, 'FD');
          
          doc.setFont(undefined, 'normal');
          doc.text('FORMATO', cellX + cellWidth / 4, cellY + rowHeight + rowHeight / 2 + 1, { align: 'center' });
          doc.text('GESTIÓN JURÍDICA', cellX + cellWidth * 3 / 4, cellY + rowHeight + rowHeight / 2 + 1, { align: 'center' });
          
          // Fila 3: Sub-encabezados (3 columnas)
          const col3Width = cellWidth / 3;
          doc.setFillColor(240, 240, 240);
          doc.rect(cellX, cellY + rowHeight * 2, col3Width, rowHeight, 'FD');
          doc.rect(cellX + col3Width, cellY + rowHeight * 2, col3Width, rowHeight, 'FD');
          doc.rect(cellX + col3Width * 2, cellY + rowHeight * 2, col3Width, rowHeight, 'FD');
          
          doc.setFont(undefined, 'bold');
          doc.text('Nombre', cellX + col3Width / 2, cellY + rowHeight * 2 + rowHeight / 2 + 1, { align: 'center' });
          doc.text('Código y Versión', cellX + col3Width + col3Width / 2, cellY + rowHeight * 2 + rowHeight / 2 + 1, { align: 'center' });
          doc.text('Fecha aprobación', cellX + col3Width * 2 + col3Width / 2, cellY + rowHeight * 2 + rowHeight / 2 + 1, { align: 'center' });
          
          // Fila 4: Valores finales (3 columnas)
          doc.setFillColor(255, 255, 255);
          doc.rect(cellX, cellY + rowHeight * 3, col3Width, rowHeight, 'FD');
          doc.rect(cellX + col3Width, cellY + rowHeight * 3, col3Width, rowHeight, 'FD');
          doc.rect(cellX + col3Width * 2, cellY + rowHeight * 3, col3Width, rowHeight, 'FD');
          
          doc.setFont(undefined, 'normal');
          doc.setFontSize(5);
          doc.text('FORMATO INFORME', cellX + col3Width / 2, cellY + rowHeight * 3 + 3, { align: 'center' });
          doc.text('SUPERVISOR DEL CONTRATO', cellX + col3Width / 2, cellY + rowHeight * 3 + 6, { align: 'center' });
          doc.setFontSize(6);
          doc.text('GJ-F-1561-V4', cellX + col3Width + col3Width / 2, cellY + rowHeight * 3 + rowHeight / 2 + 1, { align: 'center' });
          doc.text('24/01/2025', cellX + col3Width * 2 + col3Width / 2, cellY + rowHeight * 3 + rowHeight / 2 + 1, { align: 'center' });
        }
      }
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
    const certPart1 = `Que ${userProfile?.name || '_______________'}, identificada(o) con la cédula de ciudadanía No. ${userProfile?.document_number || '_______________'} de ${userProfile?.document_issue_city || '_______________'}, cumplió a satisfacción con las actividades relacionadas con el objeto: "`;
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
    
    // Tabla de información financiera del contrato
    const plazoEjecucion = (() => {
      let plazo = '';
      if (contractDetails?.execution_period_months) plazo += `${contractDetails.execution_period_months} mes(es)`;
      if (contractDetails?.execution_period_days) plazo += ` ${contractDetails.execution_period_days} día(s)`;
      return plazo.trim() || 'N/A';
    })();
    
    autoTable(doc, {
      startY: yPosition,
      body: [
        ['VALOR INICIAL DEL CONTRATO', formatCurrency(valorInicial)],
        ['No. CDP', contractDetails?.cdp || 'N/A'],
        ['No. RP', contractDetails?.rp || 'N/A'],
        ['CÓDIGO RUBRO PRESUPUESTAL', contractDetails?.budget_code || 'N/A'],
        ['PLAZO DE EJECUCIÓN', plazoEjecucion],
        ['OTRO SI MODIFICATORIO No.', contractDetails?.addition_number || 'N/A'],
        ['No. CDP (Adición)', contractDetails?.addition_cdp || 'N/A'],
        ['No. RP (Adición)', contractDetails?.addition_rp || 'N/A'],
        ['VALOR ADICIÓN', formatCurrency(valorAdicion)],
        ['VALOR CONTRATO INICIAL + ADICIÓN', formatCurrency(valorTotal)],
        ['VALOR EJECUTADO ANTES DE ESTE PAGO', formatCurrency(valorAntes)],
        ['VALOR A PAGAR', formatCurrency(valorPagoActual)],
        ['TOTAL EJECUTADO', formatCurrency(totalEjecutado)],
        ['SALDO POR EJECUTAR', formatCurrency(saldoPorEjecutar)],
        ['PORCENTAJE DE EJECUTADO', `${porcentajeEjecutado.toFixed(2)}%`]
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 
        0: { cellWidth: 90, fontStyle: 'bold', fillColor: [240, 240, 240] },
        1: { cellWidth: 90, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 6;
    
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
    
    // Footer con dirección a la izquierda y logos a la derecha
    const certLogoBase64 = await getBase64FromUrl(logoCertificaciones);
    yPosition += 15;
    
    // Línea superior del footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 5;
    
    // Texto a la izquierda
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.text('Sede Principal Carrera 2 # 1-80 Facatativá – Cundinamarca,', 14, yPosition);
    yPosition += 3;
    doc.setTextColor(0, 0, 255);
    doc.text('www.hospitalfacatativa.gov.co', 14, yPosition);
    doc.setTextColor(0, 0, 0);
    
    // Logo de certificaciones a la derecha
    doc.addImage(certLogoBase64, 'PNG', pageWidth - 60, yPosition - 7, 45, 12);
    
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
            <div className="p-2 border-r flex items-center justify-center">
              <img src={logoHospital} alt="Hospital San Rafael de Facatativá E.S.E." className="h-14 object-contain" />
            </div>
            <div className="p-0 border-r">
              <table className="w-full h-full text-[10px] border-collapse">
                <tbody>
                  {/* Fila 1: Encabezados principales */}
                  <tr>
                    <td className="border-b border-r p-1 bg-muted font-semibold w-1/2">
                      Tipo de Documento
                    </td>
                    <td className="border-b p-1 bg-muted font-semibold" colSpan={2}>
                      Proceso, Servicio o actividad que lo Genera:
                    </td>
                  </tr>
                  {/* Fila 2: Valores principales */}
                  <tr>
                    <td className="border-b border-r p-1 text-center">FORMATO</td>
                    <td className="border-b p-1 text-center" colSpan={2}>GESTIÓN JURÍDICA</td>
                  </tr>
                  {/* Fila 3: Sub-encabezados */}
                  <tr>
                    <td className="border-b border-r p-1 bg-muted font-semibold">Nombre</td>
                    <td className="border-b border-r p-1 bg-muted font-semibold">Código y Versión</td>
                    <td className="border-b p-1 bg-muted font-semibold">Fecha aprobación</td>
                  </tr>
                  {/* Fila 4: Valores finales */}
                  <tr>
                    <td className="border-r p-1 text-center text-[9px]">
                      FORMATO INFORME SUPERVISOR DEL CONTRATO
                    </td>
                    <td className="border-r p-1 text-center">GJ-F-1561-V4</td>
                    <td className="p-1 text-center">24/01/2025</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-2 flex items-center justify-center">
              <img src={logoGobernacion} alt="Gobernación de Cundinamarca" className="h-14 object-contain" />
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
              Que <strong>{userProfile?.name}</strong>, identificada(o) con la cédula de ciudadanía No. <strong>{userProfile?.document_number}</strong> de {userProfile?.document_issue_city || '_______________'}, 
              cumplió a satisfacción con las actividades relacionadas con el objeto: "<strong className="uppercase">{contractObject}</strong>", 
              del Contrato de Prestación de Servicios No. {contractNumber} – {currentYear}, correspondiente al periodo del mes de <strong>{certificationMonth || '_______________'}</strong> del año {currentYear}, 
              y cumple con el pago de la Seguridad Social Integral.
          </p>
          </div>
          
          {/* Tabla de información financiera del contrato */}
          <div className="my-4">
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold w-1/2">VALOR INICIAL DEL CONTRATO</td>
                  <td className="border p-1.5 text-right">{formatCurrency(valorInicial)}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">No. CDP</td>
                  <td className="border p-1.5 text-right">{contractDetails?.cdp || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">No. RP</td>
                  <td className="border p-1.5 text-right">{contractDetails?.rp || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">CÓDIGO RUBRO PRESUPUESTAL</td>
                  <td className="border p-1.5 text-right">{contractDetails?.budget_code || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">PLAZO DE EJECUCIÓN</td>
                  <td className="border p-1.5 text-right">
                    {contractDetails?.execution_period_months ? `${contractDetails.execution_period_months} mes(es)` : ''}
                    {contractDetails?.execution_period_days ? ` ${contractDetails.execution_period_days} día(s)` : ''}
                    {!contractDetails?.execution_period_months && !contractDetails?.execution_period_days ? 'N/A' : ''}
                  </td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">OTRO SI MODIFICATORIO No.</td>
                  <td className="border p-1.5 text-right">{contractDetails?.addition_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">No. CDP (Adición)</td>
                  <td className="border p-1.5 text-right">{contractDetails?.addition_cdp || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">No. RP (Adición)</td>
                  <td className="border p-1.5 text-right">{contractDetails?.addition_rp || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">VALOR ADICIÓN</td>
                  <td className="border p-1.5 text-right">{formatCurrency(valorAdicion)}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">VALOR CONTRATO INICIAL + ADICIÓN</td>
                  <td className="border p-1.5 text-right font-semibold">{formatCurrency(valorTotal)}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">VALOR EJECUTADO ANTES DE ESTE PAGO</td>
                  <td className="border p-1.5 text-right">{formatCurrency(valorAntes)}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">VALOR A PAGAR</td>
                  <td className="border p-1.5 text-right font-semibold text-primary">{formatCurrency(valorPagoActual)}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">TOTAL EJECUTADO</td>
                  <td className="border p-1.5 text-right font-semibold">{formatCurrency(totalEjecutado)}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">SALDO POR EJECUTAR</td>
                  <td className="border p-1.5 text-right">{formatCurrency(saldoPorEjecutar)}</td>
                </tr>
                <tr>
                  <td className="border p-1.5 bg-muted font-semibold">PORCENTAJE DE EJECUTADO</td>
                  <td className="border p-1.5 text-right font-semibold">{porcentajeEjecutado.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
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
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            {/* Lado izquierdo - Dirección */}
            <div className="text-left">
              <p className="text-xs text-muted-foreground italic">
                Sede Principal Carrera 2 # 1-80 Facatativá – Cundinamarca,
              </p>
              <a 
                href="https://www.hospitalfacatativa.gov.co" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline italic"
              >
                www.hospitalfacatativa.gov.co
              </a>
            </div>
            
            {/* Lado derecho - Logos de certificaciones */}
            <div className="flex-shrink-0">
              <img 
                src={logoCertificaciones} 
                alt="Certificaciones" 
                className="h-10 object-contain"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
