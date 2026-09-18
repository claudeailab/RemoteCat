"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, CloudDownload, Search } from "lucide-react";
import { pageWrapper, pageInner, pageTitle, muted } from "@/lib/ui-conventions";

interface User { id: number; email: string; displayName: string | null; role: string; source: string; groupId: number | null }
interface Group { id: number; name: string }
interface AzureDirectoryUser {
  oid: string;
  email: string;
  displayName: string | null;
  inPlatform: boolean;
  userId: number | null;
  groupId: number | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ id: 0, email: "", displayName: "", password: "", role: "user", groupId: "" });
  const [saving, setSaving] = useState(false);

  // Azure browse state
  const [azureDialogOpen, setAzureDialogOpen] = useState(false);
  const [azureLoading, setAzureLoading] = useState(false);
  const [azureUsers, setAzureUsers] = useState<AzureDirectoryUser[]>([]);
  const [azureFilter, setAzureFilter] = useState("");
  const [azureSelected, setAzureSelected] = useState<Set<string>>(new Set());
  const [azureGroupId, setAzureGroupId] = useState("");
  const [azureAdding, setAzureAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ur, gr] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/groups")]);
      const [ud, gd] = await Promise.all([ur.json(), gr.json()]);
      setUsers(ud.users ?? []);
      setGroups(gd.groups ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm({ id: 0, email: "", displayName: "", password: "", role: "user", groupId: "" }); setDialogOpen(true); }
  function openEdit(u: User) {
    setForm({ id: u.id, email: u.email, displayName: u.displayName ?? "", password: "", role: u.role, groupId: u.groupId?.toString() ?? "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        email: form.email, displayName: form.displayName || undefined,
        ...(form.password ? { password: form.password } : {}),
        role: form.role,
        groupId: form.groupId ? Number(form.groupId) : null,
      };
      const r = await fetch("/api/admin/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success(form.id ? "User updated" : "User created");
      setDialogOpen(false);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const r = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (!r.ok) { toast.error("Delete failed"); return; }
    toast.success("User deleted");
    setDeleteId(null);
    load();
  }

  async function browseAzure() {
    setAzureDialogOpen(true);
    setAzureLoading(true);
    setAzureSelected(new Set());
    setAzureFilter("");
    try {
      const r = await fetch("/api/admin/users/azure-users");
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Failed to fetch Azure users"); setAzureDialogOpen(false); return; }
      setAzureUsers(d.users ?? []);
    } finally { setAzureLoading(false); }
  }

  async function addAzureUsers() {
    const toAdd = azureUsers.filter(u => azureSelected.has(u.oid) && !u.inPlatform);
    if (toAdd.length === 0) return;
    setAzureAdding(true);
    try {
      const r = await fetch("/api/admin/users/azure-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: toAdd.map(u => ({
            oid: u.oid, email: u.email, displayName: u.displayName,
            groupId: azureGroupId ? Number(azureGroupId) : null,
          })),
        }),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Failed to add users"); return; }
      toast.success(`Added ${d.count} user${d.count !== 1 ? "s" : ""} to the platform`);
      setAzureDialogOpen(false);
      load();
    } finally { setAzureAdding(false); }
  }

  const filteredAzure = azureUsers.filter(u =>
    !u.inPlatform && (
      u.email.toLowerCase().includes(azureFilter.toLowerCase()) ||
      (u.displayName ?? "").toLowerCase().includes(azureFilter.toLowerCase())
    )
  );

  const platformAzureUsers = users.filter(u => u.source === "azure");
  const localUsers = users.filter(u => u.source === "local");

  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <h1 className={pageTitle}>Users</h1>
        <Tabs defaultValue="local" className="mt-6">
          <TabsList>
            <TabsTrigger value="local">Local Users</TabsTrigger>
            <TabsTrigger value="azure">Azure AD</TabsTrigger>
          </TabsList>

          <TabsContent value="local">
            <div className="flex justify-end mb-4">
              <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Add User</Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : localUsers.length === 0 ? (
              <p className={`text-center py-12 ${muted}`}>No local users yet.</p>
            ) : (
              <div className="space-y-2">
                {localUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">{u.displayName ?? u.email}</p>
                      <p className={muted}>{u.email}</p>
                      {u.groupId && groups.find(g => g.id === u.groupId) && (
                        <p className="text-xs text-primary mt-0.5">{groups.find(g => g.id === u.groupId)?.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="azure">
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={browseAzure} size="sm">
                <CloudDownload className="h-4 w-4 mr-1.5" />Browse Azure AD
              </Button>
            </div>

            {platformAzureUsers.length === 0 ? (
              <p className={`text-center py-12 ${muted}`}>No Azure AD users on the platform yet.</p>
            ) : (
              <div className="space-y-2">
                {platformAzureUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">{u.displayName ?? u.email}</p>
                      <p className={muted}>{u.email}</p>
                      {u.groupId && groups.find(g => g.id === u.groupId) && (
                        <p className="text-xs text-primary mt-0.5">{groups.find(g => g.id === u.groupId)?.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sky-600 border-sky-300 dark:text-sky-400 dark:border-sky-700">Azure</Badge>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Local user create/edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Display Name</Label>
                <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{form.id ? "New Password (leave blank to keep)" : "Password"}</Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Group</Label>
                  <Select value={form.groupId || "none"} onValueChange={v => setForm(f => ({ ...f, groupId: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="No group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group</SelectItem>
                      {groups.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Azure browse dialog */}
        <Dialog open={azureDialogOpen} onOpenChange={setAzureDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add from Azure AD</DialogTitle></DialogHeader>
            {azureLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Assign to Group</Label>
                  <Select value={azureGroupId || "none"} onValueChange={v => setAzureGroupId(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="No group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group</SelectItem>
                      {groups.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-8"
                    placeholder="Filter by name or email…"
                    value={azureFilter}
                    onChange={e => setAzureFilter(e.target.value)}
                  />
                </div>

                {filteredAzure.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {azureUsers.filter(u => !u.inPlatform).length === 0
                      ? "All Azure AD users are already on the platform."
                      : "No users match your filter."}
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
                    <div className="flex justify-between text-xs text-muted-foreground px-1 pb-1">
                      <span>{filteredAzure.length} user{filteredAzure.length !== 1 ? "s" : ""}</span>
                      <button
                        type="button"
                        className="hover:text-foreground transition-colors"
                        onClick={() => setAzureSelected(new Set(filteredAzure.map(u => u.oid)))}
                      >
                        Select all
                      </button>
                    </div>
                    {filteredAzure.map(u => (
                      <label key={u.oid} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={azureSelected.has(u.oid)}
                          onChange={() => {
                            const next = new Set(azureSelected);
                            next.has(u.oid) ? next.delete(u.oid) : next.add(u.oid);
                            setAzureSelected(next);
                          }}
                          className="h-4 w-4 rounded accent-primary shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.displayName ?? u.email}</p>
                          {u.displayName && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAzureDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={addAzureUsers}
                disabled={azureAdding || azureLoading || azureSelected.size === 0}
              >
                {azureAdding
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Adding…</>
                  : `Add ${azureSelected.size > 0 ? azureSelected.size : ""} Selected`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Remove User</DialogTitle></DialogHeader>
            <p className="text-sm">Are you sure? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
