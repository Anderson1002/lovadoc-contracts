import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProcesoForm } from "@/components/procesos/ProcesoForm";

interface Proceso {
  id: number;
  nombre_proceso: string;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
}

export default function Procesos() {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [filteredProcesos, setFilteredProcesos] = useState<Proceso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProcesos();
    loadCurrentUserRole();
  }, []);

  useEffect(() => {
    filterProcesos();
  }, [searchTerm, procesos]);

  const loadCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role_id')
          .eq('user_id', user.id)
          .single();

        if (profileData?.role_id) {
          const { data: roleData } = await supabase
            .from('roles')
            .select('id, name, display_name')
            .eq('id', profileData.role_id)
            .single();

          if (roleData) {
            setCurrentUserRole(roleData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadProcesos = async () => {
    try {
      const { data, error } = await supabase
        .from('procesos')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setProcesos(data || []);
    } catch (error) {
      console.error('Error loading procesos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los procesos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProcesos = () => {
    const filtered = procesos.filter(proceso =>
      proceso.nombre_proceso.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProcesos(filtered);
  };

  const handleDeleteProceso = async () => {
    if (!selectedProceso) return;

    try {
      const { error } = await supabase
        .from('procesos')
        .delete()
        .eq('id', selectedProceso.id);

      if (error) throw error;

      toast({
        title: "Proceso eliminado",
        description: "El proceso ha sido eliminado exitosamente",
      });

      loadProcesos();
      setDeleteDialogOpen(false);
      setSelectedProceso(null);
    } catch (error) {
      console.error('Error deleting proceso:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proceso",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canEdit = currentUserRole?.name === 'super_admin' || currentUserRole?.name === 'admin';

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Gestión de Procesos</h1>
          </div>
          {canEdit && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Proceso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Proceso</DialogTitle>
                </DialogHeader>
                <ProcesoForm
                  onSubmit={() => {
                    loadProcesos();
                    setCreateDialogOpen(false);
                  }}
                  onCancel={() => setCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Procesos
                  </p>
                  <p className="text-2xl font-bold">{procesos.length}</p>
                </div>
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Procesos de Gestión
                  </p>
                  <p className="text-2xl font-bold">
                    {procesos.filter(p => p.nombre_proceso.toLowerCase().includes('gestión')).length}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">G</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Procesos Asistenciales
                  </p>
                  <p className="text-2xl font-bold">
                    {procesos.filter(p => 
                      p.nombre_proceso.toLowerCase().includes('atención') || 
                      p.nombre_proceso.toLowerCase().includes('consulta') ||
                      p.nombre_proceso.toLowerCase().includes('cirugía')
                    ).length}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">A</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar procesos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre del Proceso</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  {canEdit && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcesos.map((proceso) => (
                  <TableRow key={proceso.id}>
                    <TableCell className="font-medium">{proceso.id}</TableCell>
                    <TableCell>{proceso.nombre_proceso}</TableCell>
                    <TableCell>{formatDate(proceso.created_at)}</TableCell>
                    <TableCell>{formatDate(proceso.updated_at)}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProceso(proceso);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProceso(proceso);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Proceso</DialogTitle>
            </DialogHeader>
            {selectedProceso && (
              <ProcesoForm
                proceso={selectedProceso}
                onSubmit={() => {
                  loadProcesos();
                  setEditDialogOpen(false);
                  setSelectedProceso(null);
                }}
                onCancel={() => {
                  setEditDialogOpen(false);
                  setSelectedProceso(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar proceso?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el proceso "{selectedProceso?.nombre_proceso}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedProceso(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProceso} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}