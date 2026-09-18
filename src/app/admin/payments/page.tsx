"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { pageWrapper, pageInner, pageTitle, fieldGap } from "@/lib/ui-conventions";

export default function PaymentsPage() {
  const [form, setForm] = useState({ publishableKey: "", secretKey: "", webhookSecret: "", liveMode: false });
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const savedLiveMode = useRef(false);

  useEffect(() => {
    fetch("/api/admin/settings/payments").then(r => r.json()).then(d => {
      if (d.data) {
        const liveMode = d.data.liveMode ?? false;
        savedLiveMode.current = liveMode;
        setForm(f => ({ ...f, liveMode }));
      }
    });
  }, []);

  const dirty =
    form.publishableKey !== "" ||
    form.secretKey !== "" ||
    form.webhookSecret !== "" ||
    form.liveMode !== savedLiveMode.current;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success("Stripe settings saved");
      savedLiveMode.current = form.liveMode;
      setForm(f => ({ ...f, publishableKey: "", secretKey: "", webhookSecret: "" }));
    } finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const r = await fetch("/api/admin/settings/payments/test", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Test failed"); return; }
      toast.success("Stripe connection OK");
    } finally { setTesting(false); }
  }

  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <h1 className={pageTitle}>Payment Settings</h1>
        <Card className="mt-6">
          <CardHeader><CardTitle>Stripe Configuration</CardTitle><CardDescription>Configure Stripe for payments and subscriptions.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className={fieldGap}>
              <div className="flex items-center gap-2">
                <Switch checked={form.liveMode} onCheckedChange={v => setForm(f => ({ ...f, liveMode: v }))} />
                <Label>{form.liveMode ? "Live Mode" : "Test Mode"}</Label>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Publishable Key</Label>
                <Input value={form.publishableKey} onChange={e => setForm(f => ({ ...f, publishableKey: e.target.value }))} placeholder="pk_test_..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Secret Key</Label>
                <div className="relative">
                  <Input type={showSecret ? "text" : "password"} value={form.secretKey} onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))} placeholder="sk_test_..." className="pr-10" />
                  <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowSecret(v => !v)}>
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Webhook Secret</Label>
                <div className="relative">
                  <Input type={showWebhook ? "text" : "password"} value={form.webhookSecret} onChange={e => setForm(f => ({ ...f, webhookSecret: e.target.value }))} placeholder="whsec_..." className="pr-10" />
                  <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowWebhook(v => !v)}>
                    {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={!dirty || saving} className="w-full sm:w-auto">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving…</> : "Save"}
                </Button>
                <Button type="button" variant="outline" disabled={testing} onClick={handleTest} className="w-full sm:w-auto">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Connection"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
