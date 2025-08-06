import { useState } from "react";
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
import {
  MoreHorizontal,
  Eye,
  Edit,
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

type SortableColumn = 'contract_number' | 'client_name' | 'total_amount' | 'start_date' | 'status' | 'contract_type';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * 1000000).replace(/^/, '$ ');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Activo", variant: "default" as const },
      completed: { label: "Completado", variant: "outline" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: "Activo", variant: "default" as const };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
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
                  onClick={() => handleSort('client_name')}
                >
                  <div className="flex items-center gap-2">
                    Cliente
                    {getSortIcon('client_name')}
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
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Estado
                    {getSortIcon('status')}
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
                      <span className="font-medium">{contract.client_name}</span>
                      {contract.client_email && (
                        <span className="text-xs text-muted-foreground">
                          {contract.client_email}
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
                    {getStatusBadge(contract.status)}
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
                                  <Label className="text-sm font-semibold">Cliente</Label>
                                  <p className="text-sm">{selectedContract.client_name}</p>
                                  {selectedContract.client_email && (
                                    <p className="text-xs text-muted-foreground">
                                      {selectedContract.client_email}
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
                                  {getStatusBadge(selectedContract.status)}
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Generar reporte
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