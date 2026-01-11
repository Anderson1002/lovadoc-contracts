import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Contract {
  id: string;
  contract_number: string;
  contract_number_original?: string;
  client_name: string;
  client_document_number?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_account_number?: string;
  client_bank_name?: string;
  description?: string;
  total_amount: number;
  start_date?: string;
  end_date?: string;
}

interface UserProfile {
  name: string;
  email: string;
  document_number?: string;
  phone?: string;
  address?: string;
  nit?: string;
  tax_regime?: string;
  bank_name?: string;
  bank_account?: string;
}

interface Activity {
  activityName: string;
  actions: string;
  evidences: File[];
}

interface BillingDocumentPreviewProps {
  userProfile: UserProfile;
  selectedContract: Contract | null;
  amount: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  activities: Activity[];
  planillaNumero?: string;
  planillaValor?: string;
  planillaFecha?: string;
  signatureUrl?: string | null;
  reviewComments?: Array<{
    action: string;
    comments: string;
    created_at: string;
    reviewer: {
      name: string;
    };
  }>;
  saludNumero?: string;
  saludValor?: string;
  saludFecha?: string;
  pensionNumero?: string;
  pensionValor?: string;
  pensionFecha?: string;
  arlNumero?: string;
  arlValor?: string;
  arlFecha?: string;
}

