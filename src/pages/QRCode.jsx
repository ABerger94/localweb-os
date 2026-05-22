import { useState } from "react";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

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

export default function QRCodePage() {
  const [qrSize, setQrSize] = useState(300);

  // Get the client portal URL - use the current app's URL
  const getPortalUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/client-portal`;
  };

  const portalUrl = getPortalUrl();
  // Use qr-code-styling.com API for QR code generation
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(portalUrl)}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success("Portal URL copied to clipboard");
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "client-portal-qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("QR code downloaded");
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Client Portal QR Code"
            description="Share this QR code with clients for quick portal access"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">QR Code</h2>
              </div>
              
              <div className="flex justify-center mb-6">
                <img 
                  src={qrCodeUrl} 
                  alt="Client Portal QR Code" 
                  className="border rounded-lg shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleDownloadQR} 
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleCopyUrl}
                  className="w-full gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Portal URL
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">How to Use</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm mb-1">1. Download the QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the download button to save the QR code image to your device.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-sm mb-1">2. Share with Clients</h3>
                  <p className="text-sm text-muted-foreground">
                    Add the QR code to welcome emails, business cards, brochures, or print it for in-person meetings.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-sm mb-1">3. Clients Scan to Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Clients scan the QR code with their phone camera to instantly access the client portal.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium text-sm mb-1">Portal URL</h3>
                  <p className="text-sm text-muted-foreground break-all bg-muted p-2 rounded">
                    {portalUrl}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}