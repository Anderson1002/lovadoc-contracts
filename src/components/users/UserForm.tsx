import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserFormProps {
  user?: any;
  onSuccess: () => void;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.roles?.name || "employee"
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
    getCurrentUserRole();
  }, []);

  const getCurrentUserRole = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles!profiles_role_id_fkey(name)')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (profile && profile.roles) {
        setCurrentUserRole((profile.roles as any).name);
      }
    } catch (error) {
      console.error('Error getting current user role:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const { data: rolesData, error } = await supabase
        .from('roles')
        .select('id, name, display_name')
        .order('display_name');

      if (error) throw error;
      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roleData = roles.find(r => r.name === formData.role);
      if (!roleData) {
        throw new Error('Rol no encontrado');
      }

      if (user) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            email: formData.email,
            role_id: roleData.id
          })
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Usuario actualizado",
          description: "La información del usuario ha sido actualizada exitosamente",
        });
      } else {
        // Create new user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No hay sesión activa');
        }

        const response = await fetch(`https://cwgzjahsqzloshhvlwmr.supabase.co/functions/v1/create-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            roleId: roleData.id
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al crear usuario');
        }

        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado exitosamente",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar la solicitud",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter roles based on current user permissions
  const getAvailableRoles = () => {
    if (currentUserRole === 'super_admin') {
      return roles;
    } else if (currentUserRole === 'admin') {
      return roles.filter(role => role.name !== 'super_admin');
    } else if (currentUserRole === 'supervisor') {
      return roles.filter(role => !['super_admin', 'admin'].includes(role.name));
    }
    return [];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => setFormData({...formData, role: value})}
          disabled={getAvailableRoles().length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableRoles().map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {getAvailableRoles().length === 0 && (
          <p className="text-sm text-muted-foreground">
            No tienes permisos para asignar roles
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="submit" 
          disabled={loading || getAvailableRoles().length === 0}
        >
          {loading ? "Procesando..." : (user ? "Actualizar" : "Crear")} Usuario
        </Button>
      </div>
    </form>
  );
}