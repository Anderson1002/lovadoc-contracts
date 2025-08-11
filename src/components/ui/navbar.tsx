import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userRole?: string;
  onLogout?: () => void;
}

export function Navbar({ userRole = "employee", onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { href: "/", icon: BarChart3, label: "Dashboard", roles: ["super_admin", "admin", "supervisor", "employee"] },
    { href: "/contracts", icon: FileText, label: "Contratos", roles: ["super_admin", "admin", "supervisor", "employee"] },
    { href: "/payments", icon: Building2, label: "Pagos", roles: ["super_admin", "admin", "supervisor"] },
    { href: "/users", icon: Users, label: "Usuarios", roles: ["super_admin", "admin"] },
    { href: "/settings", icon: Settings, label: "Configuración", roles: ["super_admin", "admin"] },
  ];

  const userNavigation = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">Maktub</span>
                <span className="text-xs text-muted-foreground">Gestión de Contratos</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {userNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="flex items-center space-x-2 text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {userNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start flex items-center space-x-2",
                        isActive(item.href) && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start flex items-center space-x-2 text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}