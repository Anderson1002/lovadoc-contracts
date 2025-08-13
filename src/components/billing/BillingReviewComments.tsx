import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Calendar, User } from "lucide-react";

interface BillingReview {
  id: string;
  action: string;
  comments: string;
  created_at: string;
  reviewer_name: string;
  reviewer_email: string;
  account_number: string;
  amount: number;
  status: string;
  contract_number: string;
  client_name: string;
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
        review.comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.account_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.reviewer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReviews(filtered);
    }
  }, [searchTerm, reviews]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Get billing reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('billing_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (reviewsError) {
        throw reviewsError;
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        return;
      }

      // Get unique reviewer IDs and billing account IDs
      const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
      const billingAccountIds = [...new Set(reviewsData.map(r => r.billing_account_id))];

      // Get reviewer profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', reviewerIds);

      // Get billing accounts with contracts
      const { data: billingAccountsData } = await supabase
        .from('billing_accounts')
        .select(`
          id,
          account_number,
          amount,
          status,
          contract_id
        `)
        .in('id', billingAccountIds);

      // Get contracts
      const contractIds = billingAccountsData?.map(ba => ba.contract_id).filter(Boolean) || [];
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, contract_number, client_name')
        .in('id', contractIds);

      // Transform data
      const transformedReviews = reviewsData.map(review => {
        const reviewer = profilesData?.find(p => p.id === review.reviewer_id);
        const billingAccount = billingAccountsData?.find(ba => ba.id === review.billing_account_id);
        const contract = contractsData?.find(c => c.id === billingAccount?.contract_id);

        return {
          id: review.id,
          action: review.action,
          comments: review.comments || '',
          created_at: review.created_at,
          reviewer_name: reviewer?.name || 'N/A',
          reviewer_email: reviewer?.email || 'N/A',
          account_number: billingAccount?.account_number || 'N/A',
          amount: billingAccount?.amount || 0,
          status: billingAccount?.status || 'N/A',
          contract_number: contract?.contract_number || 'N/A',
          client_name: contract?.client_name || 'N/A'
        };
      });

      console.log('Loaded billing reviews:', transformedReviews);
      setReviews(transformedReviews);
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

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">✅ Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">❌ Rechazado</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
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
            placeholder="Buscar por comentario, cuenta, cliente o revisor..."
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Estado Actual</TableHead>
                  <TableHead>Comentario</TableHead>
                  <TableHead>Revisor</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.account_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {review.client_name || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.contract_number || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.amount ? formatCurrency(review.amount) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(review.action)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(review.status || '')}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={review.comments || 'Sin comentarios'}>
                        <span className="font-medium text-blue-700">
                          {review.comments || 'Sin comentarios'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{review.reviewer_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(review.created_at), 'dd/MM/yyyy HH:mm')}
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