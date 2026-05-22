import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const EVENT_COLORS = {
  meeting: "bg-blue-500",
  project: "bg-orange-500",
  invoice: "bg-red-500",
  retainer: "bg-green-500",
};

export default function DashboardCalendar({ events }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build a map of day -> events for the current month/year
  const eventsByDay = {};
  events.forEach((event) => {
    const d = new Date(event.date);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(event);
    }
  });

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : [];

  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long", year: "numeric" });
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-36 text-center">{monthName}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
            const hasEvents = !!eventsByDay[day];
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cn(
                  "flex flex-col items-center justify-start py-1 rounded-lg text-xs font-medium transition-colors min-h-[40px]",
                  isToday && "bg-primary text-primary-foreground",
                  isSelected && !isToday && "bg-muted",
                  !isToday && !isSelected && "hover:bg-muted/60 text-foreground",
                )}
              >
                <span>{day}</span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {eventsByDay[day].slice(0, 3).map((ev, idx) => (
                      <span key={idx} className={cn("w-1.5 h-1.5 rounded-full", EVENT_COLORS[ev.type] || "bg-gray-400")} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", color)} />
              <span className="text-xs text-muted-foreground capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-foreground">
              {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events</p>
            ) : (
              selectedEvents.map((ev, idx) => {
                const eventDate = new Date(ev.date);
                const hasTime = eventDate.getHours() !== 0 || eventDate.getMinutes() !== 0;
                return (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                    <span className={cn("w-2 h-2 rounded-full mt-1 shrink-0", EVENT_COLORS[ev.type] || "bg-gray-400")} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{ev.title}</p>
                      {ev.clientName && <p className="text-xs text-muted-foreground">{ev.clientName}</p>}
                      {hasTime && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          🕐 {eventDate.toLocaleTimeString("default", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}