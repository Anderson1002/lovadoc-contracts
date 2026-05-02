import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import {
  ContractImportForm,
  ContractImportFormValues,
} from "@/components/contract-imports/ContractImportForm";

const ALLOWED_ROLES = ["super_admin", "admin", "juridica"];

export default function ContractImportCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("roles!profiles_role_id_fkey(name)")
        .eq("user_id", user.id)
        .maybeSingle();
      const role = (profile?.roles as any)?.name;
      if (!ALLOWED_ROLES.includes(role)) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para crear contratos importados",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      setAuthorized(true);
      setLoading(false);
    })();
  }, [navigate, toast]);

  const handleSubmit = async (values: ContractImportFormValues) => {
    setSubmitting(true);
    try {
      // Verificar duplicados por CONTRATO
      const { data: existing } = await (supabase as any)
        .from("contract")
        .select("OID")
        .eq("CONTRATO", values.CONTRATO)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Contrato duplicado",
          description: `Ya existe un registro con número ${values.CONTRATO} (OID #${existing.OID})`,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const payload: any = {
        CONTRATO: values.CONTRATO,
        CDP: values.CDP || null,
        "FECHA CDP": values["FECHA CDP"] || null,
        RP: values.RP ? Number(values.RP) : null,
        "FECHA RP": values["FECHA RP"] || null,
        TERCERO: values.TERCERO,
        DESCRIP_TERCERO: values.DESCRIP_TERCERO,
        VALOR_INICIAL: values.VALOR_INICIAL || null,
        MODIFIC_CREDITO: values.MODIFIC_CREDITO || null,
        MODIFIC_DEBITO: values.MODIFIC_DEBITO || null,
        "VALOR EJECUTADO": values["VALOR EJECUTADO"] || null,
        "SALDO RP": values["SALDO RP"] || null,
        "OBSERVACION RP": values["OBSERVACION RP"] || null,
      };

      const { data, error } = await (supabase as any)
        .from("contract")
        .insert(payload)
        .select("OID")
        .single();

      if (error) throw error;

      toast({
        title: "Contrato creado",
        description: `Se asignó el OID #${data.OID}`,
      });
      navigate("/contract-imports");
    } catch (err: any) {
      console.error("Error creating contract:", err);
      toast({
        title: "Error al crear",
        description: err.message || "No se pudo guardar el contrato",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!authorized) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FilePlus2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Nuevo Contrato
              </h1>
              <p className="text-muted-foreground">
                Registra un contrato directamente en la tabla maestra
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/contract-imports")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <ContractImportForm
          mode="create"
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>
    </Layout>
  );
}