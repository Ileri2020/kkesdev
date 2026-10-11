import { AIProviderSettings } from "@/components/admin/ai-provider-settings";
import { PortalRoute } from "@/components/portal-route";

export default function AdminAISettingsPage() {
  return (
    <PortalRoute portal="admin" section="AI Provider Keys">
      <section className="space-y-6">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Administrator settings</p><h1 className="mt-2 text-3xl font-bold">AI provider keys</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Configure the provider used by the student AI assistant and question explanations.</p></div>
        <AIProviderSettings />
      </section>
    </PortalRoute>
  );
}
