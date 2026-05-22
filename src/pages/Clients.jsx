import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Onboarding", href: "/onboarding", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Designer", href: "/designer", icon: null },
];

export default function Clients() {
  const [search, setSearch] = useState("");
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const filteredClients = clients.filter(
    (c) =>
      c.business_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Clients"
            description="Manage your client relationships"
            actionLabel="New Client"
            actionIcon={Plus}
          />

          <Card className="mb-6">
            <div className="p-4">
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {client.business_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.contact_name} • {client.contact_email}
                    </p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <StatusBadge status={client.status} />
                      <StatusBadge status={client.pipeline_stage} />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}