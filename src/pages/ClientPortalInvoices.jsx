import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, X, Loader2 } from "lucide-react";
import ClientNotificationPanel from "@/components/client/ClientNotificationPanel";
import StripePaymentForm from "@/components/invoices/StripePaymentForm";

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
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

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

  const handleInitiatePayment = async (invoice) => {
    try {
      setLoadingPayment(true);
      const res = await base44.functions.invoke("createStripePaymentLink", {
        invoiceId: invoice.id,
        amount: invoice.amount,
        clientEmail: currentClient.contact_email,
        clientName: currentClient.business_name,
      });
      
      if (res.data?.clientSecret && res.data?.publishableKey) {
        setClientSecret(res.data.clientSecret);
        setStripePromise(loadStripe(res.data.publishableKey));
        setPayingInvoice(invoice);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setLoadingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Mark invoice as paid
    await base44.entities.Invoice.update(payingInvoice.id, {
      status: "Paid",
      paid_date: new Date().toISOString().split("T")[0],
    });
    
    // Close payment modal
    setPayingInvoice(null);
    setClientSecret(null);
    
    // Refresh data
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} isClientPortal />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <PageHeader
              title="Invoices"
              description="View and pay your invoices"
              className="flex-1"
            />
            <div className="hidden lg:block">
              <ClientNotificationPanel />
            </div>
          </div>

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
                    <Button 
                      onClick={() => handleInitiatePayment(invoice)}
                      disabled={loadingPayment}
                    >
                      {loadingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Pay Now"
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Embedded Payment Modal */}
          {payingInvoice && stripePromise && clientSecret && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button
                  onClick={() => {
                    setPayingInvoice(null);
                    setClientSecret(null);
                  }}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-lg font-semibold mb-4">
                  Pay Invoice #{payingInvoice.invoice_number}
                </h3>
                
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm 
                    amount={payingInvoice.amount} 
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}