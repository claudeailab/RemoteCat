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
import { Loader2, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { pageWrapper, pageInner, pageTitle, muted } from "@/lib/ui-conventions";

interface User { id: number; email: string; displayName: string | null; role: string; source: string }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ id: 0, email: "", displayName: "", password: "", role: "user" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users");
      const d = await r.json();
      setUsers(d.users ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm({ id: 0, email: "", displayName: "", password: "", role: "user" }); setDialogOpen(true); }
  function openEdit(u: User) { setForm({ id: u.id, email: u.email, displayName: u.displayName ?? "", password: "", role: u.role }); setDialogOpen(true); }

  async function handleSave() {
    setSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const r = await fetch("/api/admin/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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

  async function syncAzure() {
    setSyncing(true);
    try {
      const r = await fetch("/api/admin/users/sync-azure", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Sync failed"); return; }
      toast.success(`Synced ${d.count} users`);
      load();
    } finally { setSyncing(false); }
  }

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
            ) : users.filter(u => u.source === "local").length === 0 ? (
              <p className={`text-center py-12 ${muted}`}>No local users yet.</p>
            ) : (
              <div className="space-y-2">
                {users.filter(u => u.source === "local").map(u => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">{u.displayName ?? u.email}</p>
                      <p className={muted}>{u.email}</p>
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
              <Button variant="outline" onClick={syncAzure} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Sync Users
              </Button>
            </div>
            {users.filter(u => u.source === "azure").length === 0 ? (
              <p className={`text-center py-12 ${muted}`}>No Azure AD users synced yet.</p>
            ) : (
              <div className="space-y-2">
                {users.filter(u => u.source === "azure").map(u => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">{u.displayName ?? u.email}</p>
                      <p className={muted}>{u.email}</p>
                    </div>
                    <Badge variant="secondary">azure</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
            <p className="text-sm">Are you sure? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
