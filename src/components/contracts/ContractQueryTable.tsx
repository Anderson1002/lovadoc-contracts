import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import {
  MoreHorizontal,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface ContractQueryTableProps {
  contracts: any[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

type SortableColumn = 'contract_number' | 'creator_name' | 'total_amount' | 'start_date' | 'end_date' | 'estado' | 'contract_type';

export function ContractQueryTable({ 
  contracts, 
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection
}: ContractQueryTableProps) {
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [documentsDialog, setDocumentsDialog] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [documents, setDocuments] = useState<any[]>([]);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };


  const getTypeBadge = (type: string) => {
    const typeConfig = {
      fixed_amount: { label: "Monto Fijo", color: "bg-blue-100 text-blue-800" },
      variable_amount: { label: "Monto Variable", color: "bg-green-100 text-green-800" },
      company_contract: { label: "Contrato Empresa", color: "bg-purple-100 text-purple-800" }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || 
                   { label: type, color: "bg-gray-100 text-gray-800" };

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // Toggle direction
      onSort(column, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with asc
      onSort(column, 'asc');
    }
  };

  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
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
      // Usar el bucket correcto según el tipo de documento
      const bucket = doc.bucket || 'contracts';
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(doc.file_path);

      if (error) {
        console.error('Error downloading document:', error);
        toast({
          title: "Error",
          description: "No se pudo descargar el documento",
          variant: "destructive"
        });
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Descarga exitosa",
        description: "El documento se ha descargado correctamente"
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Cargando contratos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="border-2 border-dashed shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No se encontraron contratos
          </h3>
          <p className="text-muted-foreground text-center">
            Intenta ajustar los filtros de búsqueda para encontrar contratos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Resultados de Consulta
        </CardTitle>
        <CardDescription>
          {contracts.length} contrato{contracts.length !== 1 ? 's' : ''} encontrado{contracts.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('contract_number')}
                >
                  <div className="flex items-center gap-2">
                    Número
                    {getSortIcon('contract_number')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('creator_name')}
                >
                  <div className="flex items-center gap-2">
                    Usuario
                    {getSortIcon('creator_name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('contract_type')}
                >
                  <div className="flex items-center gap-2">
                    Tipo
                    {getSortIcon('contract_type')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('total_amount')}
                >
                  <div className="flex items-center gap-2">
                    Valor
                    {getSortIcon('total_amount')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('start_date')}
                >
                  <div className="flex items-center gap-2">
                    Fecha Inicio
                    {getSortIcon('start_date')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('end_date')}
                >
                  <div className="flex items-center gap-2">
                    Fecha Fin
                    {getSortIcon('end_date')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('estado')}
                >
                  <div className="flex items-center gap-2">
                    Estado
                    {getSortIcon('estado')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {contract.contract_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {contract.creator?.name || 'Sin asignar'}
                      </span>
                      {contract.creator?.email && (
                        <span className="text-xs text-muted-foreground">
                          {contract.creator.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(contract.contract_type)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(contract.total_amount)}
                  </TableCell>
                  <TableCell>
                    {contract.start_date && (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(contract.start_date), "dd/MM/yyyy", { locale: es })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {contract.end_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(contract.end_date), "dd/MM/yyyy", { locale: es })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin definir</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge status={contract.estado || 'registrado'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedContract(contract)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalles del Contrato</DialogTitle>
                            <DialogDescription>
                              {selectedContract?.contract_number}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedContract && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Creado por</Label>
                                  <p className="text-sm">{selectedContract.creator?.name || 'Sin asignar'}</p>
                                  {selectedContract.creator?.email && (
                                    <p className="text-xs text-muted-foreground">
                                      {selectedContract.creator.email}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Valor Total</Label>
                                  <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(selectedContract.total_amount)}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Tipo</Label>
                                  {getTypeBadge(selectedContract.contract_type)}
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Estado</Label>
                                  <ContractStatusBadge status={selectedContract.estado || 'registrado'} />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Fecha de Inicio</Label>
                                  <p className="text-sm">
                                    {selectedContract.start_date && 
                                      format(new Date(selectedContract.start_date), "PPP", { locale: es })
                                    }
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Fecha de Fin</Label>
                                  <p className="text-sm">
                                    {selectedContract.end_date ? 
                                      format(new Date(selectedContract.end_date), "PPP", { locale: es }) :
                                      "No definida"
                                    }
                                  </p>
                                </div>
                              </div>

                              {selectedContract.description && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Descripción</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedContract.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => setSelectedContract(contract)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleDocuments(contract.id)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Documentos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Dialog de Documentos */}
        <Dialog open={documentsDialog} onOpenChange={setDocumentsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Documentos del Contrato</DialogTitle>
              <DialogDescription>
                Documentos anexos al contrato {selectedContractId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No hay documentos anexos
                  </h3>
                  <p className="text-muted-foreground">
                    Este contrato no tiene documentos anexos registrados.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Tamaño: {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                            {doc.created_at && (
                              <> • Subido: {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: es })}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        Ver archivo
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>;
}