import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  Search,
  X,
  Filter,
  Download,
  Building2,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  User
} from "lucide-react";

export interface ContractFilters {
  search: string;
  contractType: string;
  status: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  minAmount: string;
  maxAmount: string;
  clientName: string;
}

interface ContractFiltersProps {
  filters: ContractFilters;
  onFiltersChange: (filters: ContractFilters) => void;
  onExport: () => void;
  isLoading?: boolean;
}

const contractTypes = [
  { value: "all", label: "Todos los tipos", icon: FileText },
  { value: "fixed_amount", label: "Monto Fijo", icon: DollarSign },
  { value: "variable_amount", label: "Monto Variable", icon: DollarSign },
  { value: "contractor", label: "Contrato Empresa", icon: Building2 }
];

const contractStatuses = [
  { value: "all", label: "Todos los estados", icon: Clock },
  { value: "active", label: "Activo", icon: CheckCircle2 },
  { value: "completed", label: "Completado", icon: CheckCircle2 },
  { value: "cancelled", label: "Cancelado", icon: XCircle }
];

export function ContractFilters({ 
  filters, 
  onFiltersChange, 
  onExport, 
  isLoading = false 
}: ContractFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof ContractFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      contractType: "all",
      status: "all",
      startDate: undefined,
      endDate: undefined,
      minAmount: "",
      maxAmount: "",
      clientName: ""
    });
  };

  const hasActiveFilters = filters.search || 
    filters.contractType !== "all" || 
    filters.status !== "all" ||
    filters.startDate || 
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.clientName;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
            <CardDescription>
              Filtra y encuentra contratos específicos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {isExpanded ? "Menos Filtros" : "Más Filtros"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Búsqueda rápida */}
        <div className="space-y-2">
          <Label htmlFor="search">Búsqueda rápida</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por número de contrato, cliente, descripción..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Contrato</Label>
            <Select 
              value={filters.contractType} 
              onValueChange={(value) => updateFilter("contractType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg">
                {contractTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg">
                {contractStatuses.map((status) => {
                  const Icon = status.icon;
                  return (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName">Cliente</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="clientName"
                placeholder="Nombre del cliente"
                value={filters.clientName}
                onChange={(e) => updateFilter("clientName", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Filtros avanzados */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-6">
            {/* Rango de fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de inicio desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? (
                        format(filters.startDate, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => updateFilter("startDate", date)}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha de inicio hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? (
                        format(filters.endDate, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => updateFilter("endDate", date)}
                      className="pointer-events-auto"
                      disabled={(date) => 
                        filters.startDate ? date < filters.startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Rango de montos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Monto mínimo</Label>
                <Input
                  id="minAmount"
                  placeholder="$0"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter("minAmount", e.target.value)}
                  type="number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAmount">Monto máximo</Label>
                <Input
                  id="maxAmount"
                  placeholder="$999,999,999"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter("maxAmount", e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpiar Filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}