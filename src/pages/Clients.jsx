import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import ClientDetailDrawer from "@/components/client/ClientDetailDrawer";
import ClientEditModal from "@/components/client/ClientEditModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil } from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Onboarding", href: "/onboarding", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Support Tickets", href: "/support", icon: null },
  { label: "Designer", href: "/designer", icon: null },
  { label: "QR Code", href: "/qr-code", icon: null },
];

export default function Clients() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const filteredClients = clients.filter(
    (c) =>
      c.business_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditClient(null); setEditModalOpen(true); };
  const openEdit = (e, client) => { e.stopPropagation(); setEditClient(client); setEditModalOpen(true); };
  const handleDelete = (e, id) => { e.stopPropagation(); if (confirm("Delete this client?")) deleteMutation.mutate(id); };

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
            action={openNew}
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
              <Card
                key={client.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">{client.business_name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.contact_name} • {client.contact_email}
                    </p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <StatusBadge status={client.status} />
                      <StatusBadge status={client.pipeline_stage} />
                      {client.location && <span className="text-xs text-muted-foreground">{client.location}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => openEdit(e, client)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(e, client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <ClientDetailDrawer
            client={selectedClient}
            open={!!selectedClient}
            onClose={() => setSelectedClient(null)}
            onEdit={(c) => { setSelectedClient(null); setEditClient(c); setEditModalOpen(true); }}
          />

          <ClientEditModal
            client={editClient}
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}