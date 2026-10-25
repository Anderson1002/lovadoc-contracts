import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrentUserProcess } from "@/hooks/useCurrentUserProcess";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";

export function ProcessCard() {
  const { userProcess, loading } = useCurrentUserProcess();

  if (loading) {
    return (
      <Card className="dashboard-stat dashboard-process">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mi Proceso</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-stat dashboard-process">
      <CardHeader className="dashboard-stat-heading space-y-0">
        <span className="dashboard-stat-icon"><Building2 className="h-4 w-4" /></span>
        <CardTitle className="text-xs font-medium text-muted-foreground">Mi Proceso</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {userProcess.proceso_nombre ? (
          <div>
            <div className="dashboard-stat-value font-bold">
              {userProcess.proceso_nombre}
            </div>
            <Badge variant="secondary" className="mt-2">
              ID: {userProcess.proceso_id}
            </Badge>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No asignado a ningún proceso
          </div>
        )}
      </CardContent>
    </Card>
  );
}