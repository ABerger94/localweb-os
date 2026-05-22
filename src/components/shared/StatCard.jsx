import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp = true,
  onClick,
  className,
}) {
  return (
    <Card
      className={cn(
        "border border-border hover:border-primary/30 transition-colors cursor-pointer",
        onClick && "hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium mt-2",
                  trendUp ? "text-green-600" : "text-red-600"
                )}
              >
                {trendUp ? "↑" : "↓"} {trend}
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg ml-3">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}