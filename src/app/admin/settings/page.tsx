"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { pageWrapper, pageInner, pageTitle } from "@/lib/ui-conventions";
import { PLATFORM_PERMISSIONS } from "@/lib/permissions";
import type { FeatureKey } from "@/lib/features";

const FEATURE_LIST: { key: FeatureKey; label: string; description: string }[] = [
  { key: "payments", label: "Payments", description: "Stripe integration and billing management" },
  { key: "m365", label: "Microsoft 365", description: "Azure AD sync and Microsoft SSO login" },
  { key: "email", label: "Email / SMTP", description: "Transactional email via SMTP" },
  { key: "ai", label: "Artificial Intelligence", description: "Anthropic and OpenAI integrations" },
  { key: "subscriptions", label: "Subscriptions", description: "Subscription plans and management" },
];

type Theme = "system" | "light" | "dark";

function ThemeButton({ value, current, label, onClick }: { value: Theme; current: Theme; label: string; onClick: (v: Theme) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${current === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
    >
      <div className={`h-10 w-16 rounded-md ${value === "light" ? "bg-white border border-border" : value === "dark" ? "bg-[hsl(200_30%_10%)]" : "bg-gradient-to-br from-white to-[hsl(200_30%_10%)]"}`} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

interface AuditLog {
  id: number;
  userEmail: string | null;
  action: string;
  resource: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/audit?page=${p}`);
      const d = await r.json();
      setLogs(d.logs ?? []);
      setPages(d.pages ?? 1);
      setTotal(d.total ?? 0);
      setPage(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{total} total entries</p>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No audit logs yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Time</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">User</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Action</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Resource</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Detail</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{log.userEmail ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap"><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{log.action}</span></td>
                  <td className="px-3 py-2 whitespace-nowrap">{log.resource}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs max-w-xs truncate">{log.detail ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground text-xs">{log.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => load(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function FeaturesTab() {
  const router = useRouter();
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({
    payments: true, m365: true, email: true, ai: true, subscriptions: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<FeatureKey | null>(null);

  useEffect(() => {
    fetch("/api/admin/features").then(r => r.json()).then(d => {
      if (d.features) setFeatures(d.features);
      setLoading(false);
    });
  }, []);

  async function toggle(key: FeatureKey, value: boolean) {
    const prev = features[key];
    setFeatures(f => ({ ...f, [key]: value }));
    setSaving(key);
    try {
      const r = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!r.ok) {
        setFeatures(f => ({ ...f, [key]: prev }));
        toast.error("Failed to update feature");
      } else {
        toast.success(`${value ? "Enabled" : "Disabled"}`);
        router.refresh();
      }
    } finally { setSaving(null); }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">Disabled features are hidden from the navigation menu.</p>
      {FEATURE_LIST.map(({ key, label, description }) => (
        <div key={key} className="flex items-center justify-between rounded-xl border p-4 bg-card transition-colors hover:bg-muted/20">
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {saving === key && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <Switch
              checked={features[key]}
              onCheckedChange={v => toggle(key, v)}
              disabled={saving === key}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  isDefault: boolean;
  userCount: number;
}

const defaultGroupForm = { name: "", description: "", permissions: [] as string[], isDefault: false };

function PermissionsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: 0, ...defaultGroupForm });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/groups");
      const d = await r.json();
      setGroups(d.groups ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm({ id: 0, ...defaultGroupForm }); setDialogOpen(true); }
  function openEdit(g: Group) {
    setForm({ id: g.id, name: g.name, description: g.description ?? "", permissions: g.permissions, isDefault: g.isDefault });
    setDialogOpen(true);
  }

  function togglePerm(key: string) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const url = form.id ? `/api/admin/groups?id=${form.id}` : "/api/admin/groups";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description || undefined, permissions: form.permissions, isDefault: form.isDefault }),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success(form.id ? "Group updated" : "Group created");
      setDialogOpen(false);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const r = await fetch(`/api/admin/groups?id=${id}`, { method: "DELETE" });
    if (!r.ok) { toast.error("Delete failed"); return; }
    toast.success("Group deleted");
    setDeleteId(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Define access groups and assign permissions to control what users can do.</p>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />New Group</Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No groups yet. Create one to start assigning permissions.</p>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.id} className="rounded-xl border p-4 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{g.name}</span>
                    {g.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                    <span className="text-xs text-muted-foreground">{g.userCount} user{g.userCount !== 1 ? "s" : ""}</span>
                  </div>
                  {g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}
                  {g.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {g.permissions.map(p => {
                        const label = PLATFORM_PERMISSIONS.find(x => x.key === p)?.label ?? p;
                        return (
                          <span key={p} className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="h-2.5 w-2.5" />{label}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 italic">No permissions</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(g)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteId(g.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit Group" : "New Group"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Users" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {PLATFORM_PERMISSIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(key)}
                      onChange={() => togglePerm(key)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm">Set as default group for new users</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Group</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Users assigned to this group will be unassigned. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlatformTab() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [original, setOriginal] = useState({ name: "", logoUrl: "" });

  useEffect(() => {
    fetch("/api/platform").then(r => r.json()).then(d => {
      const n = d.name ?? "";
      const l = d.logoUrl ?? "";
      setName(n); setLogoUrl(l);
      setOriginal({ name: n, logoUrl: l });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setDirty(name !== original.name || logoUrl !== original.logoUrl);
  }, [name, logoUrl, original]);

  async function handleSave() {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, logoUrl: logoUrl || undefined }),
      });
      if (!r.ok) { toast.error("Save failed"); return; }
      toast.success("Platform settings saved");
      setOriginal({ name, logoUrl });
      setDirty(false);
      router.refresh();
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const DEFAULT_LOGO = "https://api.iconify.design/solar:layers-bold.svg?color=%230d9488";

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Set the name and logo that appear throughout the platform.</p>
      <div className="flex flex-col gap-1.5">
        <Label>Platform Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Platform" maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Logo URL</Label>
        <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder={DEFAULT_LOGO} />
        <p className="text-xs text-muted-foreground">Used in the sidebar, login page, and as the favicon. Leave blank for the default icon.</p>
      </div>
      {(logoUrl || DEFAULT_LOGO) && (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl || DEFAULT_LOGO} alt="preview" className="h-6 w-6" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <span className="text-sm text-muted-foreground">Logo preview</span>
        </div>
      )}
      <Button onClick={handleSave} disabled={saving || !dirty}>
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving…</> : "Save"}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("system");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = document.cookie.match(/webapp-theme=([^;]+)/)?.[1] as Theme | undefined;
    if (stored === "light" || stored === "dark" || stored === "system") setTheme(stored);
  }, []);

  async function applyTheme(t: Theme) {
    setTheme(t);
    setSaving(true);
    try {
      await fetch("/api/admin/settings/theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: t }) });
      const html = document.documentElement;
      if (t === "system") {
        html.removeAttribute("data-theme");
      } else {
        html.setAttribute("data-theme", t);
      }
    } finally { setSaving(false); }
  }

  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <h1 className={pageTitle}>Settings</h1>
        <Tabs defaultValue="platform" className="mt-6">
          <TabsList>
            <TabsTrigger value="platform">Platform</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="platform">
            <Card><CardContent className="pt-6"><PlatformTab /></CardContent></Card>
          </TabsContent>
          <TabsContent value="visual">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3">Theme</p>
                  <div className="flex flex-wrap gap-3">
                    <ThemeButton value="system" current={theme} label="System" onClick={applyTheme} />
                    <ThemeButton value="light" current={theme} label="Light" onClick={applyTheme} />
                    <ThemeButton value="dark" current={theme} label="Dark" onClick={applyTheme} />
                  </div>
                  {saving && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="features">
            <Card><CardContent className="pt-6"><FeaturesTab /></CardContent></Card>
          </TabsContent>
          <TabsContent value="permissions">
            <Card><CardContent className="pt-6"><PermissionsTab /></CardContent></Card>
          </TabsContent>
          <TabsContent value="audit">
            <Card><CardContent className="pt-6"><AuditTab /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