export function BillingDocumentPreview({
  userProfile,
  selectedContract,
  amount,
  startDate,
  endDate,
  activities,
  signatureUrl,
  reviewComments,
  saludNumero,
  saludValor,
  saludFecha,
  pensionNumero,
  pensionValor,
  pensionFecha,
  arlNumero,
  arlValor,
  arlFecha
}: BillingDocumentPreviewProps) {
  
  const handleExportPDF = async () => {
    if (!selectedContract || !startDate || !endDate) return;

    // Forzamos A4 en mm para evitar variaciones de tamaño que terminan “sacando” tablas del margen.
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Márgenes visuales + un “inset” de seguridad para asegurar que NUNCA se dibuje sobre el borde.
    const marginLeft = 20;
    const marginRight = 20;
    const safeInset = 2;
    const tableMarginLeft = marginLeft + safeInset;
    const tableMarginRight = marginRight + safeInset;
    const contentWidth = pageWidth - tableMarginLeft - tableMarginRight;

    // “break-word” para jsPDF-AutoTable (evita que textos largos empujen la tabla fuera del margen)
    const makePdfSafeText = (value: string) => {
      const text = (value ?? "").toString();
      return text.replace(/[^\s]{30,}/g, (chunk) => chunk.replace(/(.{25})/g, "$1\u200b"));
    };

    const contratoObjetoPdf = makePdfSafeText(selectedContract.description || "-");

    // Calculate values
    const mesNombre = format(startDate, "MMMM", { locale: es }).toUpperCase();
    const año = format(startDate, "yyyy");

    const contractStartDate = selectedContract.start_date
      ? parseLocalDate(selectedContract.start_date)
      : startDate;
    const contractEndDate = selectedContract.end_date
      ? parseLocalDate(selectedContract.end_date)
      : endDate;

    const diffTime = Math.abs(contractEndDate.getTime() - contractStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30);
    const plazoEjecucion = diffMonths > 1 ? `${diffMonths} MESES` : `${diffDays} DÍAS`;

    const valorPago = parseFloat(amount) || 0;
    const valorInicial = selectedContract.total_amount || 0;
    const valorAdicion = 0;
    const valorContratoTotal = valorInicial + valorAdicion;
    const valorEjecutadoAntes = 0;
    const totalEjecutado = valorEjecutadoAntes + valorPago;
    const saldoPorEjecutar = valorContratoTotal - totalEjecutado;

    const formatDisplayDate = (date: Date) => format(date, "dd/MM/yyyy");

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE ACTIVIDADES", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(11);
    doc.text(`PERÍODO: DEL MES DE ${mesNombre} ${año}`, pageWidth / 2, 28, {
      align: "center",
    });

    // DATOS BÁSICOS DEL CONTRATO
    autoTable(doc, {
      startY: 35,
      margin: { left: tableMarginLeft, right: tableMarginRight },
      tableWidth: contentWidth,
      head: [[
        {
          content: "DATOS BÁSICOS DEL CONTRATO",
          colSpan: 2,
          styles: { halign: "center", fillColor: [200, 200, 200] },
        },
      ]],
      body: [
        [
          {
            content: "No. CONTRATO",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          selectedContract.contract_number_original || selectedContract.contract_number,
        ],
        [
          {
            content: "OBJETO DEL CONTRATO",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          contratoObjetoPdf,
        ],
        [
          {
            content: "NOMBRE DEL CONTRATISTA",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          userProfile.name,
        ],
        [
          {
            content: "No. DE IDENTIFICACIÓN",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          userProfile.document_number || "-",
        ],
        [
          {
            content: "DIRECCIÓN",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          userProfile.address || "-",
        ],
        [
          {
            content: "TELÉFONO DE CONTACTO",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          userProfile.phone || "-",
        ],
        [
          {
            content: "PLAZO DE EJECUCIÓN",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          plazoEjecucion,
        ],
        [
          {
            content: "FECHA ACTA DE INICIO",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          formatDisplayDate(contractStartDate),
        ],
        [
          {
            content: "FECHA DE TERMINACIÓN",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          formatDisplayDate(contractEndDate),
        ],
        [
          {
            content: "VALOR INICIAL DEL CONTRATO",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          formatCurrency(valorInicial),
        ],
        [
          {
            content: "VALOR ADICIÓN",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          valorAdicion > 0 ? formatCurrency(valorAdicion) : "-",
        ],
        [
          {
            content: "VALOR CONTRATO INICIAL + ADICIÓN",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          formatCurrency(valorContratoTotal),
        ],
        [
          {
            content: "VALOR EJECUTADO ANTES DE ESTE PAGO",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          valorEjecutadoAntes > 0 ? formatCurrency(valorEjecutadoAntes) : "-",
        ],
        [
          {
            content: "VALOR A PAGAR",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          { content: formatCurrency(valorPago), styles: { fontStyle: "bold" } },
        ],
        [
          {
            content: "TOTAL EJECUTADO",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          formatCurrency(totalEjecutado),
        ],
        [
          {
            content: "SALDO POR EJECUTAR",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          formatCurrency(saldoPorEjecutar),
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        overflow: "linebreak",
        cellWidth: "auto",
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: contentWidth - 60 },
      },
    });

    // ACTIVIDADES
    const activitiesData =
      activities.length > 0
        ? activities.map((a, i) => [
            (i + 1).toString(),
            a.activityName,
            a.actions,
            a.evidences.length > 0 ? a.evidences.map((f) => f.name).join(", ") : "-",
          ])
        : [["1", "Sin actividades registradas", "-", "-"]];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      margin: { left: tableMarginLeft, right: tableMarginRight },
      tableWidth: contentWidth,
      head: [
        [
          { content: "N°", styles: { halign: "center", fillColor: [200, 200, 200] } },
          {
            content: "ACTIVIDADES DEL CONTRATO",
            styles: { halign: "center", fillColor: [200, 200, 200] },
          },
          {
            content: "ACCIONES DESARROLLADAS",
            styles: { halign: "center", fillColor: [200, 200, 200] },
          },
          { content: "EVIDENCIAS", styles: { halign: "center", fillColor: [200, 200, 200] } },
        ],
      ],
      body: activitiesData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        overflow: "linebreak",
        cellWidth: "auto",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: contentWidth - 85 },
        3: { cellWidth: 35 },
      },
    });

    // DATOS BANCARIOS Y APORTES
    const col0Width = 50;
    const col1Width = (contentWidth - col0Width) / 3;
    const col2Width = (contentWidth - col0Width) / 3;
    const col3Width = (contentWidth - col0Width) / 3;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      margin: { left: tableMarginLeft, right: tableMarginRight },
      tableWidth: contentWidth,
      body: [
        [
          {
            content: "NUMERO CUENTA DE AHORROS",
            styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
          },
          {
            content: `BANCO: ${userProfile.bank_name || "-"}    NUMERO: ${userProfile.bank_account || "-"}`,
            colSpan: 3,
          },
        ],
        [
          {
            content: "CONCEPTO",
            styles: { fontStyle: "bold", halign: "center", fillColor: [200, 200, 200] },
          },
          {
            content: "NUMERO DE PLANILLA",
            styles: { fontStyle: "bold", halign: "center", fillColor: [200, 200, 200] },
          },
          {
            content: "VALOR",
            styles: { fontStyle: "bold", halign: "center", fillColor: [200, 200, 200] },
          },
          {
            content: "FECHA DE PAGO",
            styles: { fontStyle: "bold", halign: "center", fillColor: [200, 200, 200] },
          },
        ],
        [
          {
            content: "PAGO APORTES SALUD",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          { content: saludNumero || "-", styles: { halign: "center" } },
          {
            content: saludValor ? formatCurrency(parseFloat(saludValor)) : "-",
            styles: { halign: "right" },
          },
          { content: saludFecha || "-", styles: { halign: "center" } },
        ],
        [
          {
            content: "PAGO APORTES PENSIÓN",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          { content: pensionNumero || "-", styles: { halign: "center" } },
          {
            content: pensionValor ? formatCurrency(parseFloat(pensionValor)) : "-",
            styles: { halign: "right" },
          },
          { content: pensionFecha || "-", styles: { halign: "center" } },
        ],
        [
          {
            content: "PAGO APORTES ARL",
            styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
          },
          { content: arlNumero || "-", styles: { halign: "center" } },
          {
            content: arlValor ? formatCurrency(parseFloat(arlValor)) : "-",
            styles: { halign: "right" },
          },
          { content: arlFecha || "-", styles: { halign: "center" } },
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        overflow: "linebreak",
        cellWidth: "auto",
      },
      columnStyles: {
        0: { cellWidth: col0Width },
        1: { cellWidth: col1Width },
        2: { cellWidth: col2Width },
        3: { cellWidth: col3Width },
      },
    });

    // FIRMA DEL CONTRATISTA
    const signatureY = (doc as any).lastAutoTable.finalY;

    if (signatureUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = signatureUrl;
        });

        autoTable(doc, {
          startY: signatureY,
          margin: { left: tableMarginLeft, right: tableMarginRight },
          tableWidth: contentWidth,
          body: [
            [
              {
                content: "FIRMA DEL CONTRATISTA",
                styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
              },
              { content: "", styles: { minCellHeight: 25 } },
            ],
          ],
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.3,
            overflow: "linebreak",
            cellWidth: "auto",
          },
          columnStyles: {
            0: { cellWidth: col0Width },
            1: { cellWidth: contentWidth - col0Width },
          },
        });

        const signatureCellY = signatureY + 5;
        const signatureCellX = tableMarginLeft + col0Width + 10;
        doc.addImage(img, "PNG", signatureCellX, signatureCellY, 50, 18);
      } catch {
        autoTable(doc, {
          startY: signatureY,
          margin: { left: tableMarginLeft, right: tableMarginRight },
          tableWidth: contentWidth,
          body: [
            [
              {
                content: "FIRMA DEL CONTRATISTA",
                styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
              },
              {
                content: "________________________",
                styles: { halign: "center", minCellHeight: 20 },
              },
            ],
          ],
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.3,
            overflow: "linebreak",
            cellWidth: "auto",
          },
          columnStyles: {
            0: { cellWidth: col0Width },
            1: { cellWidth: contentWidth - col0Width },
          },
        });
      }
    } else {
      autoTable(doc, {
        startY: signatureY,
        margin: { left: tableMarginLeft, right: tableMarginRight },
        tableWidth: contentWidth,
        body: [
          [
            {
              content: "FIRMA DEL CONTRATISTA",
              styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
            },
            {
              content: "________________________",
              styles: { halign: "center", minCellHeight: 20 },
            },
          ],
        ],
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          overflow: "linebreak",
          cellWidth: "auto",
        },
        columnStyles: {
          0: { cellWidth: col0Width },
          1: { cellWidth: contentWidth - col0Width },
        },
      });
    }

    // Download PDF
    const contractNum = selectedContract.contract_number_original || selectedContract.contract_number;
    doc.save(`Informe_Actividades_${contractNum}_${mesNombre}_${año}.pdf`);
  };
  
  if (!selectedContract || !startDate || !endDate) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vista Previa - INFORME DE ACTIVIDADES
            <Badge variant="outline">Automática</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete los campos básicos para ver la vista previa del informe de actividades.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate period info
  const mesNombre = format(startDate, 'MMMM', { locale: es }).toUpperCase();
  const año = format(startDate, 'yyyy');
  
  // Calculate execution period
  const contractStartDate = selectedContract.start_date 
    ? parseLocalDate(selectedContract.start_date)
    : startDate;
  const contractEndDate = selectedContract.end_date 
    ? parseLocalDate(selectedContract.end_date)
    : endDate;
  
  const diffTime = Math.abs(contractEndDate.getTime() - contractStartDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.ceil(diffDays / 30);
  const plazoEjecucion = diffMonths > 1 ? `${diffMonths} MESES` : `${diffDays} DÍAS`;

  // Calculate financial values
  const valorPago = parseFloat(amount) || 0;
  const valorInicial = selectedContract.total_amount || 0;
  const valorAdicion = 0; // Could be added as prop if needed
  const valorContratoTotal = valorInicial + valorAdicion;
  const valorEjecutadoAntes = 0; // Would need historical data
  const totalEjecutado = valorEjecutadoAntes + valorPago;
  const saldoPorEjecutar = valorContratoTotal - totalEjecutado;

  // Helper to format date for display
  const formatDisplayDate = (date: Date) => format(date, 'dd/MM/yyyy');

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Vista Previa - INFORME DE ACTIVIDADES
            <Badge variant="outline">Generación Automática</Badge>
          </CardTitle>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review Comments Section - Internal use only */}
        {reviewComments && reviewComments.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg print:hidden">
            <h3 className="font-bold mb-3 text-lg text-blue-800">📝 HISTORIAL DE REVISIONES</h3>
            <div className="space-y-3">
              {reviewComments.map((review, index) => (
                <div key={index} className="border border-blue-300 rounded p-3 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm">
                      {review.action === 'approved' ? '✅ Aprobado' : '❌ Devuelto'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {format(new Date(review.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm mb-1">
                    <strong>Revisor:</strong> {review.reviewer.name}
                  </p>
                  <p className="text-sm">
                    <strong>Comentario:</strong> {review.comments || 'Sin comentarios'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Main Document - Formal Format */}
        <div className="border-2 border-black bg-white text-black font-sans text-sm">
          {/* Header */}
          <div className="text-center py-4 border-b-2 border-black">
            <h1 className="font-bold text-xl tracking-wide">INFORME DE ACTIVIDADES</h1>
          </div>
          
          {/* Period */}
          <div className="text-center py-3 border-b-2 border-black bg-gray-50">
            <p className="font-semibold">PERÍODO: DEL MES DE {mesNombre} {año}</p>
          </div>

          {/* DATOS BÁSICOS DEL CONTRATO */}
          <div className="border-b-2 border-black">
            <div className="bg-gray-200 px-3 py-2 border-b border-black">
              <h2 className="font-bold text-center">DATOS BÁSICOS DEL CONTRATO</h2>
            </div>
            
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50 w-1/3">No. CONTRATO</td>
                  <td className="border border-black p-2">{selectedContract.contract_number_original || selectedContract.contract_number}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">OBJETO DEL CONTRATO</td>
                  <td className="border border-black p-2">{selectedContract.description || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">NOMBRE DEL CONTRATISTA</td>
                  <td className="border border-black p-2">{userProfile.name}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">No. DE IDENTIFICACIÓN</td>
                  <td className="border border-black p-2">{userProfile.document_number || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">DIRECCIÓN</td>
                  <td className="border border-black p-2">{userProfile.address || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">TELÉFONO DE CONTACTO</td>
                  <td className="border border-black p-2">{userProfile.phone || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">PLAZO DE EJECUCIÓN</td>
                  <td className="border border-black p-2">{plazoEjecucion}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">FECHA ACTA DE INICIO</td>
                  <td className="border border-black p-2">{formatDisplayDate(contractStartDate)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">FECHA DE TERMINACIÓN</td>
                  <td className="border border-black p-2">{formatDisplayDate(contractEndDate)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">VALOR INICIAL DEL CONTRATO</td>
                  <td className="border border-black p-2">{formatCurrency(valorInicial)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">VALOR ADICIÓN</td>
                  <td className="border border-black p-2">{valorAdicion > 0 ? formatCurrency(valorAdicion) : '-'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">VALOR CONTRATO INICIAL + ADICIÓN</td>
                  <td className="border border-black p-2">{formatCurrency(valorContratoTotal)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">VALOR EJECUTADO ANTES DE ESTE PAGO</td>
                  <td className="border border-black p-2">{valorEjecutadoAntes > 0 ? formatCurrency(valorEjecutadoAntes) : '-'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">VALOR A PAGAR</td>
                  <td className="border border-black p-2 font-bold">{formatCurrency(valorPago)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">TOTAL EJECUTADO</td>
                  <td className="border border-black p-2">{formatCurrency(totalEjecutado)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">SALDO POR EJECUTAR</td>
                  <td className="border border-black p-2">{formatCurrency(saldoPorEjecutar)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ACTIVIDADES / ACCIONES DESARROLLADAS */}
          <div className="border-b-2 border-black">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2 text-center w-12">N°</th>
                  <th className="border border-black p-2 text-center w-1/4">ACTIVIDADES DEL CONTRATO</th>
                  <th className="border border-black p-2 text-center">ACCIONES DESARROLLADAS DE ACUERDO AL OBJETO DEL CONTRATO</th>
                  <th className="border border-black p-2 text-center w-1/5">EVIDENCIAS</th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <tr key={index}>
                      <td className="border border-black p-2 text-center align-top">{index + 1}</td>
                      <td className="border border-black p-2 align-top">{activity.activityName}</td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap">{activity.actions}</td>
                      <td className="border border-black p-2 align-top text-xs">
                        {activity.evidences.length > 0 
                          ? activity.evidences.map(f => f.name).join(', ')
                          : '-'
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-black p-2 text-center">1</td>
                    <td className="border border-black p-2 text-gray-400 italic">Sin actividades registradas</td>
                    <td className="border border-black p-2 text-gray-400 italic">-</td>
                    <td className="border border-black p-2 text-gray-400 italic">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* DATOS BANCARIOS Y APORTES */}
          <div className="border-b-2 border-black">
            <table className="w-full border-collapse">
              <tbody>
                {/* Bank Account Row */}
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">NUMERO CUENTA DE AHORROS</td>
                  <td className="border border-black p-2" colSpan={3}>
                    <span className="font-semibold">BANCO:</span> {userProfile.bank_name || '-'}{' '}
                    <span className="font-semibold ml-4">NUMERO:</span> {userProfile.bank_account || '-'}
                  </td>
                </tr>
                
                {/* Header row for aportes */}
                <tr className="bg-gray-200">
                  <td className="border border-black p-2 font-bold text-center">CONCEPTO</td>
                  <td className="border border-black p-2 font-bold text-center">NUMERO DE PLANILLA</td>
                  <td className="border border-black p-2 font-bold text-center">VALOR</td>
                  <td className="border border-black p-2 font-bold text-center">FECHA DE PAGO</td>
                </tr>
                
                {/* Salud */}
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">PAGO APORTES SALUD</td>
                  <td className="border border-black p-2 text-center">{saludNumero || '-'}</td>
                  <td className="border border-black p-2 text-right">
                    {saludValor ? formatCurrency(parseFloat(saludValor)) : '-'}
                  </td>
                  <td className="border border-black p-2 text-center">
                    {saludFecha || '-'}
                  </td>
                </tr>
                
                {/* Pensión */}
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">PAGO APORTES PENSIÓN</td>
                  <td className="border border-black p-2 text-center">{pensionNumero || '-'}</td>
                  <td className="border border-black p-2 text-right">
                    {pensionValor ? formatCurrency(parseFloat(pensionValor)) : '-'}
                  </td>
                  <td className="border border-black p-2 text-center">
                    {pensionFecha || '-'}
                  </td>
                </tr>
                
                {/* ARL */}
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">PAGO APORTES ARL</td>
                  <td className="border border-black p-2 text-center">{arlNumero || '-'}</td>
                  <td className="border border-black p-2 text-right">
                    {arlValor ? formatCurrency(parseFloat(arlValor)) : '-'}
                  </td>
                  <td className="border border-black p-2 text-center">
                    {arlFecha || '-'}
                  </td>
                </tr>

                {/* FIRMA DEL CONTRATISTA */}
                <tr>
                  <td className="border border-black p-2 font-semibold bg-gray-50">FIRMA DEL CONTRATISTA</td>
                  <td className="border border-black p-2 text-center" colSpan={3}>
                    <div className="flex items-center justify-center py-4">
                      {signatureUrl ? (
                        <div className="w-48 h-16 flex items-center justify-center">
                          <img 
                            src={signatureUrl} 
                            alt="Firma del contratista" 
                            className="max-w-full max-h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-48 border-b-2 border-black h-12"></div>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
