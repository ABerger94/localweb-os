import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Target,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Onboarding", href: "/onboarding", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Support Tickets", href: "/support", icon: null },
  { label: "Designer", href: "/designer", icon: null },
];

export default function Dashboard() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: retainers = [] } = useQuery({
    queryKey: ["retainers"],
    queryFn: () => base44.entities.Retainer.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.MaintenanceTicket.list(),
  });

  // Calculate metrics
  const activeRetainers = retainers.filter((r) => r.status === "Active");
  const mrr = activeRetainers.reduce((sum, r) => sum + (r.monthly_amount || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === "Paid");
  const pendingInvoices = invoices.filter((i) => i.status === "Pending");
  const totalCollected = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPending = pendingInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const activeProjects = projects.filter(
    (p) => p.status === "In Progress" || p.status === "Review"
  );
  const openTickets = tickets.filter((t) => t.status === "Open");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Dashboard"
            description="Your agency at a glance"
          />

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Monthly Recurring Revenue"
              value={`$${mrr.toFixed(0)}`}
              icon={DollarSign}
            />
            <StatCard
              title="Total Collected"
              value={`$${totalCollected.toFixed(0)}`}
              icon={CheckCircle2}
            />
            <StatCard
              title="Pending Amount"
              value={`$${totalPending.toFixed(0)}`}
              icon={AlertCircle}
            />
            <StatCard
              title="Active Projects"
              value={activeProjects.length}
              icon={FileText}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Open Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {openTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open tickets</p>
                ) : (
                  <div className="space-y-3">
                    {openTickets.slice(0, 5).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start justify-between gap-3 p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {ticket.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Priority: <StatusBadge status={ticket.priority} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending invoices</p>
                ) : (
                  <div className="space-y-3">
                    {pendingInvoices.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            ${invoice.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
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