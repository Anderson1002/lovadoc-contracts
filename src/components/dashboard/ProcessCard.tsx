import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrentUserProcess } from "@/hooks/useCurrentUserProcess";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";

export function ProcessCard() {
  const { userProcess, loading } = useCurrentUserProcess();

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mi Proceso</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-[200px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Mi Proceso</CardTitle>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {userProcess.proceso_nombre ? (
          <div>
            <div className="text-2xl font-bold text-ellipsis overflow-hidden">
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