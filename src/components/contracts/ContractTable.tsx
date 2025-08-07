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
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { formatCurrency } from "@/lib/utils";

interface Contract {
  id: string;
  contract_number: string;
  client_name: string;
  contract_type: string;
  status: string;
  estado?: string;
  area_responsable?: string;
  supervisor_asignado?: string;
  total_amount: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

interface ContractTableProps {
  contracts: Contract[];
  userRole: string;
  onEdit?: (contract: Contract) => void;
  onView?: (contract: Contract) => void;
}

export function ContractTable({ 
  contracts, 
  userRole, 
  onEdit, 
  onView 
}: ContractTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContracts = contracts.filter(contract =>
    contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = ["super_admin", "admin", "supervisor"].includes(userRole);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed_amount': return 'Monto Fijo';
      case 'variable_amount': return 'Monto Variable';
      case 'company_contract': return 'Contrato Empresa';
      default: return type;
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
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Área</TableHead>
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
                  colSpan={9} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No se encontraron contratos
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {contract.contract_number}
                  </TableCell>
                  <TableCell>{contract.client_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getContractTypeLabel(contract.contract_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {contract.area_responsable ? contract.area_responsable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge status={contract.estado || contract.status} />
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
                          onClick={() => console.log('Documentos clicked for:', contract.id)}
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
    </div>
  );
}