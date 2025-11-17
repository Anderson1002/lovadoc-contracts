import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, User, MessageSquare, ArrowRight, AlertCircle, CheckCircle2, XCircle, FileEdit } from "lucide-react";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractFieldChanges } from "./ContractFieldChanges";
import { Separator } from "@/components/ui/separator";

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
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
            <History className="h-4 w-4 text-primary" />
          </div>
          Historial de Cambios de Estado
          <Badge variant="secondary" className="ml-auto">
            {history.length} {history.length === 1 ? 'cambio' : 'cambios'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-8">
          {history.map((entry, index) => (
            <div 
              key={entry.id} 
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Timeline line */}
              {index < history.length - 1 && (
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
                  {index < history.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
