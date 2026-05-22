import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import Sidebar from "@/components/shared/Sidebar";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Bell,
} from "lucide-react";
import ClientProfileSetup from "@/components/client/ClientProfileSetup";
import ClientNotificationPanel from "@/components/client/ClientNotificationPanel";

import { CLIENT_PORTAL_NAVIGATION } from "@/lib/clientPortalNavigation";

export default function ClientPortal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentClient, setCurrentClient] = useState(null);

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: retainers = [] } = useQuery({
    queryKey: ["retainers"],
    queryFn: () => base44.entities.Retainer.list(),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.MaintenanceTicket.list(),
  });

  // Load current user
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    }
    loadUser();
  }, []);

  // Find client once both user and clients are loaded
  useEffect(() => {
    if (currentUser && clients.length > 0) {
      const client = clients.find(
        (c) => c.user_email?.toLowerCase() === currentUser.email?.toLowerCase()
      );
      setCurrentClient(client || null);
    }
  }, [currentUser, clients]);

  const isLoading = !currentUser || clientsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />
        <ClientProfileSetup
          currentUser={currentUser}
          onCreated={(client) => setCurrentClient(client)}
        />
      </div>
    );
  }

  const clientProjects = projects.filter((p) => p.client_id === currentClient.id);
  const clientInvoices = invoices.filter((i) => i.client_id === currentClient.id);
  const clientRetainers = retainers.filter((r) => r.client_id === currentClient.id);
  const clientTickets = tickets.filter((t) => t.client_id === currentClient.id);
  const pendingInvoices = clientInvoices.filter((i) => i.status === "Pending");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <PageHeader
              title={`Welcome, ${currentClient.contact_name}`}
              description={currentClient.business_name}
              className="flex-1"
            />
            <ClientNotificationPanel />
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Active Projects"
              value={clientProjects.length}
              icon={FileText}
            />
            <StatCard
              title="Pending Invoices"
              value={pendingInvoices.length}
              icon={AlertCircle}
            />
            <StatCard
              title="Active Retainers"
              value={clientRetainers.filter((r) => r.status === "Active").length}
              icon={CheckCircle2}
            />
            <StatCard
              title="Open Tickets"
              value={clientTickets.filter((t) => t.status === "Open").length}
            />
          </div>

          {/* Onboarding Checklist */}
          {currentClient.pipeline_stage === "Onboarding" && (
            <Card className="mb-8 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle>Complete Your Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Help us understand your business better
                </p>
                <Button asChild>
                  <Link to="/client-portal/onboarding">Start Checklist</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Projects</CardTitle>
                <Link to="/client-portal/projects">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {clientProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                ) : (
                  <div className="space-y-3">
                    {clientProjects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {project.project_name}
                          </p>
                          <StatusBadge status={project.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Invoices */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Invoices</CardTitle>
                <Link to="/client-portal/invoices">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {pendingInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending invoices</p>
                ) : (
                  <div className="space-y-3">
                    {pendingInvoices.slice(0, 3).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            ${invoice.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Pay</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}