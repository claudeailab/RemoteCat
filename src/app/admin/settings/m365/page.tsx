"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { pageWrapper, pageInner, pageTitle, fieldGap } from "@/lib/ui-conventions";

export default function M365Page() {
  const [form, setForm] = useState({ clientId: "", clientSecret: "", tenantId: "", expiryDate: "", reminderDays: "30" });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/m365").then(r => r.json()).then(d => { if (d.data) setForm(f => ({ ...f, ...d.data })); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings/m365", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success("M365 settings saved");
    } finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const r = await fetch("/api/admin/settings/m365/test", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Test failed"); return; }
      toast.success("M365 connection successful");
    } finally { setTesting(false); }
  }

  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <div className="flex items-center justify-between mb-6">
          <h1 className={pageTitle}>M365 Settings</h1>
          <Dialog>
            <DialogTrigger asChild><Button variant="outline" size="sm">Setup Guide</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Azure App Registration</DialogTitle></DialogHeader>
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li>Go to <strong>Azure Portal → App registrations → New registration</strong>. Set the name and choose your tenant type.</li>
                <li>Under <strong>Certificates &amp; secrets</strong>, create a new client secret. Copy the value immediately — it won&apos;t be shown again.</li>
                <li>Under <strong>API permissions</strong>, add <code>User.Read.All</code> (application permission) and grant admin consent.</li>
              </ol>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader><CardTitle>Azure AD Configuration</CardTitle><CardDescription>Connect RemoteCat to your Microsoft 365 tenant.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className={fieldGap}>
              <div className="flex flex-col gap-1.5">
                <Label>Client ID</Label>
                <Input value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Client Secret</Label>
                <div className="relative">
                  <Input type={showSecret ? "text" : "password"} value={form.clientSecret} onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))} className="pr-10" />
                  <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowSecret(v => !v)}>
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tenant ID</Label>
                <Input value={form.tenantId} onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Secret Expiry Date</Label>
                  <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Reminder Days Before</Label>
                  <Input type="number" value={form.reminderDays} onChange={e => setForm(f => ({ ...f, reminderDays: e.target.value }))} min="1" max="365" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
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
