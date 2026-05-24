import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, ExternalLink } from "lucide-react";

const EMPTY = {
  client_id: "",
  monthly_amount: "",
  start_date: "",
  billing_cycle: "monthly",
  status: "Active",
  description: "",
  next_billing_date: "",
  agreement_file_url: "",
};

export default function RetainerModal({ open, onClose, clients, retainer = null }) {
  const qc = useQueryClient();
  const isEdit = !!retainer;
  const [form, setForm] = useState(retainer || EMPTY);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(retainer?.agreement_file_url ? "Existing agreement" : "");

  useEffect(() => {
    if (retainer) {
      setForm(retainer);
      setUploadedFileName(retainer.agreement_file_url ? "Existing agreement" : "");
    } else {
      setForm(EMPTY);
      setUploadedFileName("");
    }
  }, [retainer, open]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("agreement_file_url", file_url);
    setUploadedFileName(file.name);
    setUploading(false);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { ...form, monthly_amount: parseFloat(form.monthly_amount) };
      if (isEdit) {
        await base44.entities.Retainer.update(retainer.id, data);
      } else {
        await base44.entities.Retainer.create(data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["retainers"] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Retainer" : "Create Retainer Agreement"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => set("client_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly Amount ($) *</Label>
              <Input type="number" value={form.monthly_amount} onChange={(e) => set("monthly_amount", e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div>
              <Label>Billing Cycle</Label>
              <Select value={form.billing_cycle} onValueChange={(v) => set("billing_cycle", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Next Billing Date</Label>
            <Input type="date" value={form.next_billing_date} onChange={(e) => set("next_billing_date", e.target.value)} />
          </div>

          <div>
            <Label>Scope / Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g., Monthly hosting, maintenance & SEO..." className="h-20" />
          </div>

          {/* Agreement File Upload */}
          <div>
            <Label>Upload Retainer Agreement (PDF, image, etc.)</Label>
            {form.agreement_file_url ? (
              <div className="mt-1 flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm flex-1 truncate">{uploadedFileName}</span>
                <a href={form.agreement_file_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </a>
                <button type="button" onClick={() => { set("agreement_file_url", ""); setUploadedFileName(""); }}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : (
              <label className="mt-1 flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                {uploading ? (
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Click to upload agreement PDF or image</span>
                  </>
                )}
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.client_id || !form.monthly_amount || mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Retainer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}