import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, parseLocalDate } from "@/lib/utils";

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
  // Desglose de Aportes
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
        <CardTitle className="flex items-center gap-2">
          Vista Previa - INFORME DE ACTIVIDADES
          <Badge variant="outline">Generación Automática</Badge>
        </CardTitle>
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
                    <div className="flex flex-col items-center py-4">
                      {signatureUrl ? (
                        <div className="w-48 h-16 flex items-center justify-center mb-2">
                          <img 
                            src={signatureUrl} 
                            alt="Firma del contratista" 
                            className="max-w-full max-h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-48 border-b-2 border-black mb-2 h-12"></div>
                      )}
                      <p className="font-bold">{userProfile.name}</p>
                      <p>C.C. {userProfile.document_number || '-'}</p>
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
