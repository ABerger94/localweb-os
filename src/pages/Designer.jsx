import { useState } from "react";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Designer", href: "/designer", icon: null },
];

export default function Designer() {
  const [activeTab, setActiveTab] = useState("wireframes");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Designer Studio"
            description="Create wireframes, manage assets, and generate websites"
          />

          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start border-b">
                <TabsTrigger value="wireframes">Wireframes</TabsTrigger>
                <TabsTrigger value="assets">Design Assets</TabsTrigger>
                <TabsTrigger value="website">Website Builder</TabsTrigger>
              </TabsList>

              <TabsContent value="wireframes" className="p-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Wireframe planning coming soon</p>
                </div>
              </TabsContent>

              <TabsContent value="assets" className="p-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Design asset management coming soon</p>
                </div>
              </TabsContent>

              <TabsContent value="website" className="p-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">AI website builder coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}