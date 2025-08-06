import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home,
  FileText, 
  Users, 
  DollarSign,
  Settings, 
  BarChart3,
  UserCheck,
  Building2,
  Shield,
  Award,
  Calendar,
  FileCheck,
  TrendingUp,
  Bell
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  roles: string[];
  badge?: string;
  children?: NavigationItem[];
}

interface AppSidebarProps {
  userRole: string;
  pendingApprovals?: number;
}

export function AppSidebar({ userRole, pendingApprovals = 0 }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Contratos",
      url: "/contracts",
      icon: FileText,
      roles: ["super_admin", "admin", "supervisor", "employee"],
      children: [
        {
          title: "Todos los Contratos",
          url: "/contracts",
          icon: FileText,
          roles: ["super_admin", "admin", "supervisor", "employee"]
        },
        {
          title: "Crear Contrato",
          url: "/contracts/new",
          icon: FileText,
          roles: ["super_admin", "admin", "supervisor", "employee"]
        },
        {
          title: "Pendientes Aprobación",
          url: "/contracts/pending",
          icon: FileCheck,
          roles: ["super_admin", "admin", "supervisor"],
          badge: pendingApprovals > 0 ? pendingApprovals.toString() : undefined
        }
      ]
    },
    {
      title: "Pagos y Facturación",
      url: "/payments",
      icon: DollarSign,
      roles: ["super_admin", "admin", "supervisor"],
      children: [
        {
          title: "Gestión de Pagos",
          url: "/payments",
          icon: DollarSign,
          roles: ["super_admin", "admin", "supervisor"]
        },
        {
          title: "Facturas",
          url: "/payments/invoices",
          icon: FileText,
          roles: ["super_admin", "admin", "supervisor"]
        },
        {
          title: "Reportes Financieros",
          url: "/payments/reports",
          icon: TrendingUp,
          roles: ["super_admin", "admin"]
        }
      ]
    },
    {
      title: "Usuarios y Roles",
      url: "/users",
      icon: Users,
      roles: ["super_admin", "admin"],
      children: [
        {
          title: "Gestión de Usuarios",
          url: "/users",
          icon: Users,
          roles: ["super_admin", "admin"]
        },
        {
          title: "Roles y Permisos",
          url: "/users/roles",
          icon: Shield,
          roles: ["super_admin"]
        },
        {
          title: "Contratistas",
          url: "/users/contractors",
          icon: UserCheck,
          roles: ["super_admin", "admin", "supervisor"]
        }
      ]
    },
    {
      title: "Reportes y Analíticas",
      url: "/reports",
      icon: BarChart3,
      roles: ["super_admin", "admin", "supervisor"],
      children: [
        {
          title: "Dashboard Ejecutivo",
          url: "/reports",
          icon: BarChart3,
          roles: ["super_admin", "admin"]
        },
        {
          title: "Análisis de Costos",
          url: "/reports/costs",
          icon: TrendingUp,
          roles: ["super_admin", "admin"]
        },
        {
          title: "Rendimiento Contratistas",
          url: "/reports/performance",
          icon: Award,
          roles: ["super_admin", "admin", "supervisor"]
        }
      ]
    },
    {
      title: "Mi Área",
      url: "/profile",
      icon: Building2,
      roles: ["super_admin", "admin", "supervisor", "employee"],
      children: [
        {
          title: "Mis Contratos",
          url: "/my-area/contracts",
          icon: FileText,
          roles: ["supervisor", "employee"]
        },
        {
          title: "Mis Pagos",
          url: "/my-area/payments",
          icon: DollarSign,
          roles: ["employee"]
        },
        {
          title: "Documentos",
          url: "/my-area/documents",
          icon: FileCheck,
          roles: ["supervisor", "employee"]
        },
        {
          title: "Calendario",
          url: "/my-area/calendar",
          icon: Calendar,
          roles: ["supervisor", "employee"]
        }
      ]
    },
    {
      title: "Notificaciones",
      url: "/notifications",
      icon: Bell,
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Configuración",
      url: "/settings",
      icon: Settings,
      roles: ["super_admin", "admin"],
      children: [
        {
          title: "Configuración General",
          url: "/settings",
          icon: Settings,
          roles: ["super_admin", "admin"]
        },
        {
          title: "Tipos de Contrato",
          url: "/settings/contract-types",
          icon: FileText,
          roles: ["super_admin"]
        },
        {
          title: "Flujos de Aprobación",
          url: "/settings/approval-flows",
          icon: FileCheck,
          roles: ["super_admin"]
        }
      ]
    }
  ];

  const isActive = (path: string) => currentPath === path;
  const hasActiveChild = (item: NavigationItem) => {
    if (item.children) {
      return item.children.some(child => isActive(child.url));
    }
    return false;
  };

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const renderMenuItem = (item: NavigationItem, isChild = false) => {
    const Icon = item.icon;
    const active = isActive(item.url);
    const hasActiveChildren = hasActiveChild(item);
    
    if (!item.roles.includes(userRole)) {
      return null;
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <Link 
            to={item.url} 
            className={`flex items-center gap-3 ${
              active || hasActiveChildren 
                ? 'bg-primary text-primary-foreground font-medium' 
                : 'hover:bg-accent hover:text-accent-foreground'
            } ${isChild ? 'pl-8' : ''}`}
          >
            <Icon className="h-4 w-4" />
            {!collapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge variant="destructive" className="h-5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        </SidebarMenuButton>
        
        {/* Render children if expanded and has active child */}
        {!collapsed && item.children && hasActiveChildren && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navegación Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.slice(0, 3).map(item => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section */}
        {(userRole === "super_admin" || userRole === "admin") && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Administración
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredItems.slice(3, 5).map(item => renderMenuItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Personal Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Personal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.filter(item => item.url === "/profile").map(item => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.filter(item => 
                item.url === "/notifications" || item.url === "/settings"
              ).map(item => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}