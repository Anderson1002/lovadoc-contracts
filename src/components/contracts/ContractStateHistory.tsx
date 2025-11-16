import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, User, MessageSquare, ArrowRight } from "lucide-react";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractFieldChanges } from "./ContractFieldChanges";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Cambios de Estado
          <Badge variant="secondary" className="ml-auto">
            {history.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div 
              key={entry.id}
              className={`relative pl-8 pb-4 ${
                index !== history.length - 1 ? 'border-l-2 border-border ml-2' : ''
              }`}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
              
              <div className="space-y-3">
                {/* Fecha y Usuario */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDateTime(entry.created_at)}</span>
                  </div>
                  {entry.changed_by_profile && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{entry.changed_by_profile.name}</span>
                    </div>
                  )}
                </div>

                {/* Cambio de Estado */}
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.estado_anterior && (
                    <>
                      <ContractStatusBadge status={entry.estado_anterior} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                  <ContractStatusBadge status={entry.estado_nuevo} />
                </div>

                {/* Comentarios (destacar devoluciones) */}
                {entry.comentarios && (
                  <div 
                     className={`rounded-lg p-3 ${
                      entry.estado_nuevo === 'devuelto'
                        ? 'bg-destructive/10 border border-destructive'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                        entry.estado_nuevo === 'devuelto' ? 'text-destructive' : 'text-muted-foreground'
                      }`} />
                      <div>
                        {entry.estado_nuevo === 'devuelto' && (
                          <p className="text-sm font-semibold text-destructive mb-1">
                            Motivo de devolución:
                          </p>
                        )}
                        <p className="text-sm text-foreground leading-relaxed">
                          {entry.comentarios}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show specific changes if they exist */}
                {entry.changes_details && (
                  <div className="mt-3">
                    <ContractFieldChanges changes={entry.changes_details} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
