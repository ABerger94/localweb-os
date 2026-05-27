import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import InvoiceModal from "@/components/invoices/InvoiceModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Check, Pencil, FileText, Trash2 } from "lucide-react";

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

export default function Invoices() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.Invoice.update(id, {
        status: "Paid",
        paid_date: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const getClientName = (clientId) =>
    clients.find((c) => c.id === clientId)?.business_name || "Unknown";

  const totalCollected = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalPending = invoices
    .filter((i) => i.status === "Pending")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const openCreate = () => { setEditingInvoice(null); setModalOpen(true); };
  const openEdit = (inv) => { setEditingInvoice(inv); setModalOpen(true); };
  const handleDelete = (id) => { if (confirm("Delete this invoice?")) deleteMutation.mutate(id); };

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
            action={openCreate}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard title="Total Collected" value={`$${totalCollected.toFixed(0)}`} />
            <StatCard title="Pending Amount" value={`$${totalPending.toFixed(0)}`} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {invoices.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No invoices yet. Create your first one.</p>
            )}
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Invoice #{invoice.invoice_number || invoice.id.slice(0, 6)}
                      </h3>
                      {invoice.file_url && (
                        <a href={invoice.file_url} target="_blank" rel="noreferrer" title="View attached file">
                          <FileText className="w-4 h-4 text-primary hover:opacity-70" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{getClientName(invoice.client_id)}</p>
                    {invoice.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{invoice.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={invoice.status} />
                      <span className="text-sm font-semibold text-foreground">${invoice.amount?.toFixed(2)}</span>
                      {invoice.due_date && (
                        <span className="text-xs text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(invoice)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(invoice.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {invoice.status === "Pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => markPaidMutation.mutate(invoice.id)}
                        disabled={markPaidMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <InvoiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        invoice={editingInvoice}
      />
    </div>
  );
}