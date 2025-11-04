import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, FileText, Upload, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ClientSelector } from "@/components/contracts/ClientSelector";

export default function EditContract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    contract_number: '',
    client_profile_id: '',
    contract_type: '',
    status: '',
    total_amount: '',
    start_date: '',
    end_date: '',
    description: '',
    area_responsable: '',
    supervisor_asignado: ''
  });
  const [clientData, setClientData] = useState<any>(null);
  const [calculatedPeriod, setCalculatedPeriod] = useState({ months: 0, days: 0 });
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadContract(id);
    }
  }, [id]);

  const loadContract = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:profiles!client_profile_id(
            name,
            email,
            phone,
            address,
            document_number,
            bank_name,
            bank_account
          )
        `)
        .eq('id', contractId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Error",
          description: "Contrato no encontrado",
          variant: "destructive"
        });
        navigate('/contracts');
        return;
      }

      setFormData({
        contract_number: data.contract_number || '',
        client_profile_id: (data as any).client_profile_id || '',
        contract_type: data.contract_type || '',
        status: data.estado || '',
        total_amount: data.total_amount?.toString() || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        description: data.description || '',
        area_responsable: (data as any).area_responsable || '',
        supervisor_asignado: (data as any).supervisor_asignado || ''
      });
      
      setClientData(data.client);
      
      // Cargar URL del PDF si existe
      if (data.signed_contract_path) {
        const { data: urlData } = await supabase.storage
          .from('contracts')
          .createSignedUrl(data.signed_contract_path, 3600); // URL válida por 1 hora
        
        if (urlData?.signedUrl) {
          setCurrentPdfUrl(urlData.signedUrl);
        }
      }
    } catch (error: any) {
      console.error('Error loading contract:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el contrato",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular plazo de ejecución
  const calculateExecutionPeriod = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { months: 0, days: 0 };
    
    // Crear fechas evitando problemas de zona horaria
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    
    return {
      months: diffMonths,
      days: diffDays
    };
  };

  // Recalcular plazo en tiempo real cuando cambien las fechas
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const period = calculateExecutionPeriod(formData.start_date, formData.end_date);
      setCalculatedPeriod(period);
    }
  }, [formData.start_date, formData.end_date]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Archivo no válido",
          description: "Solo se permiten archivos PDF o Word",
          variant: "destructive"
        });
        return;
      }
      
      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no debe superar 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setNewPdfFile(file);
      setPdfPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveNewFile = () => {
    setNewPdfFile(null);
    setPdfPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que end_date sea posterior a start_date
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date + 'T00:00:00');
      const end = new Date(formData.end_date + 'T00:00:00');
      
      if (end <= start) {
        toast({
          title: "Error de validación",
          description: "La fecha de finalización debe ser posterior a la fecha de inicio",
          variant: "destructive"
        });
        return;
      }
    }
    
    setSaving(true);

    try {
      // Calcular plazo de ejecución antes de actualizar
      const executionPeriod = calculateExecutionPeriod(
        formData.start_date, 
        formData.end_date
      );

      let updatedSignedContractPath = null;
      let updatedSignedContractMime = null;

      // Si hay un nuevo archivo, subirlo
      if (newPdfFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado");

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) throw new Error("Perfil no encontrado");

        const fileExt = newPdfFile.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(filePath, newPdfFile);

        if (uploadError) {
          throw new Error(`Error al subir el contrato: ${uploadError.message}`);
        }

        updatedSignedContractPath = filePath;
        updatedSignedContractMime = newPdfFile.type;

        toast({
          title: "PDF actualizado",
          description: "El contrato firmado se actualizó correctamente.",
        });
      }

      const updateData: any = {
        contract_number: formData.contract_number,
        client_profile_id: formData.client_profile_id,
        contract_type: formData.contract_type as any,
        total_amount: parseFloat(formData.total_amount),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        description: formData.description || null,
        execution_period_months: executionPeriod.months,
        execution_period_days: executionPeriod.days,
        updated_at: new Date().toISOString()
      };

      // Solo actualizar PDF si se subió uno nuevo
      if (updatedSignedContractPath) {
        updateData.signed_contract_path = updatedSignedContractPath;
        updateData.signed_contract_mime = updatedSignedContractMime;
      }

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Contrato actualizado correctamente"
      });

      navigate(`/contracts/${id}`);
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el contrato",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Contrato</h1>
            <p className="text-muted-foreground">{formData.contract_number}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contract_number">Número de Contrato</Label>
                  <Input
                    id="contract_number"
                    value={formData.contract_number}
                    onChange={(e) => handleChange('contract_number', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contract_type">Tipo de Contrato</Label>
                  <Select value={formData.contract_type} onValueChange={(value) => handleChange('contract_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
                      <SelectItem value="variable_amount">Monto Variable</SelectItem>
                      <SelectItem value="company_contract">Contrato Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ClientSelector
                  value={formData.client_profile_id}
                  onChange={(value) => handleChange('client_profile_id', value)}
                />
              </CardContent>
            </Card>

            {/* Financial and Dates */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Información Financiera y Fechas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="total_amount">Valor Total (en millones)</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => handleChange('total_amount', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_date">Fecha de Inicio</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleChange('start_date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Fecha de Fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleChange('end_date', e.target.value)}
                      required
                    />
                  </div>
                  
                  {formData.start_date && formData.end_date && (
                    <div className="md:col-span-3">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm font-medium">
                          📅 Plazo de Ejecución Calculado: 
                          <span className="ml-2 font-bold text-primary">
                            {calculatedPeriod.months} meses ({calculatedPeriod.days} días)
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documento del Contrato */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contrato Firmado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PDF Actual */}
                {currentPdfUrl && !newPdfFile && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">Contrato actual</p>
                          <p className="text-xs text-muted-foreground">PDF del contrato firmado</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(currentPdfUrl, '_blank')}
                      >
                        Ver PDF
                      </Button>
                    </div>
                  </div>
                )}

                {/* Nuevo archivo seleccionado */}
                {newPdfFile && (
                  <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Upload className="h-8 w-8 text-primary animate-pulse" />
                        <div>
                          <p className="font-medium text-primary">Nuevo archivo seleccionado</p>
                          <p className="text-xs text-muted-foreground">{newPdfFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(newPdfFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveNewFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Input para subir nuevo archivo */}
                <div>
                  <Label htmlFor="signedContract">
                    {currentPdfUrl ? 'Reemplazar contrato firmado' : 'Subir contrato firmado'}
                  </Label>
                  <Input
                    id="signedContract"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos permitidos: PDF, Word (máx. 10MB)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/contracts')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}