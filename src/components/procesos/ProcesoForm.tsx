import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Proceso {
  id: number;
  nombre_proceso: string;
  created_at: string;
  updated_at: string;
}

interface ProcesoFormProps {
  proceso?: Proceso;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ProcesoForm({ proceso, onSubmit, onCancel }: ProcesoFormProps) {
  const [nombreProceso, setNombreProceso] = useState(proceso?.nombre_proceso || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombreProceso.trim()) {
      toast({
        title: "Error",
        description: "El nombre del proceso es requerido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (proceso) {
        // Update existing proceso
        const { error } = await supabase
          .from('procesos')
          .update({ nombre_proceso: nombreProceso.trim() })
          .eq('id', proceso.id);

        if (error) throw error;

        toast({
          title: "Proceso actualizado",
          description: "El proceso ha sido actualizado exitosamente",
        });
      } else {
        // Create new proceso
        const { error } = await supabase
          .from('procesos')
          .insert({ nombre_proceso: nombreProceso.trim() });

        if (error) throw error;

        toast({
          title: "Proceso creado",
          description: "El proceso ha sido creado exitosamente",
        });
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving proceso:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el proceso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre_proceso">Nombre del Proceso</Label>
        <Input
          id="nombre_proceso"
          value={nombreProceso}
          onChange={(e) => setNombreProceso(e.target.value)}
          placeholder="Ingrese el nombre del proceso"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : proceso ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}