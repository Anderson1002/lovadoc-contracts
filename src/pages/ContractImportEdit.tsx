import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FilePen } from "lucide-react";
import {
  ContractImportForm,
  ContractImportFormValues,
} from "@/components/contract-imports/ContractImportForm";

const ALLOWED_ROLES = ["super_admin", "admin", "juridica"];

// La tabla guarda fechas como text con formato "YYYY-MM-DD HH:mm:ss.SSS"
// El input type=date espera "YYYY-MM-DD"
const toDateInput = (v: any): string => {
  if (!v) return "";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

export default function ContractImportEdit() {
  const { oid } = useParams<{ oid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initial, setInitial] = useState<Partial<ContractImportFormValues> | null>(null);

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
          description: "No tienes permisos para editar contratos importados",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      setAuthorized(true);

      try {
        const { data, error } = await (supabase as any)
          .from("contract")
          .select("*")
          .eq("OID", Number(oid))
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({
            title: "No encontrado",
            description: `No existe contrato con OID #${oid}`,
            variant: "destructive",
          });
          navigate("/contract-imports");
          return;
        }

        setInitial({
          CONTRATO: data.CONTRATO ?? "",
          CDP: data.CDP ?? "",
          "FECHA CDP": toDateInput(data["FECHA CDP"]),
          RP: data.RP != null ? String(data.RP) : "",
          "FECHA RP": toDateInput(data["FECHA RP"]),
          TERCERO: data.TERCERO ?? "",
          DESCRIP_TERCERO: data.DESCRIP_TERCERO ?? "",
          VALOR_INICIAL: data.VALOR_INICIAL ?? "",
          MODIFIC_CREDITO: data.MODIFIC_CREDITO ?? "",
          MODIFIC_DEBITO: data.MODIFIC_DEBITO ?? "",
          "VALOR EJECUTADO": data["VALOR EJECUTADO"] ?? "",
          "SALDO RP": data["SALDO RP"] ?? "",
          "OBSERVACION RP": data["OBSERVACION RP"] ?? "",
        });
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Error",
          description: "No se pudo cargar el contrato",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [oid, navigate, toast]);

  const handleSubmit = async (values: ContractImportFormValues) => {
    setSubmitting(true);
    try {
      const payload: any = {
        // CONTRATO permanece (readonly en UI), pero lo enviamos para mantener consistencia
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

      const { error } = await (supabase as any)
        .from("contract")
        .update(payload)
        .eq("OID", Number(oid));

      if (error) throw error;

      toast({
        title: "Contrato actualizado",
        description: `Cambios guardados en el OID #${oid}`,
      });
      navigate("/contract-imports");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al actualizar",
        description: err.message || "No se pudo guardar",
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

  if (!authorized || !initial) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FilePen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Editar Contrato #{oid}
              </h1>
              <p className="text-muted-foreground">
                Modificación del registro maestro
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
          mode="edit"
          oid={Number(oid)}
          initialValues={initial}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>
    </Layout>
  );
}