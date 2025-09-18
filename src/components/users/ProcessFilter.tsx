import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface Proceso {
  id: number;
  nombre_proceso: string;
}

interface ProcessFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function ProcessFilter({ value, onChange, className }: ProcessFilterProps) {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProcesos();
  }, []);

  const loadProcesos = async () => {
    try {
      const { data, error } = await supabase
        .from('procesos')
        .select('id, nombre_proceso')
        .order('nombre_proceso');

      if (error) throw error;
      setProcesos(data || []);
    } catch (error) {
      console.error('Error loading procesos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Label htmlFor="process-filter">Filtrar por Proceso</Label>
      <Select 
        value={value || "all"} 
        onValueChange={(val) => onChange(val === "all" ? null : val)}
        disabled={loading}
      >
        <SelectTrigger id="process-filter">
          <SelectValue placeholder="Todos los procesos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los procesos</SelectItem>
          {procesos.map((proceso) => (
            <SelectItem key={proceso.id} value={proceso.id.toString()}>
              {proceso.nombre_proceso}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}