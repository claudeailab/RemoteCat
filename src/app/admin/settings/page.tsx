"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { pageWrapper, pageInner, pageTitle } from "@/lib/ui-conventions";

type Theme = "system" | "light" | "dark";

function ThemeButton({ value, current, label, onClick }: { value: Theme; current: Theme; label: string; onClick: (v: Theme) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${current === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
    >
      <div className={`h-10 w-16 rounded-md ${value === "light" ? "bg-white border border-border" : value === "dark" ? "bg-[hsl(224_14%_17%)]" : "bg-gradient-to-br from-white to-[hsl(224_14%_17%)]"}`} />
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
    } finally {
      setLoading(false);
    }
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

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("system");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = document.cookie.match(/remotecat-theme=([^;]+)/)?.[1] as Theme | undefined;
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <h1 className={pageTitle}>Settings</h1>
        <Tabs defaultValue="visual" className="mt-6">
          <TabsList>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>
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
          <TabsContent value="audit">
            <Card>
              <CardContent className="pt-6">
                <AuditTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
