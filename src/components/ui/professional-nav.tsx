import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Users, 
  UserPlus, 
  Bell, 
  BarChart3,
  Building2,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuItem {
  label: string;
  icon: any;
  items: {
    label: string;
    icon: any;
    url: string;
    description?: string;
  }[];
}

interface ProfessionalNavProps {
  userRole: string;
  userEmail?: string;
  onLogout: () => void;
}

export function ProfessionalNav({ userRole, userEmail, onLogout }: ProfessionalNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      icon: BarChart3,
      items: [
        {
          label: "Panel Principal",
          icon: BarChart3,
          url: "/",
          description: "Vista general del sistema"
        }
      ]
    },
    {
      label: "Gestión de Contratos",
      icon: FileText,
      items: [
        {
          label: "Ver Contratos",
          icon: FileText,
          url: "/contracts",
          description: "Lista de todos los contratos"
        },
        {
          label: "Nuevo Contrato",
          icon: Plus,
          url: "/contracts/new",
          description: "Crear un nuevo contrato"
        },
        {
          label: "Consultar Contratos",
          icon: Search,
          url: "/contracts/query",
          description: "Búsqueda avanzada de contratos"
        }
      ]
    },
    {
      label: "Usuarios",
      icon: Users,
      items: [
        {
          label: "Gestionar Usuarios",
          icon: Users,
          url: "/users",
          description: "Administrar usuarios del sistema"
        },
        {
          label: "Mi Perfil",
          icon: User,
          url: "/profile",
          description: "Configurar mi perfil"
        }
      ]
    },
    {
      label: "Notificaciones",
      icon: Bell,
      items: [
        {
          label: "Ver Notificaciones",
          icon: Bell,
          url: "/notifications",
          description: "Centro de notificaciones"
        }
      ]
    }
  ];

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    return menuItems.filter(menu => {
      if (menu.label === "Usuarios" && !["super_admin", "admin"].includes(userRole)) {
        return false;
      }
      return true;
    }).map(menu => ({
      ...menu,
      items: menu.items.filter(item => {
        if (item.url === "/users" && !["super_admin", "admin"].includes(userRole)) {
          return false;
        }
        if (item.url === "/contracts/new" && !["super_admin", "admin", "employee"].includes(userRole)) {
          return false;
        }
        return true;
      })
    }));
  };

  const isActiveMenu = (menuItems: any[]) => {
    return menuItems.some(item => currentPath === item.url || currentPath.startsWith(item.url + '/'));
  };

  const isActiveItem = (url: string) => {
    return currentPath === url || (url !== '/' && currentPath.startsWith(url + '/'));
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">ContractPro</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex items-center space-x-1">
            {getFilteredMenuItems().map((menu) => {
              const Icon = menu.icon;
              const isActive = isActiveMenu(menu.items);
              
              return (
                <DropdownMenu key={menu.label}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`
                        flex items-center gap-2 px-4 py-2 h-10 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-primary text-primary-foreground shadow-sm font-medium' 
                          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{menu.label}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-64 bg-card border border-border shadow-lg rounded-lg p-2 z-50"
                  >
                    {menu.items.map((item, index) => {
                      const ItemIcon = item.icon;
                      const itemActive = isActiveItem(item.url);
                      
                      return (
                        <DropdownMenuItem 
                          key={item.url} 
                          asChild
                          className={`
                            rounded-md transition-colors duration-200 cursor-pointer
                            ${itemActive 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-accent hover:text-accent-foreground'
                            }
                          `}
                        >
                          <Link 
                            to={item.url}
                            className="flex items-start gap-3 p-3 no-underline"
                          >
                            <ItemIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-sm">{item.label}</span>
                              {item.description && (
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden md:block">
              {userEmail}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">Cuenta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-48 bg-card border border-border shadow-lg rounded-lg z-50"
              >
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    Notificaciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="flex items-center gap-2 text-destructive hover:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}