import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProfileValidation() {
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('document_number, document_issue_city, phone, address, bank_name, bank_account')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      const missing: string[] = [];
      if (!profile.document_number) missing.push('Número de documento');
      if (!profile.document_issue_city) missing.push('Ciudad de expedición del documento');
      if (!profile.phone) missing.push('Teléfono');
      if (!profile.address) missing.push('Dirección');
      if (!profile.bank_name) missing.push('Banco');
      if (!profile.bank_account) missing.push('Número de cuenta');

      setMissingFields(missing);
      setIsProfileComplete(missing.length === 0);
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isProfileComplete, missingFields, loading, refetch: checkProfile };
}
