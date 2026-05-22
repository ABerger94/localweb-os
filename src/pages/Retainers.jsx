import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import RetainerModal from "@/components/retainers/RetainerModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, FileText, Trash2 } from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Designer", href: "/designer", icon: null },
  { label: "QR Code", href: "/qr-code", icon: null },
];

export default function Retainers() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRetainer, setEditingRetainer] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Retainer.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retainers"] }),
  });

  const { data: retainers = [] } = useQuery({
    queryKey: ["retainers"],
    queryFn: () => base44.entities.Retainer.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const getClientName = (clientId) =>
    clients.find((c) => c.id === clientId)?.business_name || "Unknown";

  const mrr = retainers
    .filter((r) => r.status === "Active")
    .reduce((sum, r) => sum + (r.monthly_amount || 0), 0);

  const openCreate = () => { setEditingRetainer(null); setModalOpen(true); };
  const openEdit = (r) => { setEditingRetainer(r); setModalOpen(true); };
  const handleDelete = (id) => { if (confirm("Delete this retainer?")) deleteMutation.mutate(id); };

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
            action={openCreate}
          />

          <div className="mb-8">
            <StatCard title="Monthly Recurring Revenue" value={`$${mrr.toFixed(0)}`} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {retainers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No retainers yet. Create your first one.</p>
            )}
            {retainers.map((retainer) => (
              <Card key={retainer.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {getClientName(retainer.client_id)}
                      </h3>
                      {retainer.agreement_file_url && (
                        <a href={retainer.agreement_file_url} target="_blank" rel="noreferrer" title="View agreement">
                          <FileText className="w-4 h-4 text-primary hover:opacity-70" />
                        </a>
                      )}
                    </div>
                    {retainer.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{retainer.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly</p>
                        <p className="text-lg font-semibold text-foreground">${retainer.monthly_amount?.toFixed(2)}</p>
                      </div>
                      <StatusBadge status={retainer.status} />
                      {retainer.next_billing_date && (
                        <p className="text-xs text-muted-foreground">
                          Next billing: {new Date(retainer.next_billing_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(retainer)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(retainer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <RetainerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        retainer={editingRetainer}
      />
    </div>
  );
}