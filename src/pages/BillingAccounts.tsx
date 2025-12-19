import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Receipt, Eye, MessageSquare, AlertCircle } from "lucide-react";
import { CreateBillingAccountDialog } from "@/components/billing/CreateBillingAccountDialog";
import { BillingAccountsList } from "@/components/billing/BillingAccountsList";
import { BillingReviewList } from "@/components/billing/BillingReviewList";
import { BillingReviewComments } from "@/components/billing/BillingReviewComments";

export default function BillingAccounts() {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("employee");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableContracts, setAvailableContracts] = useState(0);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile && canCreateBilling) {
      loadAvailableContracts();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles!profiles_role_id_fkey(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile && profile.roles) {
        setUserRole((profile.roles as any).name);
        setUserProfile(profile);
        console.log('User profile loaded in BillingAccounts:', profile);
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableContracts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['en_ejecucion']);

      // Filter by role
      if (userRole === 'employee') {
        query = query.eq('created_by', userProfile.id);
      } else if (userRole === 'supervisor') {
        query = query.eq('created_by', userProfile.id);
      }

      const { count, error } = await query;

      if (error) throw error;
      setAvailableContracts(count || 0);
    } catch (error: any) {
      console.error('Error loading available contracts:', error);
    }
  };

  const canCreateBilling = ['super_admin', 'admin', 'employee'].includes(userRole);
  const canReviewBilling = ['super_admin', 'admin', 'supervisor'].includes(userRole);
  const canManagePayments = ['super_admin', 'admin', 'treasury'].includes(userRole);
  const [pendingCount, setPendingCount] = useState(0);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registro Cuenta de Cobro</h1>
            <p className="text-muted-foreground">
              Para radicar exitosamente se requieren 3 documentos: Informe de Actividades, Certificación y Cuenta de Cobro
            </p>
          </div>
          {canCreateBilling && (
            <div className="flex flex-col items-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      disabled={availableContracts === 0}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Cuenta de Cobro
                      {availableContracts > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {availableContracts}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {availableContracts > 0 
                        ? `${availableContracts} contrato${availableContracts > 1 ? 's' : ''} disponible${availableContracts > 1 ? 's' : ''} en ejecución`
                        : 'No tienes contratos en ejecución'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {availableContracts === 0 && (
                  <Alert className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Las cuentas de cobro solo pueden crearse para contratos aprobados y en ejecución.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <Tabs defaultValue={userRole === 'supervisor' ? 'pending-review' : userRole === 'treasury' ? 'pending-payment' : 'my-accounts'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {userRole !== 'supervisor' && userRole !== 'treasury' && (
              <TabsTrigger value="my-accounts" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Mis Cuentas
              </TabsTrigger>
            )}
            {canReviewBilling && (
              <TabsTrigger value="pending-review" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Pendientes Revisión
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {canManagePayments && (
              <TabsTrigger value="pending-payment" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Cuentas por Pagar
              </TabsTrigger>
            )}
            <TabsTrigger value="all-accounts" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Todas las Cuentas
            </TabsTrigger>
            <TabsTrigger value="review-comments" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comentarios
            </TabsTrigger>
          </TabsList>

          {userRole !== 'supervisor' && userRole !== 'treasury' && (
            <TabsContent value="my-accounts" className="space-y-6">
              <BillingAccountsList 
                userProfile={userProfile}
                userRole={userRole}
                filterType="own"
              />
            </TabsContent>
          )}

          {canReviewBilling && (
            <TabsContent value="pending-review" className="space-y-6">
              <BillingReviewList 
                userProfile={userProfile}
                userRole={userRole}
                onCountChange={setPendingCount}
              />
            </TabsContent>
          )}

          {canManagePayments && (
            <TabsContent value="pending-payment" className="space-y-6">
              <BillingAccountsList 
                userProfile={userProfile}
                userRole={userRole}
                filterType="approved"
              />
            </TabsContent>
          )}

          <TabsContent value="all-accounts" className="space-y-6">
            <BillingAccountsList 
              userProfile={userProfile}
              userRole={userRole}
              filterType="all"
            />
          </TabsContent>

          <TabsContent value="review-comments" className="space-y-6">
            <BillingReviewComments 
              userRole={userRole}
            />
          </TabsContent>
        </Tabs>

        {/* Create Billing Account Dialog */}
        <CreateBillingAccountDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          userProfile={userProfile}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadAvailableContracts();
            // Refresh the lists
            window.location.reload();
          }}
        />
      </div>
    </Layout>
  );
}