import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CLIENT_PORTAL_NAVIGATION } from "@/lib/clientPortalNavigation";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import ClientNotificationPanel from "@/components/client/ClientNotificationPanel";



const PRIORITIES = ["Low", "Medium", "High"];

const statusColor = {
  Open: "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Resolved: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-700",
};

export default function ClientPortalSupport() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentClient, setCurrentClient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium" });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
      if (user?.client_id) {
        setCurrentClient({ id: user.client_id });
      } else if (user?.email) {
        base44.entities.Client.filter({ user_email: user.email }).then((clients) => {
          if (clients[0]) setCurrentClient(clients[0]);
        });
      }
    }).catch(console.error);
  }, []);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets", currentClient?.id],
    queryFn: () => base44.entities.MaintenanceTicket.filter({ client_id: currentClient.id }),
    enabled: !!currentClient?.id,
  });

  const clientTickets = tickets;

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.MaintenanceTicket.create({
        ...data,
        client_id: currentClient.id,
        submitted_by: currentUser.email,
        status: "Open",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", currentClient?.id] });
      setShowForm(false);
      setForm({ title: "", description: "", priority: "Medium" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createMutation.mutate(form);
  };

  const isLoading = !currentUser || !currentClient;

  if (isLoading || ticketsLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

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
              title="Support Tickets"
              description="Submit and track maintenance requests"
              action={() => setShowForm(true)}
              actionLabel="New Ticket"
              actionIcon={Plus}
              className="flex-1"
            />
            <div className="hidden lg:block">
              <ClientNotificationPanel />
            </div>
          </div>

          {/* New Ticket Form */}
          {showForm && (
            <Card className="mb-6 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">New Support Ticket</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Brief title of the issue"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="h-24"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-muted-foreground">Priority:</p>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, priority: p }))}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                          form.priority === p
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:border-primary"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Submitting..." : "Submit Ticket"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Ticket List */}
          {clientTickets.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No support tickets yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click "New Ticket" to report an issue</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {clientTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-foreground">{ticket.title}</p>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColor[ticket.status] || "bg-muted text-muted-foreground")}>
                            {ticket.status}
                          </span>
                          <Badge variant="outline" className="text-xs">{ticket.priority}</Badge>
                        </div>
                        {ticket.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                        )}
                        {ticket.response_notes && (
                          <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs font-medium text-primary mb-0.5">Agency Response</p>
                            <p className="text-xs text-foreground">{ticket.response_notes}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted {new Date(ticket.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}