import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Clients", href: "/clients" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Projects", href: "/projects" },
  { label: "Invoices", href: "/invoices" },
  { label: "Retainers", href: "/retainers" },
  { label: "Support Tickets", href: "/support" },
  { label: "Designer", href: "/designer" },
];

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];

const statusColor = {
  Open: "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Resolved: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-700",
};

const priorityColor = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-orange-100 text-orange-700",
  High: "bg-red-100 text-red-700",
  Critical: "bg-red-200 text-red-900",
};

function TicketCard({ ticket, clientName, onUpdateStatus, onSaveResponse }) {
  const [expanded, setExpanded] = useState(false);
  const [response, setResponse] = useState(ticket.response_notes || "");
  const [saving, setSaving] = useState(false);

  const handleSaveResponse = async () => {
    setSaving(true);
    await onSaveResponse(ticket.id, response);
    setSaving(false);
  };

  return (
    <Card className="border">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold text-foreground">{ticket.title}</p>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColor[ticket.status])}>
                {ticket.status}
              </span>
              <Badge variant="outline" className={cn("text-xs", priorityColor[ticket.priority])}>
                {ticket.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {clientName} · Submitted {new Date(ticket.created_date).toLocaleDateString()}
              {ticket.submitted_by && ` · ${ticket.submitted_by}`}
            </p>
            {ticket.description && (
              <p className="text-sm text-foreground mt-2">{ticket.description}</p>
            )}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {/* Status Picker */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateStatus(ticket.id, s)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                      ticket.status === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Response */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Response to Client</p>
              <Textarea
                placeholder="Add a response visible to the client..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="text-sm h-20"
              />
              <Button size="sm" className="mt-2 gap-2" onClick={handleSaveResponse} disabled={saving}>
                <Send className="w-3 h-3" />
                {saving ? "Saving..." : "Save Response"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SupportTickets() {
  const [statusFilter, setStatusFilter] = useState("Open");
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.MaintenanceTicket.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceTicket.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });

  const handleUpdateStatus = (id, status) => updateMutation.mutate({ id, data: { status } });
  const handleSaveResponse = (id, response_notes) => updateMutation.mutateAsync({ id, data: { response_notes } });

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.business_name]));

  const filtered = statusFilter === "All"
    ? tickets
    : tickets.filter((t) => t.status === statusFilter);

  const counts = {
    All: tickets.length,
    Open: tickets.filter((t) => t.status === "Open").length,
    "In Progress": tickets.filter((t) => t.status === "In Progress").length,
    Resolved: tickets.filter((t) => t.status === "Resolved").length,
    Closed: tickets.filter((t) => t.status === "Closed").length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />
      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader title="Support Tickets" description="Manage client maintenance requests" />

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {["All", "Open", "In Progress", "Resolved", "Closed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:border-primary"
                )}
              >
                {s} {counts[s] > 0 && <span className="ml-1 opacity-70">({counts[s]})</span>}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No {statusFilter !== "All" ? statusFilter.toLowerCase() : ""} tickets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  clientName={clientMap[ticket.client_id] || "Unknown Client"}
                  onUpdateStatus={handleUpdateStatus}
                  onSaveResponse={handleSaveResponse}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}