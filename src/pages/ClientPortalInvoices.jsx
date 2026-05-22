import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ExternalLink } from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/client-portal", icon: null },
  { label: "Projects", href: "/client-portal/projects", icon: null },
  { label: "Invoices", href: "/client-portal/invoices", icon: null },
  { label: "Retainers", href: "/client-portal/retainers", icon: null },
  { label: "Support Tickets", href: "/client-portal/support", icon: null },
  { label: "Account", href: "/client-portal/account", icon: null },
];

export default function ClientPortalInvoices() {
  const [currentClient, setCurrentClient] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  useEffect(() => {
    async function loadUser() {
      const user = await base44.auth.me();
      const client = clients.find((c) => c.user_email === user.email);
      setCurrentClient(client);
    }
    if (clients.length > 0) loadUser();
  }, [clients]);

  if (!currentClient) return null;

  const clientInvoices = invoices.filter((i) => i.client_id === currentClient.id);
  const totalPaid = clientInvoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} isClientPortal />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Invoices"
            description="View and pay your invoices"
          />

          <div className="mb-8">
            <StatCard
              title="Total Paid"
              value={`$${totalPaid.toFixed(0)}`}
              icon={DollarSign}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {clientInvoices.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Invoice #{invoice.invoice_number}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      ${invoice.amount.toFixed(2)}
                    </p>
                    <div className="flex gap-3 mt-3">
                      <StatusBadge status={invoice.status} />
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {invoice.status === "Pending" && (
                    <Button onClick={async () => {
                      const res = await base44.functions.invoke("createStripePaymentLink", {
                        invoiceId: invoice.id,
                        amount: invoice.amount,
                        clientEmail: currentClient.contact_email,
                        clientName: currentClient.business_name,
                      });
                      if (res.data?.paymentLink) {
                        window.location.href = res.data.paymentLink;
                      }
                    }}>
                      Pay Now
                      <ExternalLink className="w-4 h-4 ml-1" />
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