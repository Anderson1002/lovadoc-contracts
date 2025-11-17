import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Eye, 
  Edit, 
  FileText,
  MoreVertical,
  Calendar,
  DollarSign,
  Download,
  MessageSquare
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractStateActions } from "./ContractStateActions";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Contract {
  id: string;
  oid: number;
  contract_number: string;
  contract_number_original?: string;
  client?: {
    name: string;
    email: string;
    document_number: string;
  };
  contract_type: string;
  status: string;
  estado?: string;
  area_responsable?: string;
  supervisor_asignado?: string;
  total_amount: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
  comentarios_devolucion?: string;
}

interface ContractTableProps {
  contracts: Contract[];
  userRole: string;
  onEdit?: (contract: Contract) => void;
  onView?: (contract: Contract) => void;
  onRefresh?: () => void;
}

export function ContractTable({ 
  contracts, 
  userRole, 
  onEdit, 
  onView,
  onRefresh 
}: ContractTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [documentsDialog, setDocumentsDialog] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [documents, setDocuments] = useState<any[]>([]);
  const { toast } = useToast();

  const filteredContracts = contracts.filter(contract =>
    (contract.contract_number_original || contract.contract_number).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contract.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = ["super_admin", "admin"].includes(userRole);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'monto_fijo': return 'Monto Fijo';
      case 'monto_variable': return 'Monto Variable';
      case 'contrato_empresa': return 'Empresarial';
      case 'fixed_amount': return 'Monto Fijo';
      case 'variable_amount': return 'Monto Variable';
      case 'company_contract': return 'Empresarial';
      case 'contrator': return 'Empresarial';
      default: return type;
    }
  };

  const handleDocuments = async (contractId: string) => {
    setSelectedContractId(contractId);
    setDocumentsDialog(true);
    
    try {
      // 1. Obtener el contrato para acceder a signed_contract_path y bank_certification_path
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('signed_contract_path, signed_contract_mime, bank_certification_path, bank_certification_mime')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      // 2. Obtener documentos adicionales de la tabla documents
      const { data: additionalDocs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('contract_id', contractId);
      
      if (docsError) throw docsError;

      // 3. Combinar todos los documentos
      const allDocuments = [];
      const now = new Date().toISOString();

      // Agregar contrato firmado si existe
      if (contractData?.signed_contract_path) {
        allDocuments.push({
          id: 'signed-contract',
          file_name: 'Contrato Firmado',
          file_path: contractData.signed_contract_path,
          mime_type: contractData.signed_contract_mime || 'application/pdf',
          file_size: 0,
          bucket: 'contracts',
          created_at: now
        });
      }

      // Agregar certificación bancaria si existe
      if (contractData?.bank_certification_path) {
        allDocuments.push({
          id: 'bank-certification',
          file_name: 'Certificación Bancaria',
          file_path: contractData.bank_certification_path,
          mime_type: contractData.bank_certification_mime || 'application/pdf',
          file_size: 0,
          bucket: 'contracts',
          created_at: now
        });
      }

      // Agregar documentos adicionales
      if (additionalDocs && additionalDocs.length > 0) {
        allDocuments.push(...additionalDocs.map(doc => ({
          ...doc,
          bucket: 'contracts'
        })));
      }

      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive"
      });
      setDocuments([]);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      const bucket = doc.bucket || 'contracts';
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(doc.file_path);

      if (error) {
        console.error('Error downloading file:', error);
        toast({
          title: "Error",
          description: "No se pudo descargar el archivo",
          variant: "destructive"
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Descarga iniciada",
        description: `Descargando ${doc.file_name}`
      });
    } catch (error) {
      console.error('Error handling document:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el documento",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {filteredContracts.length} contratos
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OID</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Valor
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Inicio
                </div>
              </TableHead>
              <TableHead>Fin</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={8} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No se encontraron contratos
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-muted/50">
                  <TableCell className="font-bold text-primary">
                    #{contract.oid}
                  </TableCell>
                  <TableCell className="font-medium font-mono text-xs">
                    {contract.contract_number_original || contract.contract_number}
                  </TableCell>
                  <TableCell>{contract.client?.name || 'Sin cliente'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getContractTypeLabel(contract.contract_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ContractStatusBadge status={contract.estado || contract.status} />
                      {(contract.estado === 'devuelto' || contract.status === 'devuelto') && contract.comentarios_devolucion && (
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MessageSquare className="h-4 w-4 text-destructive" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-destructive">Motivo de Devolución</h4>
                              <p className="text-sm text-muted-foreground">
                                {contract.comentarios_devolucion}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                      <ContractStateActions 
                        contract={contract}
                        userRole={userRole}
                        onStateChange={onRefresh}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(contract.total_amount)}
                  </TableCell>
                  <TableCell>{formatDate(contract.start_date)}</TableCell>
                  <TableCell>
                    {contract.end_date ? formatDate(contract.end_date) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onView?.(contract)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem 
                            onClick={() => onEdit?.(contract)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDocuments(contract.id)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Documentos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Documents Dialog */}
      <Dialog open={documentsDialog} onOpenChange={setDocumentsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documentos del Contrato</DialogTitle>
            <DialogDescription>
              Documentos asociados al contrato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay documentos disponibles</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.mime_type || 'application/pdf'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}