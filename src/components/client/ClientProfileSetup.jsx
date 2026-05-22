import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight } from "lucide-react";

export default function ClientProfileSetup({ currentUser, onCreated }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    business_name: "",
    business_type: "",
    contact_name: currentUser?.full_name || "",
    contact_email: currentUser?.email || "",
    phone: "",
    location: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const client = await base44.entities.Client.create({
        ...form,
        user_email: currentUser.email,
        status: "Lead",
        pipeline_stage: "Onboarding",
      });
      return client;
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onCreated(client);
    },
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const canSubmit = form.business_name.trim() && form.business_type.trim() && form.contact_email.trim();

  return (
    <div className="flex-1 lg:ml-64 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Set Up Your Business Profile</h1>
          <p className="text-muted-foreground text-sm">
            Tell us a bit about your business so we can get started.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input id="business_name" name="business_name" value={form.business_name} onChange={handleChange} placeholder="Acme Co." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="business_type">Business Type *</Label>
                <Input id="business_type" name="business_type" value={form.business_type} onChange={handleChange} placeholder="e.g. Restaurant, Salon" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_name">Your Name</Label>
                <Input id="contact_name" name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input id="contact_email" name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="jane@acme.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">City / Location</Label>
                <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="Austin, TX" />
              </div>
            </div>

            <Button
              className="w-full gap-2 mt-2"
              disabled={!canSubmit || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Creating Profile..." : "Continue to Onboarding"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}