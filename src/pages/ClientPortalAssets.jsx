import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CLIENT_PORTAL_NAVIGATION } from "@/lib/clientPortalNavigation";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image as ImageIcon, Palette, Type, Link as LinkIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ClientNotificationPanel from "@/components/client/ClientNotificationPanel";
import { toast } from "sonner";

const ASSET_TYPES = [
  { value: "logo", label: "Logo", icon: ImageIcon },
  { value: "color", label: "Brand Color", icon: Palette },
  { value: "font", label: "Font", icon: Type },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "icon", label: "Icon", icon: LinkIcon },
];

export default function ClientPortalAssets() {
  const [currentClient, setCurrentClient] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [assetNotes, setAssetNotes] = useState("");
  const [selectedType, setSelectedType] = useState("logo");
  const queryClient = useQueryClient();

  useEffect(() => {
    async function loadUser() {
      const user = await base44.auth.me();
      const clients = await base44.entities.Client.list();
      const client = clients.find((c) => c.user_email?.toLowerCase() === user.email?.toLowerCase());
      setCurrentClient(client || null);
    }
    loadUser();
  }, []);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["design-assets", currentClient?.id],
    queryFn: () => base44.entities.DesignAsset.list(),
    enabled: !!currentClient,
  });

  const clientAssets = assets?.filter((a) => a.client_id === currentClient?.id) || [];

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.DesignAsset.create({
        client_id: currentClient.id,
        asset_type: selectedType,
        asset_name: file.name,
        asset_value: file_url,
        description: assetNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-assets"] });
      setUploadingFiles([]);
      setAssetNotes("");
      toast.success("Asset uploaded successfully");
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      toast.error("Failed to upload asset");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DesignAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-assets"] });
      toast.success("Asset deleted");
    },
  });

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !currentClient) return;

    setUploadingFiles(files);
    
    // Upload files one by one
    for (const file of files) {
      uploadMutation.mutate(file);
    }
  };

  if (!currentClient) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const logos = clientAssets.filter(a => a.asset_type === "logo");
  const colors = clientAssets.filter(a => a.asset_type === "color");
  const fonts = clientAssets.filter(a => a.asset_type === "font");
  const images = clientAssets.filter(a => ["image", "icon"].includes(a.asset_type));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={CLIENT_PORTAL_NAVIGATION} isClientPortal />
      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <PageHeader
              title="Brand Assets"
              description="Upload and manage your logos, colors, fonts, and other brand files"
              className="flex-1"
            />
            <ClientNotificationPanel />
          </div>

          {/* Upload Section */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Upload New Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Asset Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {ASSET_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setSelectedType(type.value)}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
                            selectedType === type.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-muted-foreground hover:border-primary"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="e.g., Primary logo for website header"
                    value={assetNotes}
                    onChange={(e) => setAssetNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Files</Label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload {selectedType} files
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Supports: PNG, JPG, SVG, PDF, TTF, OTF, WOFF
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.ttf,.otf,.woff"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
                {uploadingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded text-sm">
                        <span className="max-w-[150px] truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {uploadingFiles.indexOf(f) === 0 && uploadMutation.isPending ? "Uploading..." : "Queued"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Asset Gallery */}
          <div className="space-y-6">
            {/* Logos */}
            {logos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Logos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {logos.map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center p-4">
                        {asset.asset_value?.startsWith("http") ? (
                          <img src={asset.asset_value} alt={asset.asset_name} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <LinkIcon className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-xs">{asset.asset_value}</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{asset.asset_name}</p>
                            {asset.description && <p className="text-xs text-muted-foreground truncate">{asset.description}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(asset.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Brand Colors
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {colors.map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div 
                        className="aspect-square"
                        style={{ backgroundColor: asset.asset_value }}
                      />
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{asset.asset_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{asset.asset_value}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(asset.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Fonts */}
            {fonts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  Typography
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fonts.map((asset) => (
                    <Card key={asset.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{asset.asset_name}</p>
                            <p className="text-xs text-muted-foreground">{asset.asset_value}</p>
                            {asset.description && <p className="text-xs text-muted-foreground mt-1 italic">{asset.description}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(asset.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Images & Icons */}
            {images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Images & Icons
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted flex items-center justify-center p-2">
                        {asset.asset_value?.startsWith("http") ? (
                          <img src={asset.asset_value} alt={asset.asset_name} className="max-h-full max-w-full object-cover rounded" />
                        ) : (
                          <LinkIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-2">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{asset.asset_name}</p>
                            <Badge variant="outline" className="text-xs mt-1">{asset.asset_type}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(asset.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {clientAssets.length === 0 && (
              <Card className="p-12 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No brand assets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your logos, brand colors, fonts, and other design files to help us build your website.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}