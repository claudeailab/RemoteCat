"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { pageWrapper, pageInner, pageTitle, fieldGap } from "@/lib/ui-conventions";

function SecretInput({ value, onChange, placeholder, isSet, setLabel }: {
  value: string; onChange: (v: string) => void; placeholder: string; isSet: boolean; setLabel: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShow(v => !v)}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {isSet && value === "" && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{setLabel}
        </p>
      )}
    </div>
  );
}

function StripeTab() {
  const [form, setForm] = useState({ publishableKey: "", secretKey: "", webhookSecret: "", liveMode: false });
  const [secretKeySet, setSecretKeySet] = useState(false);
  const [webhookSecretSet, setWebhookSecretSet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const savedPublishableKey = useRef("");
  const savedLiveMode = useRef(false);

  useEffect(() => {
    fetch("/api/admin/settings/payments").then(r => r.json()).then(d => {
      if (d.data) {
        const { liveMode, publishableKey, secretKeySet: sks, webhookSecretSet: whs } = d.data;
        savedLiveMode.current = liveMode ?? false;
        savedPublishableKey.current = publishableKey ?? "";
        setForm(f => ({ ...f, liveMode: liveMode ?? false, publishableKey: publishableKey ?? "" }));
        setSecretKeySet(!!sks);
        setWebhookSecretSet(!!whs);
      }
    });
  }, []);

  const dirty =
    form.publishableKey !== savedPublishableKey.current ||
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
      savedPublishableKey.current = form.publishableKey;
      if (form.secretKey) setSecretKeySet(true);
      if (form.webhookSecret) setWebhookSecretSet(true);
      setForm(f => ({ ...f, secretKey: "", webhookSecret: "" }));
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
    <Card>
      <CardHeader>
        <CardTitle>Stripe</CardTitle>
        <CardDescription>Configure Stripe for payments and subscriptions.</CardDescription>
      </CardHeader>
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
            <SecretInput value={form.secretKey} onChange={v => setForm(f => ({ ...f, secretKey: v }))} placeholder="sk_test_..." isSet={secretKeySet} setLabel="Key saved — enter a new one to replace it" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Webhook Secret</Label>
            <SecretInput value={form.webhookSecret} onChange={v => setForm(f => ({ ...f, webhookSecret: v }))} placeholder="whsec_..." isSet={webhookSecretSet} setLabel="Secret saved — enter a new one to replace it" />
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
  );
}

function VivaWalletTab() {
  const [form, setForm] = useState({ clientId: "", clientSecret: "", merchantId: "", liveMode: false });
  const [clientSecretSet, setClientSecretSet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const savedClientId = useRef("");
  const savedMerchantId = useRef("");
  const savedLiveMode = useRef(false);

  useEffect(() => {
    fetch("/api/admin/settings/payments/vivawallet").then(r => r.json()).then(d => {
      if (d.data) {
        const { liveMode, clientId, clientSecretSet: css, merchantId } = d.data;
        savedLiveMode.current = liveMode ?? false;
        savedClientId.current = clientId ?? "";
        savedMerchantId.current = merchantId ?? "";
        setForm(f => ({ ...f, liveMode: liveMode ?? false, clientId: clientId ?? "", merchantId: merchantId ?? "" }));
        setClientSecretSet(!!css);
      }
    });
  }, []);

  const dirty =
    form.clientId !== savedClientId.current ||
    form.clientSecret !== "" ||
    form.merchantId !== savedMerchantId.current ||
    form.liveMode !== savedLiveMode.current;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings/payments/vivawallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success("Viva Wallet settings saved");
      savedLiveMode.current = form.liveMode;
      savedClientId.current = form.clientId;
      savedMerchantId.current = form.merchantId;
      if (form.clientSecret) setClientSecretSet(true);
      setForm(f => ({ ...f, clientSecret: "" }));
    } finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const r = await fetch("/api/admin/settings/payments/vivawallet/test", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Test failed"); return; }
      toast.success("Viva Wallet connection OK");
    } finally { setTesting(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Viva Wallet</CardTitle>
        <CardDescription>Configure Viva Wallet (formerly Viva Payments) for payment processing.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className={fieldGap}>
          <div className="flex items-center gap-2">
            <Switch checked={form.liveMode} onCheckedChange={v => setForm(f => ({ ...f, liveMode: v }))} />
            <Label>{form.liveMode ? "Production" : "Demo Mode"}</Label>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Client ID</Label>
            <Input value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} placeholder="Client ID from Viva Wallet dashboard" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Client Secret</Label>
            <SecretInput value={form.clientSecret} onChange={v => setForm(f => ({ ...f, clientSecret: v }))} placeholder="Client Secret" isSet={clientSecretSet} setLabel="Secret saved — enter a new one to replace it" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Merchant ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.merchantId} onChange={e => setForm(f => ({ ...f, merchantId: e.target.value }))} placeholder="Merchant ID" />
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
  );
}

function PayPalTab() {
  const [form, setForm] = useState({ clientId: "", clientSecret: "", liveMode: false });
  const [clientSecretSet, setClientSecretSet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const savedClientId = useRef("");
  const savedLiveMode = useRef(false);

  useEffect(() => {
    fetch("/api/admin/settings/payments/paypal").then(r => r.json()).then(d => {
      if (d.data) {
        const { liveMode, clientId, clientSecretSet: css } = d.data;
        savedLiveMode.current = liveMode ?? false;
        savedClientId.current = clientId ?? "";
        setForm(f => ({ ...f, liveMode: liveMode ?? false, clientId: clientId ?? "" }));
        setClientSecretSet(!!css);
      }
    });
  }, []);

  const dirty =
    form.clientId !== savedClientId.current ||
    form.clientSecret !== "" ||
    form.liveMode !== savedLiveMode.current;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings/payments/paypal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success("PayPal settings saved");
      savedLiveMode.current = form.liveMode;
      savedClientId.current = form.clientId;
      if (form.clientSecret) setClientSecretSet(true);
      setForm(f => ({ ...f, clientSecret: "" }));
    } finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const r = await fetch("/api/admin/settings/payments/paypal/test", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Test failed"); return; }
      toast.success("PayPal connection OK");
    } finally { setTesting(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PayPal</CardTitle>
        <CardDescription>Configure PayPal for payment processing.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className={fieldGap}>
          <div className="flex items-center gap-2">
            <Switch checked={form.liveMode} onCheckedChange={v => setForm(f => ({ ...f, liveMode: v }))} />
            <Label>{form.liveMode ? "Live" : "Sandbox"}</Label>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Client ID</Label>
            <Input value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} placeholder="Client ID from PayPal Developer Dashboard" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Client Secret</Label>
            <SecretInput value={form.clientSecret} onChange={v => setForm(f => ({ ...f, clientSecret: v }))} placeholder="Client Secret" isSet={clientSecretSet} setLabel="Secret saved — enter a new one to replace it" />
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
  );
}

export default function PaymentsPage() {
  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <h1 className={pageTitle}>Payment Settings</h1>
        <Tabs defaultValue="stripe" className="mt-6">
          <TabsList>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
            <TabsTrigger value="vivawallet">Viva Wallet</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
          </TabsList>
          <TabsContent value="stripe"><StripeTab /></TabsContent>
          <TabsContent value="vivawallet"><VivaWalletTab /></TabsContent>
          <TabsContent value="paypal"><PayPalTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
