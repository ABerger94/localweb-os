import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarClock, FileText, Receipt, RefreshCw } from "lucide-react";

const TYPE_CONFIG = {
  meeting: { icon: CalendarClock, color: "text-blue-600", bg: "bg-blue-50", label: "Meeting" },
  project: { icon: FileText, color: "text-orange-600", bg: "bg-orange-50", label: "Project Due" },
  invoice: { icon: Receipt, color: "text-red-600", bg: "bg-red-50", label: "Invoice Due" },
  retainer: { icon: RefreshCw, color: "text-green-600", bg: "bg-green-50", label: "Retainer Billing" },
};

function daysFromNow(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}

function RelativeDate({ date }) {
  const days = daysFromNow(date);
  if (days === 0) return <span className="text-xs font-semibold text-primary">Today</span>;
  if (days === 1) return <span className="text-xs font-semibold text-orange-600">Tomorrow</span>;
  if (days < 0) return <span className="text-xs text-red-600">{Math.abs(days)}d overdue</span>;
  return <span className="text-xs text-muted-foreground">In {days} days</span>;
}

export default function UpcomingEventsList({ events }) {
  const sorted = [...events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 12);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((event, idx) => {
              const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.project;
              const Icon = config.icon;
              return (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className={cn("p-1.5 rounded-md shrink-0", config.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {event.clientName && (
                        <span className="text-xs text-muted-foreground truncate">{event.clientName}</span>
                      )}
                      {event.notes && (
                        <span className="text-xs text-muted-foreground truncate italic">— {event.notes}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <RelativeDate date={event.date} />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(event.date).toLocaleDateString("default", { month: "short", day: "numeric" })}
                    </p>
                    {(() => {
                      const eventDate = new Date(event.date);
                      const hasTime = eventDate.getHours() !== 0 || eventDate.getMinutes() !== 0;
                      if (hasTime) {
                        return (
                          <p className="text-xs font-medium text-primary mt-0.5">
                            🕐 {eventDate.toLocaleTimeString("default", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}