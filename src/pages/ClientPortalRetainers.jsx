import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CLIENT_PORTAL_NAVIGATION } from "@/lib/clientPortalNavigation";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { DollarSign, RefreshCw, Bell } from "lucide-react";
import ClientNotificationPanel from "@/components/client/ClientNotificationPanel";



export default function ClientPortalRetainers() {
  const [resolvedClientId, setResolvedClientId] = useState(null);

  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.client_id) {
        setResolvedClientId(user.client_id);
      } else if (user?.email) {
        base44.entities.Client.filter({ user_email: user.email }).then((clients) => {
          if (clients[0]) setResolvedClientId(clients[0].id);
        });
      }
    });
  }, []);

  const { data: retainers = [] } = useQuery({
    queryKey: ["retainers", resolvedClientId],
    queryFn: () => base44.entities.Retainer.filter({ client_id: resolvedClientId }),
    enabled: !!resolvedClientId,
  });

  if (!resolvedClientId) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const clientRetainers = retainers;
  const activeRetainers = clientRetainers.filter((r) => r.status === "Active");
  const mrr = activeRetainers.reduce((sum, r) => sum + (r.monthly_amount || 0), 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />
      <div className="flex-1 lg:ml-64">
        {/* Mobile top bar */}
        <div className="flex lg:hidden items-center justify-end px-4 pt-4 pb-2">
          <ClientNotificationPanel />
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <PageHeader
              title="Retainers"
              description="Your active service agreements"
              className="flex-1"
            />
            <div className="hidden lg:block">
              <ClientNotificationPanel />
            </div>
          </div>

          <div className="mb-8">
            <StatCard
              title="Monthly Recurring"
              value={`$${mrr.toFixed(0)}/mo`}
              icon={DollarSign}
            />
          </div>

          {clientRetainers.length === 0 ? (
            <Card className="p-8 text-center">
              <RefreshCw className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No retainer agreements yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your agency will set up your retainer agreement shortly.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {clientRetainers.map((retainer) => (
                <Card key={retainer.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Retainer Agreement</p>
                      {retainer.description && (
                        <p className="text-base font-semibold text-foreground mt-0.5">{retainer.description}</p>
                      )}
                      <p className="text-2xl font-bold text-foreground mt-2">
                        ${retainer.monthly_amount?.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      <div className="flex gap-3 mt-3 flex-wrap items-center">
                        <StatusBadge status={retainer.status} />
                        <span className="text-xs text-muted-foreground capitalize">
                          Billing: {retainer.billing_cycle}
                        </span>
                        {retainer.start_date && (
                          <span className="text-xs text-muted-foreground">
                            Started: {new Date(retainer.start_date).toLocaleDateString()}
                          </span>
                        )}
                        {retainer.next_billing_date && (
                          <span className="text-xs text-muted-foreground">
                            Next billing: {new Date(retainer.next_billing_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}