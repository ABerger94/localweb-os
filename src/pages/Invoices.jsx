import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Designer", href: "/designer", icon: null },
];

export default function Invoices() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const getClientName = (clientId) => {
    return clients.find((c) => c.id === clientId)?.business_name || "Unknown";
  };

  const totalCollected = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalPending = invoices
    .filter((i) => i.status === "Pending")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Invoices"
            description="Financial management"
            actionLabel="New Invoice"
            actionIcon={Plus}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard
              title="Total Collected"
              value={`$${totalCollected.toFixed(0)}`}
            />
            <StatCard
              title="Pending Amount"
              value={`$${totalPending.toFixed(0)}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      Invoice #{invoice.invoice_number}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getClientName(invoice.client_id)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <StatusBadge status={invoice.status} />
                      <span className="text-sm font-semibold text-foreground">
                        ${invoice.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {invoice.status === "Pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Mark Paid
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}