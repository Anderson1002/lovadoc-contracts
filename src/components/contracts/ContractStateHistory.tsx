import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Clock, User, MessageSquare, ArrowRight, AlertCircle, CheckCircle2, XCircle, FileEdit, Filter, Download, FileText, FileSpreadsheet } from "lucide-react";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractFieldChanges } from "./ContractFieldChanges";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ContractStateHistoryProps {
  contractId: string;
}

interface HistoryEntry {
  id: string;
  created_at: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentarios: string | null;
  changes_details: Record<string, any> | null;
  changed_by_profile: {
    name: string;
  } | null;
}

export function ContractStateHistory({ contractId }: ContractStateHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<string>("all");

  useEffect(() => {
    loadHistory();
  }, [contractId]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_state_history')
        .select(`
          id,
          created_at,
          estado_anterior,
          estado_nuevo,
          comentarios,
          changes_details,
          changed_by,
          profiles!contract_state_history_changed_by_fkey(name)
        `)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match HistoryEntry interface
      const transformedData = (data || []).map((entry: any) => ({
        id: entry.id,
        created_at: entry.created_at,
        estado_anterior: entry.estado_anterior,
        estado_nuevo: entry.estado_nuevo,
        comentarios: entry.comentarios,
        changes_details: entry.changes_details || null,
        changed_by_profile: entry.profiles ? { name: entry.profiles.name } : null
      }));
      
      setHistory(transformedData);
    } catch (error) {
      console.error('Error loading state history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStateName = (estado: string) => {
    const stateNames: Record<string, string> = {
      'registrado': 'Registrado',
      'devuelto': 'Devuelto',
      'corregido': 'Corregido',
      'en_ejecucion': 'En Ejecución',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return stateNames[estado] || estado;
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text('Historial de Cambios de Estado', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 28);
      doc.text(`Total de cambios: ${filteredHistory.length}`, 14, 34);
      
      // Table data
      const tableData = filteredHistory.map((entry) => [
        formatDateTime(entry.created_at),
        entry.estado_anterior ? getStateName(entry.estado_anterior) : '-',
        getStateName(entry.estado_nuevo),
        entry.changed_by_profile?.name || 'Sistema',
        entry.comentarios || '-'
      ]);
      
      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Estado Anterior', 'Estado Nuevo', 'Usuario', 'Comentarios']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 }
      });
      
      doc.save(`historial-estados-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado exitosamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const excelData = filteredHistory.map((entry) => ({
        'Fecha': formatDateTime(entry.created_at),
        'Estado Anterior': entry.estado_anterior ? getStateName(entry.estado_anterior) : '-',
        'Estado Nuevo': getStateName(entry.estado_nuevo),
        'Usuario': entry.changed_by_profile?.name || 'Sistema',
        'Comentarios': entry.comentarios || '-',
        'Cambios en Campos': entry.changes_details ? JSON.stringify(entry.changes_details) : '-'
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 25 }, // Fecha
        { wch: 20 }, // Estado Anterior
        { wch: 20 }, // Estado Nuevo
        { wch: 25 }, // Usuario
        { wch: 50 }, // Comentarios
        { wch: 40 }  // Cambios en Campos
      ];
      
      XLSX.writeFile(workbook, `historial-estados-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel exportado exitosamente');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Error al exportar Excel');
    }
  };

  const getStateIcon = (estado: string) => {
    switch (estado) {
      case 'registrado':
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case 'devuelto':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'corregido':
        return <CheckCircle2 className="h-4 w-4 text-yellow-500" />;
      case 'en_ejecucion':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'completado':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'cancelado':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios de Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredHistory = filterState === "all" 
    ? history 
    : history.filter(entry => entry.estado_nuevo === filterState);

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios de Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay cambios de estado registrados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
              <History className="h-4 w-4 text-primary" />
            </div>
            Historial de Cambios de Estado
            <Badge variant="secondary" className="ml-2">
              {filteredHistory.length} {filteredHistory.length === 1 ? 'cambio' : 'cambios'}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cambios</SelectItem>
                <SelectItem value="registrado">Registrado</SelectItem>
                <SelectItem value="devuelto">Devuelto</SelectItem>
                <SelectItem value="corregido">Corregido</SelectItem>
                <SelectItem value="en_ejecucion">En Ejecución</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Exportar a PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar a Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {filteredHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay cambios de estado que coincidan con el filtro seleccionado
          </p>
        ) : (
          <div className="space-y-8">
            {filteredHistory.map((entry, index) => (
            <div 
              key={entry.id} 
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Timeline line */}
              {index < filteredHistory.length - 1 && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
              )}
              
              <div className="flex gap-4">
                {/* Timeline icon */}
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full border-2 border-primary/20 bg-background shadow-sm flex items-center justify-center ring-4 ring-background">
                    {getStateIcon(entry.estado_nuevo)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.estado_anterior && (
                        <>
                          <ContractStatusBadge status={entry.estado_anterior} />
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </>
                      )}
                      <ContractStatusBadge status={entry.estado_nuevo} />
                      
                      {index === 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Más reciente
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium">{formatDateTime(entry.created_at)}</span>
                      </div>
                      
                      {entry.changed_by_profile && (
                        <>
                          <span className="text-border">•</span>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>{entry.changed_by_profile.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  {entry.comentarios && (
                    <div className={`rounded-lg border p-4 transition-colors ${
                      entry.estado_nuevo === 'devuelto' 
                        ? 'bg-destructive/5 border-destructive/30 shadow-sm' 
                        : 'bg-muted/30 border-border'
                    }`}>
                      <div className="flex gap-3">
                        <MessageSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          entry.estado_nuevo === 'devuelto' 
                            ? 'text-destructive' 
                            : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">
                            {entry.estado_nuevo === 'devuelto' ? 'Motivo de devolución' : 'Comentario'}
                          </p>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {entry.comentarios}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Field changes */}
                  {entry.changes_details && (
                    <div className="mt-3">
                      <ContractFieldChanges changes={entry.changes_details} />
                    </div>
                  )}
                  
                  {/* Separator between entries */}
                  {index < filteredHistory.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
