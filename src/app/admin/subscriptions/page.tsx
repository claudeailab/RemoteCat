"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { pageWrapper, pageInner, pageTitle, muted } from "@/lib/ui-conventions";

interface Plan { id: number; name: string; monthlyPrice: number; yearlyPrice: number; features: string; active: boolean }

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ id: 0, name: "", monthlyPrice: "", yearlyPrice: "", features: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/subscriptions");
      const d = await r.json();
      setPlans(d.plans ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm({ id: 0, name: "", monthlyPrice: "", yearlyPrice: "", features: "" }); setDialogOpen(true); }
  function openEdit(p: Plan) { setForm({ id: p.id, name: p.name, monthlyPrice: String(p.monthlyPrice), yearlyPrice: String(p.yearlyPrice), features: p.features }); setDialogOpen(true); }

  async function handleSave() {
    setSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const r = await fetch("/api/admin/subscriptions", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, monthlyPrice: Number(form.monthlyPrice), yearlyPrice: Number(form.yearlyPrice) }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success(form.id ? "Plan updated" : "Plan created");
      setDialogOpen(false);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const r = await fetch(`/api/admin/subscriptions?id=${id}`, { method: "DELETE" });
    if (!r.ok) { toast.error("Delete failed"); return; }
    toast.success("Plan deleted");
    setDeleteId(null);
    load();
  }

  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <div className="flex items-center justify-between mb-6">
          <h1 className={pageTitle}>Subscriptions</h1>
          <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> New Plan</Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : plans.length === 0 ? (
          <p className={`text-center py-12 ${muted}`}>No plans yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map(p => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">${(p.monthlyPrice / 100).toFixed(2)}/mo · ${(p.yearlyPrice / 100).toFixed(2)}/yr</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit Plan" : "New Plan"}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5"><Label>Monthly Price (cents)</Label><Input type="number" value={form.monthlyPrice} onChange={e => setForm(f => ({ ...f, monthlyPrice: e.target.value }))} /></div>
                <div className="flex flex-col gap-1.5"><Label>Yearly Price (cents)</Label><Input type="number" value={form.yearlyPrice} onChange={e => setForm(f => ({ ...f, yearlyPrice: e.target.value }))} /></div>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Features (JSON array)</Label><Input value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder='["feature1","feature2"]' /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Plan</DialogTitle></DialogHeader>
            <p className="text-sm">This will permanently delete the plan.</p>
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
