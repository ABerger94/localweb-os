import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function NotificationBell({ notifications = [], onMarkAsRead }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnread = unreadCount > 0;

  const getIcon = (type) => {
    switch (type) {
      case 'invoice_due': return '💰';
      case 'invoice_overdue': return '⚠️';
      case 'retainer_billing': return '📅';
      case 'project_update': return '📁';
      case 'ticket_response': return '💬';
      case 'onboarding_action': return '✅';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 60000); // minutes
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="end">
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2 pb-2 border-b">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => notifications.filter(n => !n.read).forEach(n => onMarkAsRead(n.id))}
              >
                Mark all read
              </Button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  notification.read 
                    ? "bg-muted/30 border-border" 
                    : "bg-background border-primary/30 hover:bg-muted/50"
                )}
                onClick={() => {
                  onMarkAsRead(notification.id);
                  if (notification.action_url) {
                    navigate(notification.action_url);
                    setOpen(false);
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn(
                        "text-sm font-medium",
                        notification.read ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded border",
                        getPriorityColor(notification.priority)
                      )}>
                        {notification.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}