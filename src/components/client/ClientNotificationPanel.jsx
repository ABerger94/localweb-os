import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import NotificationBell from "./NotificationBell";

export default function ClientNotificationPanel() {
  const [notifications, setNotifications] = useState([]);

  const { data } = useQuery({
    queryKey: ['client-notifications'],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateClientNotifications', {});
      return res.data?.notifications || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data]);

  const handleMarkAsRead = async (notificationId) => {
    // In production, you'd save read status to an entity
    // For now, just update local state
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  return (
    <NotificationBell
      notifications={notifications}
      onMarkAsRead={handleMarkAsRead}
    />
  );
}
