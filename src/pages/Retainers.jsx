import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Designer", href: "/designer", icon: null },
];

export default function Retainers() {
  const { data: retainers = [] } = useQuery({
    queryKey: ["retainers"],
    queryFn: () => base44.entities.Retainer.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const getClientName = (clientId) => {
    return clients.find((c) => c.id === clientId)?.business_name || "Unknown";
  };

  const mrr = retainers
    .filter((r) => r.status === "Active")
    .reduce((sum, r) => sum + (r.monthly_amount || 0), 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Retainers"
            description="Manage recurring revenue"
            actionLabel="New Retainer"
            actionIcon={Plus}
          />

          <div className="mb-8">
            <StatCard
              title="Monthly Recurring Revenue"
              value={`$${mrr.toFixed(0)}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {retainers.map((retainer) => (
              <Card key={retainer.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {getClientName(retainer.client_id)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {retainer.description}
                    </p>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${retainer.monthly_amount.toFixed(2)}
                        </p>
                      </div>
                      <StatusBadge status={retainer.status} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}