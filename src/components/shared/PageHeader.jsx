import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PageHeader({
  title,
  description,
  action,
  actionLabel = "Add",
  actionIcon: ActionIcon,
  secondaryAction,
  secondaryActionLabel,
  className,
}) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
          {action && (
            <Button
              onClick={action}
              className="gap-2"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4" />}
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}