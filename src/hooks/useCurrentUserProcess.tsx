import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProcess {
  proceso_id: number | null;
  proceso_nombre: string | null;
}

export function useCurrentUserProcess() {
  const [userProcess, setUserProcess] = useState<UserProcess>({
    proceso_id: null,
    proceso_nombre: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUserProcess();
  }, []);

  const getCurrentUserProcess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          proceso_id,
          procesos(nombre_proceso)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setUserProcess({
          proceso_id: profile.proceso_id,
          proceso_nombre: profile.procesos ? (profile.procesos as any).nombre_proceso : null
        });
      }
    } catch (error) {
      console.error('Error getting user process:', error);
    } finally {
      setLoading(false);
    }
  };

  return { userProcess, loading, refetch: getCurrentUserProcess };
}