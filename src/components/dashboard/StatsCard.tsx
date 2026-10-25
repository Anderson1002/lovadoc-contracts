import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("dashboard-stat transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="dashboard-stat-heading space-y-0">
        <span className="dashboard-stat-icon"><Icon className="h-4 w-4" /></span>
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="dashboard-stat-value font-bold text-foreground">{value}</div>
        {description && (
          <p className="dashboard-stat-description text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}% vs mes anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}