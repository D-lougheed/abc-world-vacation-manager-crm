
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: number;
  className?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {typeof trend === "number" && (
            <div
              className={cn(
                "text-xs font-medium mt-2",
                trend > 0
                  ? "text-green-500"
                  : trend < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              )}
            >
              {trend > 0 && "+"}
              {trend}% from last month
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
