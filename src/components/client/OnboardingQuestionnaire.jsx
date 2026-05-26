import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const SELECT_OPTIONS = {
  primary_goal: ["Get more leads", "Increase online sales", "Build brand awareness", "Improve online reputation", "Other"],
  timeline: ["ASAP", "Within 1 month", "1-3 months", "3-6 months", "Flexible"],
  budget_range: ["Under $500/mo", "$500-$1,000/mo", "$1,000-$2,500/mo", "$2,500+/mo", "Not sure yet"],
  design_style: ["Modern & minimal", "Bold & colorful", "Professional & corporate", "Warm & friendly", "Other"],
};

export default function OnboardingQuestionnaire({ clientId, existingResponse, onComplete }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    website_url: existingResponse?.website_url || "",
    target_audience: existingResponse?.target_audience || "",
    main_services: existingResponse?.main_services || "",
    unique_value: existingResponse?.unique_value || "",
    primary_goal: existingResponse?.primary_goal || "",
    primary_goal_other: existingResponse?.primary_goal_other || "",
    timeline: existingResponse?.timeline || "",
    budget_range: existingResponse?.budget_range || 50,
    competitor_names: existingResponse?.competitor_names || "",
    design_style: existingResponse?.design_style || "",
    social_media_handles: existingResponse?.social_media_handles || "",
    additional_notes: existingResponse?.additional_notes || "",
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { client_id: clientId, ...form, budget_range: Number(form.budget_range) };
      if (existingResponse?.id) {
        await base44.entities.OnboardingQuestionnaire.update(existingResponse.id, data);
      } else {
        await base44.entities.OnboardingQuestionnaire.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-questionnaire"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onComplete();
    },
    onError: (err) => {
      console.error("Questionnaire save failed:", err);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mutation.isPending) mutation.mutate();
  };

  const SelectField = ({ label, fieldKey, options }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => set(fieldKey, opt)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              form[fieldKey] === opt
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-foreground hover:border-primary"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-3 ml-8 p-4 border rounded-lg bg-background">
      <p className="text-sm text-muted-foreground">Please fill out this questionnaire so we can get started on the right foot.</p>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Current website URL (if any)</Label>
        <Input placeholder="https://yourbusiness.com" value={form.website_url} onChange={(e) => set("website_url", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">What products or services do you offer?</Label>
        <Textarea placeholder="Describe your main offerings..." value={form.main_services} onChange={(e) => set("main_services", e.target.value)} className="h-20 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Who is your ideal customer?</Label>
        <Textarea placeholder="Describe your target audience..." value={form.target_audience} onChange={(e) => set("target_audience", e.target.value)} className="h-20 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">What makes you different from competitors?</Label>
        <Textarea placeholder="Your unique value proposition..." value={form.unique_value} onChange={(e) => set("unique_value", e.target.value)} className="h-20 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Top competitors (names or URLs)</Label>
        <Input placeholder="e.g. Acme Plumbing, bestplumbers.com" value={form.competitor_names} onChange={(e) => set("competitor_names", e.target.value)} />
      </div>

      <SelectField label="Primary goal for this project" fieldKey="primary_goal" options={SELECT_OPTIONS.primary_goal} />
      {form.primary_goal === "Other" && (
        <div className="space-y-1.5">
          <Input placeholder="Describe your goal" value={form.primary_goal_other} onChange={(e) => set("primary_goal_other", e.target.value)} />
        </div>
      )}

      <SelectField label="Desired timeline" fieldKey="timeline" options={SELECT_OPTIONS.timeline} />
      
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Monthly budget range</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[Number(form.budget_range) || 50]}
            onValueChange={(value) => set("budget_range", value[0])}
            min={50}
            max={500}
            step={50}
            className="flex-1"
          />
          <span className="text-sm font-semibold min-w-fit">${Number(form.budget_range) || 50}{Number(form.budget_range) >= 500 ? "+" : ""}/mo</span>
        </div>
      </div>

      <SelectField label="Preferred design style" fieldKey="design_style" options={SELECT_OPTIONS.design_style} />

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Social media handles</Label>
        <Input placeholder="@yourbusiness on Instagram, Facebook, etc." value={form.social_media_handles} onChange={(e) => set("social_media_handles", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Anything else we should know?</Label>
        <Textarea placeholder="Additional notes, special requests..." value={form.additional_notes} onChange={(e) => set("additional_notes", e.target.value)} className="h-20 text-sm" />
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Submit Questionnaire"}
      </Button>
    </form>
  );
}