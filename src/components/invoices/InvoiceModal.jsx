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
  invoice_number: "",
  amount: "",
  invoice_type: "other",
  status: "Pending",
  due_date: "",
  description: "",
  file_url: "",
};

export default function InvoiceModal({ open, onClose, clients, invoice = null }) {
  const qc = useQueryClient();
  const isEdit = !!invoice;
  const [form, setForm] = useState(invoice || EMPTY);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(invoice?.file_url ? "Existing file" : "");

  useEffect(() => {
    if (invoice) {
      setForm(invoice);
      setUploadedFileName(invoice.file_url ? "Existing file" : "");
    } else {
      setForm(EMPTY);
      setUploadedFileName("");
    }
  }, [invoice, open]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("file_url", file_url);
    setUploadedFileName(file.name);
    setUploading(false);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (isEdit) {
        await base44.entities.Invoice.update(invoice.id, data);
      } else {
        await base44.entities.Invoice.create(data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
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
              <Label>Invoice #</Label>
              <Input value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)} placeholder="INV-001" />
            </div>
            <div>
              <Label>Amount ($) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.invoice_type} onValueChange={(v) => set("invoice_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="retainer">Retainer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Due Date</Label>
            <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </div>

          <div>
            <Label>Description / Line Items</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe services included..." className="h-20" />
          </div>

          {/* File Upload */}
          <div>
            <Label>Attach Invoice File (PDF, image, etc.)</Label>
            {form.file_url ? (
              <div className="mt-1 flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm flex-1 truncate">{uploadedFileName}</span>
                <a href={form.file_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </a>
                <button type="button" onClick={() => { set("file_url", ""); setUploadedFileName(""); }}>
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
                    <span className="text-xs text-muted-foreground">Click to upload PDF or image</span>
                  </>
                )}
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.client_id || !form.amount || mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}