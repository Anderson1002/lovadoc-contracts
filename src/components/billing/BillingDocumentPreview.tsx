import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Contract {
  id: string;
  contract_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_account_number?: string;
  client_bank_name?: string;
  description?: string;
  total_amount: number;
}

interface UserProfile {
  name: string;
  email: string;
  // Add other user fields as needed
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
}

export function BillingDocumentPreview({
  userProfile,
  selectedContract,
  amount,
  startDate,
  endDate,
  activities
}: BillingDocumentPreviewProps) {
  const documentNumber = `DSE ${format(new Date(), 'yyyMM')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  if (!selectedContract || !startDate || !endDate) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vista Previa - Cuenta de Cobro
            <Badge variant="outline">Automática</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete los campos básicos para ver la vista previa del documento de cuenta de cobro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Vista Previa - Cuenta de Cobro
          <Badge variant="outline">Generación Automática</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-6 bg-white text-black font-mono text-sm space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-bold uppercase">{userProfile.name}</h1>
            <p>C.C. [Número de Cédula]</p>
            <p>Cl 9 # 14 - [Dirección] </p>
            <p>[Teléfono]</p>
            <p>CORREO ELECTRÓNICO: {userProfile.email}</p>
            <p>Régimen Simplificado</p>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold text-center">DOCUMENTO EQUIVALENTE FACTURA No. {documentNumber}</h2>
          </div>

          {/* Document Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Ciudad y fecha:</strong> Facatativá, {format(new Date(), 'dd \'de\' MMMM \'de\' yyyy')}</p>
              <p><strong>Cliente:</strong> {selectedContract.client_name}</p>
              <p><strong>NIT:</strong> {selectedContract.client_email || '[NIT del Cliente]'}</p>
              <p><strong>Dirección:</strong> {selectedContract.client_address || '[Dirección del Cliente]'}</p>
              <p><strong>Teléfono:</strong> {selectedContract.client_phone || '[Teléfono del Cliente]'}</p>
            </div>
          </div>

          {/* Service Description */}
          <div className="border border-black p-4 mt-4">
            <p className="font-bold">
              POR PRESTACIÓN DE SERVICIOS COMO: (PROFESIONAL DE SISTEMAS PARA EL 
              DESARROLLO DE NUEVAS APLICACIONES Y/O TECNOLOGÍAS PARA LA ESE 
              HOSPITAL SAN RAFAEL DE FACATATIVÁ). DEL PERIODO DEL MES DE{' '}
              {startDate && endDate && (
                <>
                  {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                </>
              )}
              , SEGÚN CONTRATO No. {selectedContract.contract_number}
            </p>
            
            <div className="mt-4">
              <p><strong>SON:</strong> $ {amount ? parseFloat(amount).toLocaleString('es-CO') : '0'}</p>
              <p><strong>({amount ? 'PESOS COLOMBIANOS' : ''})</strong></p>
            </div>

            <p className="mt-4">
              <strong>No. CUENTA BANCARIA Nº:</strong> {selectedContract.client_account_number || '[Número de Cuenta]'}<br/>
              <strong>BANCO:</strong> {selectedContract.client_bank_name || '[Nombre del Banco]'}
            </p>
          </div>

          {/* Activities Section */}
          {activities.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">ACTIVIDADES DESARROLLADAS:</h3>
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div key={index} className="border-l-2 border-gray-300 pl-3">
                    <p><strong>{index + 1}. {activity.activityName}</strong></p>
                    <p className="text-sm">{activity.actions}</p>
                    {activity.evidences.length > 0 && (
                      <p className="text-xs text-gray-600">
                        Evidencias: {activity.evidences.map(f => f.name).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Text */}
          <div className="text-xs mt-4 border-t pt-2">
            <p>
              Bajo la gravedad del juramento informo que no he contratado con más de 1 empleado por un término 
              igual o superior a 90 días, y por consiguiente solicito se me aplique la retención en la fuente por salarios 
              de acuerdo a lo establecido en el artículo 2 del decreto 1625 de 2016, adicionado conforme por el 
              artículo 1.2.4.1.6 del decreto 1625 de 2016, adicionado por el art. 1 dec. 2392/16.
            </p>
          </div>

          {/* Signature Area */}
          <div className="mt-6 text-center border-t pt-4">
            <p>Actividad económica RUT 6201: 202110330</p>
            <div className="mt-8">
              <div className="border-t border-black w-48 mx-auto"></div>
              <p className="mt-2"><strong>(FIRMA DEL CONTRATISTA)</strong></p>
              <p>C.C. [Número de Cédula] de Bogotá</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}