import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Calendar } from "lucide-react";

interface BillingReview {
  id: string;
  numero: string;
  contract_id: string;
  periodo: string;
  valor: number;
  estado: string;
  fecha: string;
  last_comment: string | null;
  last_decision: string | null;
  last_review_at: string | null;
}

interface BillingReviewCommentsProps {
  userRole: string;
}

export function BillingReviewComments({ userRole }: BillingReviewCommentsProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<BillingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReviews, setFilteredReviews] = useState<BillingReview[]>([]);

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    // Filter reviews based on search term
    if (searchTerm.trim() === "") {
      setFilteredReviews(reviews);
    } else {
      const filtered = reviews.filter(review =>
        review.last_comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.periodo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReviews(filtered);
    }
  }, [searchTerm, reviews]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Get data from the new view
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('v_billing_accounts_last_review')
        .select('*')
        .not('last_comment', 'is', null) // Only show accounts that have comments
        .order('fecha', { ascending: false });
      
      if (reviewsError) {
        throw reviewsError;
      }

      console.log('Loaded billing reviews from view:', reviewsData);
      setReviews(reviewsData || []);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios de revisión",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">✅ Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">❌ Rechazado</Badge>;
      case 'changes_requested':
        return <Badge variant="secondary">🔄 Cambios Solicitados</Badge>;
      default:
        return <Badge variant="outline">{decision || 'N/A'}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'borrador':
        return <Badge variant="outline">Borrador</Badge>;
      case 'pendiente_revision':
        return <Badge variant="secondary">Pendiente Revisión</Badge>;
      case 'aprobada':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprobada</Badge>;
      case 'rechazada':
        return <Badge variant="destructive">Rechazada</Badge>;
      case 'causada':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Causada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comentarios de Revisión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comentarios de Revisión
          <Badge variant="outline" className="ml-2">
            {filteredReviews.length} comentarios
          </Badge>
        </CardTitle>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar por comentario, cuenta o período..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron comentarios de revisión</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado Actual</TableHead>
                  <TableHead>Último Comentario</TableHead>
                  <TableHead>Decisión</TableHead>
                  <TableHead>Fecha Revisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.numero || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {review.periodo || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {review.valor ? formatCurrency(review.valor) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(review.estado || '')}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={review.last_comment || 'Sin comentarios'}>
                        <span className="font-medium text-blue-700">
                          {review.last_comment || 'Sin comentarios'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDecisionBadge(review.last_decision)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {review.last_review_at 
                          ? format(new Date(review.last_review_at), 'dd/MM/yyyy HH:mm')
                          : 'N/A'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}