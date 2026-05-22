import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Type,
  X 
} from "lucide-react";

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

export default function ProjectDetailDrawer({ project, open, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: assets = [] } = useQuery({
    queryKey: ["design-assets", project?.client_id],
    queryFn: () => base44.entities.DesignAsset.filter({ client_id: project?.client_id }),
    enabled: !!project?.client_id && open,
  });

  if (!project) return null;

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{project.project_name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Client: {project.client_id}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="assets">Client Assets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold">{project.status}</p>
                </CardContent>
              </Card>
              {project.due_date && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-semibold">{new Date(project.due_date).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {project.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </CardContent>
              </Card>
            )}

            {project.scope_description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Project Scope
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{project.scope_description}</p>
                </CardContent>
              </Card>
            )}

            {project.deliverable_url && (
              <Card>
                <CardContent className="pt-4">
                  <a
                    href={project.deliverable_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Deliverable
                  </a>
                </CardContent>
              </Card>
            )}

            {project.feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Client Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{project.feedback}</p>
                </CardContent>
              </Card>
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
            {assets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm">No brand assets uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Logos */}
                {assets.filter(a => a.asset_type === "logo").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Logos
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {assets.filter(a => a.asset_type === "logo").map((asset) => (
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

                {/* Colors */}
                {assets.filter(a => a.asset_type === "color").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Brand Colors
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {assets.filter(a => a.asset_type === "color").map((asset) => (
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

                {/* Fonts */}
                {assets.filter(a => a.asset_type === "font").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Fonts
                    </h4>
                    <div className="space-y-2">
                      {assets.filter(a => a.asset_type === "font").map((asset) => (
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

                {/* Images & Icons */}
                {assets.filter(a => ["image", "icon"].includes(a.asset_type)).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Images & Icons
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {assets.filter(a => ["image", "icon"].includes(a.asset_type)).map((asset) => (
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
      </DialogContent>
    </Dialog>
  );
}