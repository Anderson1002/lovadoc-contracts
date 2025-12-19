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
}

export function CertificationPreview({
  contractDetails,
  userProfile,
  startDate,
  endDate,
  amount,
  novedades,
  certificationDate,
  supervisorName
}: CertificationPreviewProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '_______________';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(10);
    doc.text("HOSPITAL DEPARTAMENTAL DE VILLAVICENCIO E.S.E.", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(8);
    doc.text("NIT: 892.000.401-0", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("CERTIFICACIÓN DE CUMPLIMIENTO", pageWidth / 2, 30, { align: "center" });
    doc.text("GJ-F-1561-V4", pageWidth / 2, 36, { align: "center" });
    doc.setFont(undefined, "normal");
    
    let yPosition = 50;
    
    // Section 1: Contract Data
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("1. DATOS DEL CONTRATO", 14, yPosition);
    doc.setFont(undefined, "normal");
    yPosition += 8;
    
    const contractData = [
      ["Número de Contrato:", contractDetails?.contract_number_original || contractDetails?.contract_number || "No especificado"],
      ["CDP:", contractDetails?.cdp || "No especificado"],
      ["RP:", contractDetails?.rp || "No especificado"],
      ["Valor Total:", formatCurrency(contractDetails?.total_amount || 0)],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      body: contractData,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Section 2: Contractor Data
    doc.setFont(undefined, "bold");
    doc.text("2. DATOS DEL CONTRATISTA", 14, yPosition);
    doc.setFont(undefined, "normal");
    yPosition += 8;
    
    const contractorData = [
      ["Nombre:", userProfile?.name || "No especificado"],
      ["Documento:", userProfile?.document_number || "No especificado"],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      body: contractorData,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Section 3: Execution Period
    doc.setFont(undefined, "bold");
    doc.text("3. PERÍODO CERTIFICADO", 14, yPosition);
    doc.setFont(undefined, "normal");
    yPosition += 8;
    
    const periodData = [
      ["Desde:", formatDate(startDate)],
      ["Hasta:", formatDate(endDate)],
      ["Valor del Período:", amount ? formatCurrency(parseFloat(amount)) : "No especificado"],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      body: periodData,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Section 4: Certification Text
    doc.setFont(undefined, "bold");
    doc.text("4. CERTIFICACIÓN", 14, yPosition);
    doc.setFont(undefined, "normal");
    yPosition += 8;
    
    const certText = `El suscrito supervisor certifica que el contratista ${userProfile?.name || '_______________'}, identificado con ${userProfile?.document_number || '_______________'}, ha cumplido satisfactoriamente con las obligaciones contractuales durante el período comprendido entre ${formatDate(startDate)} y ${formatDate(endDate)}, por un valor de ${amount ? formatCurrency(parseFloat(amount)) : '_______________'}.`;
    
    doc.setFontSize(9);
    const splitText = doc.splitTextToSize(certText, pageWidth - 28);
    doc.text(splitText, 14, yPosition);
    yPosition += splitText.length * 5 + 10;
    
    // Section 5: Novedades
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.text("5. NOVEDADES DURANTE LA EJECUCIÓN", 14, yPosition);
    doc.setFont(undefined, "normal");
    yPosition += 8;
    
    doc.setFontSize(9);
    const novedadesText = novedades || "Ninguna";
    const splitNovedades = doc.splitTextToSize(novedadesText, pageWidth - 28);
    doc.text(splitNovedades, 14, yPosition);
    yPosition += splitNovedades.length * 5 + 20;
    
    // Signatures
    doc.setFontSize(9);
    doc.text("_________________________________", 14, yPosition);
    doc.text("_________________________________", pageWidth - 70, yPosition);
    yPosition += 5;
    doc.text("Firma del Supervisor", 14, yPosition);
    doc.text("Firma del Contratista", pageWidth - 70, yPosition);
    yPosition += 5;
    doc.text(supervisorName || "Supervisor Asignado", 14, yPosition);
    doc.text(userProfile?.name || "", pageWidth - 70, yPosition);
    
    // Footer
    yPosition += 15;
    doc.setFontSize(8);
    doc.text(`Fecha de Certificación: ${formatDate(certificationDate)}`, 14, yPosition);
    
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
        <CardTitle className="text-lg">Vista Previa - Certificación</CardTitle>
        <Button size="sm" variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 bg-white dark:bg-card text-sm space-y-4">
          {/* Header */}
          <div className="text-center border-b pb-3">
            <p className="font-bold">HOSPITAL DEPARTAMENTAL DE VILLAVICENCIO E.S.E.</p>
            <p className="text-xs text-muted-foreground">NIT: 892.000.401-0</p>
            <p className="font-semibold mt-2">CERTIFICACIÓN DE CUMPLIMIENTO</p>
            <p className="text-xs">GJ-F-1561-V4</p>
          </div>
          
          {/* Contract Data */}
          <div>
            <p className="font-semibold text-xs text-primary">1. DATOS DEL CONTRATO</p>
            <div className="grid grid-cols-2 gap-1 text-xs mt-1">
              <p><span className="text-muted-foreground">Contrato:</span> {contractDetails?.contract_number_original || contractDetails?.contract_number}</p>
              <p><span className="text-muted-foreground">CDP:</span> {contractDetails?.cdp || 'N/A'}</p>
              <p><span className="text-muted-foreground">RP:</span> {contractDetails?.rp || 'N/A'}</p>
              <p><span className="text-muted-foreground">Valor:</span> {formatCurrency(contractDetails?.total_amount || 0)}</p>
            </div>
          </div>
          
          {/* Contractor Data */}
          <div>
            <p className="font-semibold text-xs text-primary">2. DATOS DEL CONTRATISTA</p>
            <div className="text-xs mt-1">
              <p><span className="text-muted-foreground">Nombre:</span> {userProfile?.name}</p>
              <p><span className="text-muted-foreground">Documento:</span> {userProfile?.document_number}</p>
            </div>
          </div>
          
          {/* Period */}
          <div>
            <p className="font-semibold text-xs text-primary">3. PERÍODO CERTIFICADO</p>
            <div className="grid grid-cols-3 gap-1 text-xs mt-1">
              <p><span className="text-muted-foreground">Desde:</span> {formatDate(startDate)}</p>
              <p><span className="text-muted-foreground">Hasta:</span> {formatDate(endDate)}</p>
              <p><span className="text-muted-foreground">Valor:</span> {amount ? formatCurrency(parseFloat(amount)) : 'N/A'}</p>
            </div>
          </div>
          
          {/* Certification */}
          <div>
            <p className="font-semibold text-xs text-primary">4. CERTIFICACIÓN</p>
            <p className="text-xs mt-1 text-justify">
              El suscrito supervisor certifica que el contratista <strong>{userProfile?.name}</strong>, 
              identificado con <strong>{userProfile?.document_number}</strong>, ha cumplido satisfactoriamente 
              con las obligaciones contractuales durante el período comprendido entre <strong>{formatDate(startDate)}</strong> y <strong>{formatDate(endDate)}</strong>.
            </p>
          </div>
          
          {/* Novedades */}
          <div>
            <p className="font-semibold text-xs text-primary">5. NOVEDADES</p>
            <p className="text-xs mt-1">{novedades || 'Ninguna'}</p>
          </div>
          
          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
            <div className="text-center text-xs">
              <div className="border-t border-foreground pt-1 mt-8">
                <p className="font-semibold">Firma del Supervisor</p>
                <p className="text-muted-foreground">{supervisorName || 'Supervisor Asignado'}</p>
              </div>
            </div>
            <div className="text-center text-xs">
              <div className="border-t border-foreground pt-1 mt-8">
                <p className="font-semibold">Firma del Contratista</p>
                <p className="text-muted-foreground">{userProfile?.name}</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center pt-2">
            Fecha de Certificación: {formatDate(certificationDate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
