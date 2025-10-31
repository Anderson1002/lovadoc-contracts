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
import { ArrowLeft, Save } from "lucide-react";
import { Layout } from "@/components/Layout";

export default function EditContract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    contract_number: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    contract_type: '',
    status: '',
    total_amount: '',
    start_date: '',
    end_date: '',
    description: '',
    area_responsable: '',
    supervisor_asignado: ''
  });
  const [calculatedPeriod, setCalculatedPeriod] = useState({ months: 0, days: 0 });

  useEffect(() => {
    if (id) {
      loadContract(id);
    }
  }, [id]);

  const loadContract = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
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
        client_name: data.client_name || '',
        client_email: data.client_email || '',
        client_phone: data.client_phone || '',
        client_address: data.client_address || '',
        contract_type: data.contract_type || '',
        status: data.status || '',
        total_amount: data.total_amount?.toString() || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        description: data.description || '',
        area_responsable: (data as any).area_responsable || '',
        supervisor_asignado: (data as any).supervisor_asignado || ''
      });
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
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que end_date sea posterior a start_date
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      
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

      const { error } = await supabase
        .from('contracts')
        .update({
          contract_number: formData.contract_number,
          client_name: formData.client_name,
          client_email: formData.client_email,
          client_phone: formData.client_phone,
          client_address: formData.client_address || null,
          contract_type: formData.contract_type as any,
          status: formData.status as any,
          total_amount: parseFloat(formData.total_amount),
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          description: formData.description || null,
          execution_period_months: executionPeriod.months,
          execution_period_days: executionPeriod.days,
          updated_at: new Date().toISOString()
        })
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
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
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
                <div>
                  <Label htmlFor="client_name">Nombre del Cliente</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => handleChange('client_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleChange('client_email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_phone">Teléfono</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => handleChange('client_phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_address">Dirección</Label>
                  <Input
                    id="client_address"
                    value={formData.client_address}
                    onChange={(e) => handleChange('client_address', e.target.value)}
                  />
                </div>
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