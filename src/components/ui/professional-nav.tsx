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
  Settings,
  ChevronDown
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
      label: "Control de Contratos",
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
    <nav className="bg-gradient-to-r from-card via-card to-card border-b border-border shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">HospitalPro</span>
                <span className="text-xs text-muted-foreground">Sistema de Contratos</span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu className="flex-1 mx-8">
            <NavigationMenuList className="flex items-center space-x-1">
              {getFilteredMenuItems().map((menu) => {
                const Icon = menu.icon;
                const isActive = isActiveMenu(menu.items);
                
                return (
                  <NavigationMenuItem key={menu.label}>
                    <NavigationMenuTrigger 
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 h-10 rounded-lg transition-all duration-300 font-medium",
                        "bg-transparent hover:bg-accent/50 hover:text-accent-foreground",
                        "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground",
                        isActive && "bg-primary/10 text-primary border border-primary/20"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{menu.label}</span>
                      <ChevronDown className="h-3 w-3 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="w-80 p-4 bg-card border border-border shadow-xl rounded-lg">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">{menu.label}</span>
                        </div>
                        {menu.items.map((item) => {
                          const ItemIcon = item.icon;
                          const itemActive = isActiveItem(item.url);
                          
                          return (
                            <NavigationMenuLink key={item.url} asChild>
                              <Link
                                to={item.url}
                                className={cn(
                                  "group flex items-start gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground no-underline",
                                  itemActive && "bg-primary text-primary-foreground shadow-sm"
                                )}
                              >
                                <div className={cn(
                                  "p-2 rounded-md transition-colors duration-200",
                                  itemActive 
                                    ? "bg-primary-foreground/20" 
                                    : "bg-primary/10 group-hover:bg-primary/20"
                                )}>
                                  <ItemIcon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-sm leading-none">{item.label}</span>
                                  {item.description && (
                                    <span className="text-xs text-muted-foreground leading-relaxed">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          );
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Notifications Quick Access */}
            <Link 
              to="/notifications"
              className={cn(
                "p-2 rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                currentPath === "/notifications" && "bg-primary/10 text-primary"
              )}
            >
              <Bell className="h-5 w-5" />
            </Link>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">{userEmail}</span>
                <span className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2 h-10 rounded-lg hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="p-1 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-card border border-border shadow-xl rounded-lg p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-border mb-2">
                    <p className="font-medium text-sm text-foreground">{userEmail}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
                  </div>
                  
                  <DropdownMenuItem asChild>
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <User className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link 
                      to="/notifications" 
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Notificaciones</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem 
                    onClick={onLogout}
                    className="flex items-center gap-3 px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-md"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}