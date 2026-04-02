import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { SupervisorObservations } from "./SupervisorObservations";

interface ReviewEntry {
  id: string;
  action: string;
  comments: string | null;
  comentario: string | null;
  decision: string | null;
  created_at: string;
  reviewer: { name: string } | null;
}

interface BillingReviewHistoryProps {
  billingAccountId: string;
  className?: string;
}

export function BillingReviewHistory({ billingAccountId, className = '' }: BillingReviewHistoryProps) {
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [billingAccountId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('billing_reviews')
        .select(`
          id, action, comments, comentario, decision, created_at,
          reviewer:profiles!billing_reviews_reviewer_id_fkey(name)
        `)
        .eq('billing_account_id', billingAccountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data as any[]) || []);
    } catch (error) {
      console.error('Error loading review history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando historial...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        No hay revisiones anteriores
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      {reviews.map((review, index) => {
        const isRejection = review.action === 'rejected' || review.decision === 'rechazada';
        const isFirst = index === 0;
        const comment = review.comentario || review.comments;

        return (
          <div key={review.id} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Timeline line */}
            {index < reviews.length - 1 && (
              <div className="absolute left-[15px] top-[30px] bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isRejection ? (
                <div className="w-[30px] h-[30px] rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-destructive" />
                </div>
              ) : (
                <div className="w-[30px] h-[30px] rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={isRejection ? "destructive" : "default"} className="text-xs">
                  {isRejection ? 'Devuelta' : 'Aprobada'}
                </Badge>
                {isFirst && (
                  <Badge variant="outline" className="text-[10px] bg-accent">Más reciente</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{(review.reviewer as any)?.name || 'Supervisor'}</span>
                {' · '}
                {formatDateTime(review.created_at)}
              </div>
              {comment && (
                <div className="mt-2 p-2 rounded border bg-card">
                  <SupervisorObservations comment={comment} compact />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export async function getBillingRejectionCount(billingAccountId: string): Promise<number> {
  const { count, error } = await supabase
    .from('billing_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('billing_account_id', billingAccountId)
    .eq('action', 'rejected');

  if (error) return 0;
  return count || 0;
}
