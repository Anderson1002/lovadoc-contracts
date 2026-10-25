import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";

interface ContractStatusData { name: string; value: number; color: string; }
interface ContractStatusChartProps { data: ContractStatusData[]; }

export function ContractStatusChart({ data }: ContractStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const CustomTooltip = ({ active, payload }: any) => {
    const entry = payload?.[0];
    if (!active || !entry) return null;
    return <div className="bg-popover text-popover-foreground p-3 border rounded-md shadow-lg">
      <p className="font-medium">{entry.payload.name}</p>
      <p className="text-sm text-muted-foreground">{entry.value} contrato{entry.value !== 1 ? 's' : ''}</p>
    </div>;
  };
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <PieIcon className="h-5 w-5 text-primary" />Estado de Contratos
        </CardTitle>
        <p className="text-sm text-muted-foreground">Estado actual de los contratos</p>
      </CardHeader>
      <CardContent>
        <div className="status-chart-grid">
          <div className="status-donut">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={100} innerRadius={64}
                  dataKey="value" stroke="hsl(var(--card))" strokeWidth={2}>
                  {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="status-donut-total"><strong className="text-2xl text-foreground">{total}</strong><span className="text-xs text-muted-foreground">Contratos</span></div>
          </div>
          <div className="status-chart-legend">
            {data.map(entry => <div key={entry.name} className="status-chart-legend-row">
              <span className="status-chart-legend-name"><svg className="status-chart-legend-dot" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill={entry.color} /></svg>{entry.name}</span>
              <strong>{entry.value}</strong><span className="text-muted-foreground">{total ? Math.round(entry.value / total * 100) : 0}%</span>
            </div>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
