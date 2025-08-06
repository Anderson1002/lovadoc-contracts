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
  Bell,
  Timer,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  roles: string[];
  badge?: string;
}

interface TopNavProps {
  userRole: string;
  pendingApprovals?: number;
}

export function TopNav({ userRole, pendingApprovals = 0 }: TopNavProps) {
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
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Nuevo",
      url: "/contracts/new",
      icon: FileText,
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Consulta",
      url: "/contracts/query",
      icon: FileCheck,
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Pendientes",
      url: "/contracts/pending",
      icon: Timer,
      roles: ["super_admin", "admin", "supervisor"],
      badge: pendingApprovals > 0 ? pendingApprovals.toString() : undefined
    },
    {
      title: "Cuentas",
      url: "/billing",
      icon: DollarSign,
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Trámites",
      url: "/procedures",
      icon: FileCheck,
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Equipos",
      url: "/equipment",
      icon: Building2,
      roles: ["super_admin", "admin", "supervisor"]
    },
    {
      title: "Personal",
      url: "/users",
      icon: Users,
      roles: ["super_admin", "admin"]
    },
    {
      title: "Jurídica",
      url: "/legal",
      icon: Shield,
      roles: ["super_admin", "admin"]
    },
    {
      title: "Supervisión",
      url: "/supervision",
      icon: Award,
      roles: ["super_admin", "admin", "supervisor"]
    },
    {
      title: "Reportes",
      url: "/reports",
      icon: BarChart3,
      roles: ["super_admin", "admin", "supervisor"]
    },
    {
      title: "Perfil",
      url: "/profile",
      icon: User,
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Notif.",
      url: "/notifications",
      icon: Bell,
      roles: ["super_admin", "admin", "supervisor", "employee"]
    },
    {
      title: "Config",
      url: "/settings",
      icon: Settings,
      roles: ["super_admin", "admin"]
    }
  ];

  const isActive = (path: string) => currentPath === path;

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="bg-card border-b border-border shadow-sm">
      <ScrollArea className="w-full">
        <div className="flex items-center justify-start px-6 py-3 gap-1 min-w-max">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            
            return (
              <Button
                key={item.title}
                asChild
                variant="ghost"
                className={`
                  flex items-center gap-2 h-10 px-4 py-2 rounded-lg transition-all duration-200 relative
                  ${active 
                    ? 'bg-primary text-primary-foreground shadow-sm font-medium border-b-2 border-primary' 
                    : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground border-b-2 border-transparent'
                  }
                `}
              >
                <Link to={item.url}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full ml-1"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}