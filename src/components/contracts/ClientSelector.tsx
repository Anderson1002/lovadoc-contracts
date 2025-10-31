import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  document_number: string;
  phone?: string;
}

interface ClientSelectorProps {
  value?: string;
  onChange: (profileId: string) => void;
  error?: string;
}

export function ClientSelector({ value, onChange, error }: ClientSelectorProps) {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, document_number, phone')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.email && profile.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedProfile = profiles.find(p => p.id === value);

  return (
    <div className="space-y-3">
      <Label htmlFor="client-selector" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Cliente / Contratista
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="client-selector" className={error ? "border-destructive" : ""}>
          <SelectValue placeholder="Seleccionar cliente..." />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Cargando perfiles...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No se encontraron clientes
            </div>
          ) : (
            filteredProfiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.document_number} | {profile.email}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {selectedProfile && (
        <Alert>
          <AlertDescription className="text-sm">
            <div className="space-y-1">
              <p><strong>Nombre:</strong> {selectedProfile.name}</p>
              <p><strong>Documento:</strong> {selectedProfile.document_number}</p>
              <p><strong>Email:</strong> {selectedProfile.email}</p>
              {selectedProfile.phone && (
                <p><strong>Teléfono:</strong> {selectedProfile.phone}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
