import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { CLIENT_PORTAL_NAVIGATION } from "@/lib/clientPortalNavigation";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, CheckCircle2, Circle, Clock, FileText, Image as ImageIcon, Link as LinkIcon, Palette, Type } from "lucide-react";
import ClientNotificationPanel from "@/components/client/ClientNotificationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



export default function ClientPortalProjects() {
  const [currentClient, setCurrentClient] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => setUserEmail(u?.email?.toLowerCase() || null));
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", userEmail],
    queryFn: () => base44.entities.Client.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", currentClient?.id],
    queryFn: () => base44.entities.Project.filter({ client_id: currentClient.id }),
    enabled: !!currentClient?.id,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["design-assets", currentClient?.id],
    queryFn: () => base44.entities.DesignAsset.filter({ client_id: currentClient.id }),
    enabled: !!currentClient?.id,
  });

  useEffect(() => {
    if (clients.length > 0) {
      setCurrentClient(clients[0]);
    }
  }, [clients]);

  if (!userEmail || (userEmail && clients.length === 0 && !currentClient)) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading your projects...</p>
        </div>
      </div>
    );
  }

  const clientProjects = projects;
  const clientAssets = assets;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <PageHeader
              title="Your Projects"
              description="View the status of your website projects"
              className="flex-1"
            />
            <ClientNotificationPanel />
          </div>

          <div className="space-y-4">
            {clientProjects.map((project) => {
              let roadmapData = [];
              if (project.roadmap) {
                try {
                  roadmapData = typeof project.roadmap === "string" ? JSON.parse(project.roadmap) : project.roadmap;
                } catch {
                  roadmapData = [];
                }
              }
              const completedMilestones = roadmapData.filter(m => m.status === "Completed").length;
              const progressPercentage = roadmapData.length > 0 ? Math.round((completedMilestones / roadmapData.length) * 100) : 0;
              const isExpanded = expandedProject?.id === project.id;

              return (
                <Card key={project.id} className={isExpanded ? "ring-2 ring-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{project.project_name}</CardTitle>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
                        )}
                        <div className="flex gap-3 mt-4">
                          <StatusBadge status={project.status} />
                          {project.due_date && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(project.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setExpandedProject(isExpanded ? null : project)}
                      >
                        {isExpanded ? "Collapse" : "View Details"}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="space-y-6">
                      <Tabs defaultValue="roadmap" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="scope">Scope</TabsTrigger>
                          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
                          <TabsTrigger value="assets">Assets</TabsTrigger>
                        </TabsList>

                        {/* Scope Tab */}
                        <TabsContent value="scope" className="space-y-4 mt-4">
                          {project.scope_description ? (
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{project.scope_description}</p>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No scope details available.</p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Roadmap Tab */}
                        <TabsContent value="roadmap" className="space-y-4 mt-4">
                          {roadmapData.length > 0 && (
                            <Card>
                              <CardContent className="pt-4">
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium">Progress</p>
                                    <p className="text-sm text-muted-foreground">{completedMilestones}/{roadmapData.length} completed</p>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full transition-all"
                                      style={{ width: `${progressPercentage}%` }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {roadmapData.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No roadmap milestones defined yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {roadmapData.map((milestone, index) => {
                                const statusIcons = {
                                  "Planned": Circle,
                                  "In Progress": Clock,
                                  "Completed": CheckCircle2,
                                  "On Hold": Circle,
                                };
                                const statusColors = {
                                  "Planned": "bg-slate-100 text-slate-700",
                                  "In Progress": "bg-blue-100 text-blue-700",
                                  "Completed": "bg-green-100 text-green-700",
                                  "On Hold": "bg-amber-100 text-amber-700",
                                };
                                const Icon = statusIcons[milestone.status] || Circle;
                                return (
                                  <Card key={milestone.id || index}>
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                          <Icon className={`w-5 h-5 ${
                                            milestone.status === "Completed" ? "text-green-600" :
                                            milestone.status === "In Progress" ? "text-blue-600" :
                                            "text-slate-400"
                                          }`} />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h4 className="font-medium">{milestone.title}</h4>
                                            <Badge className={statusColors[milestone.status]}>
                                              <Icon className="w-3 h-3 mr-1" />
                                              {milestone.status}
                                            </Badge>
                                          </div>
                                          {milestone.description && (
                                            <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                                          )}
                                          {milestone.due_date && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                              <Calendar className="w-3 h-3" />
                                              Due: {new Date(milestone.due_date).toLocaleDateString()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </TabsContent>

                        {/* Assets Tab */}
                        <TabsContent value="assets" className="space-y-4 mt-4">
                          {clientAssets.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                              <p className="text-sm">No brand assets uploaded yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {clientAssets.filter(a => a.asset_type === "logo").length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Logos
                                  </h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {clientAssets.filter(a => a.asset_type === "logo").map((asset) => (
                                      <Card key={asset.id} className="overflow-hidden">
                                        <div className="aspect-video bg-muted flex items-center justify-center p-2">
                                          {asset.asset_value?.startsWith("http") ? (
                                            <img src={asset.asset_value} alt={asset.asset_name} className="max-h-full max-w-full object-contain" />
                                          ) : (
                                            <LinkIcon className="w-6 h-6 text-muted-foreground" />
                                          )}
                                        </div>
                                        <CardContent className="p-2">
                                          <p className="text-xs font-medium truncate">{asset.asset_name}</p>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {clientAssets.filter(a => a.asset_type === "color").length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Brand Colors
                                  </h4>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {clientAssets.filter(a => a.asset_type === "color").map((asset) => (
                                      <Card key={asset.id} className="overflow-hidden">
                                        <div 
                                          className="aspect-square"
                                          style={{ backgroundColor: asset.asset_value }}
                                        />
                                        <CardContent className="p-2">
                                          <p className="text-xs font-medium">{asset.asset_name}</p>
                                          <p className="text-xs text-muted-foreground font-mono">{asset.asset_value}</p>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {clientAssets.filter(a => a.asset_type === "font").length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Type className="w-4 h-4" />
                                    Fonts
                                  </h4>
                                  <div className="space-y-2">
                                    {clientAssets.filter(a => a.asset_type === "font").map((asset) => (
                                      <Card key={asset.id}>
                                        <CardContent className="p-3">
                                          <p className="text-sm font-medium">{asset.asset_name}</p>
                                          <p className="text-xs text-muted-foreground">{asset.asset_value}</p>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {clientAssets.filter(a => ["image", "icon"].includes(a.asset_type)).length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Images & Icons
                                  </h4>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {clientAssets.filter(a => ["image", "icon"].includes(a.asset_type)).map((asset) => (
                                      <Card key={asset.id} className="overflow-hidden">
                                        <div className="aspect-square bg-muted flex items-center justify-center p-2">
                                          {asset.asset_value?.startsWith("http") ? (
                                            <img src={asset.asset_value} alt={asset.asset_name} className="max-h-full max-w-full object-cover rounded" />
                                          ) : (
                                            <LinkIcon className="w-6 h-6 text-muted-foreground" />
                                          )}
                                        </div>
                                        <CardContent className="p-2">
                                          <p className="text-xs font-medium truncate">{asset.asset_name}</p>
                                          <Badge variant="outline" className="text-xs mt-1">{asset.asset_type}</Badge>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {clientProjects.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">No projects yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}