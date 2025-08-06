import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";

interface ContractStatsProps {
  contracts: any[];
  isLoading?: boolean;
}

export function ContractStats({ contracts, isLoading = false }: ContractStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calcular estadísticas
  const totalContracts = contracts.length;
  const totalValue = contracts.reduce((sum, contract) => sum + ((contract.total_amount || 0) * 1000000), 0);
  const averageValue = totalContracts > 0 ? totalValue / totalContracts : 0;

  // Contar por estado
  const statusCounts = contracts.reduce((acc, contract) => {
    const status = contract.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Contar por tipo
  const typeCounts = contracts.reduce((acc, contract) => {
    const type = contract.contract_type || 'fixed_amount';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeContracts = statusCounts.active || 0;
  const completedContracts = statusCounts.completed || 0;
  const draftContracts = statusCounts.draft || 0;
  const cancelledContracts = statusCounts.cancelled || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace(/^/, '$ ');
  };

  const stats = [
    {
      title: "Total Contratos",
      value: totalContracts.toString(),
      description: "Contratos encontrados",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Valor Total",
      value: formatCurrency(totalValue),
      description: "Suma de todos los contratos",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Valor Promedio",
      value: formatCurrency(averageValue),
      description: "Promedio por contrato",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Contratos Activos",
      value: activeContracts.toString(),
      description: `${completedContracts} completados, ${cancelledContracts} cancelados`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-2 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Distribución por estado y tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estados */}
        <Card className="border-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Distribución por Estado
            </CardTitle>
            <CardDescription>
              Estado actual de los contratos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Activos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {activeContracts}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {totalContracts > 0 ? Math.round((activeContracts / totalContracts) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Completados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-200 text-blue-800">
                    {completedContracts}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {totalContracts > 0 ? Math.round((completedContracts / totalContracts) * 100) : 0}%
                  </span>
                </div>
              </div>

              {cancelledContracts > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Cancelados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      {cancelledContracts}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {totalContracts > 0 ? Math.round((cancelledContracts / totalContracts) * 100) : 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tipos */}
        <Card className="border-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Distribución por Tipo
            </CardTitle>
            <CardDescription>
              Tipos de contratos más utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(typeCounts).map(([type, count]) => {
                const typeLabels: Record<string, string> = {
                  fixed_amount: "Monto Fijo",
                  variable_amount: "Monto Variable",
                  contractor: "Contrato Empresa"
                };

                const countNumber = typeof count === 'number' ? count : 0;

                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-sm">{typeLabels[type] || type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {countNumber}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {totalContracts > 0 ? Math.round((countNumber / totalContracts) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}