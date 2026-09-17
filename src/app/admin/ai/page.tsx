"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { pageWrapper, pageInner, pageTitle, fieldGap } from "@/lib/ui-conventions";

export default function AIPage() {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [anthropicModel, setAnthropicModel] = useState("claude-sonnet-4-6");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o");
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [savingAnthropic, setSavingAnthropic] = useState(false);
  const [savingOpenai, setSavingOpenai] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/ai").then(r => r.json()).then(d => {
      if (d.anthropicModel) setAnthropicModel(d.anthropicModel);
      if (d.openaiModel) setOpenaiModel(d.openaiModel);
    });
  }, []);

  async function saveAnthropic() {
    setSavingAnthropic(true);
    try {
      const r = await fetch("/api/admin/settings/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "anthropic", apiKey: anthropicKey, model: anthropicModel }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success("Anthropic settings saved");
      setAnthropicKey("");
    } finally { setSavingAnthropic(false); }
  }

  async function testAnthropic() {
    setTestingAnthropic(true);
    try {
      const r = await fetch("/api/admin/settings/ai/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "anthropic" }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Test failed"); return; }
      toast.success("Anthropic connection OK");
    } finally { setTestingAnthropic(false); }
  }

  async function saveOpenai() {
    setSavingOpenai(true);
    try {
      const r = await fetch("/api/admin/settings/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "openai", apiKey: openaiKey, model: openaiModel }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Save failed"); return; }
      toast.success("OpenAI settings saved");
      setOpenaiKey("");
    } finally { setSavingOpenai(false); }
  }

  async function testOpenai() {
    setTestingOpenai(true);
    try {
      const r = await fetch("/api/admin/settings/ai/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "openai" }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Test failed"); return; }
      toast.success("OpenAI connection OK");
    } finally { setTestingOpenai(false); }
  }

  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <h1 className={pageTitle}>AI Settings</h1>
        <Tabs defaultValue="anthropic" className="mt-6">
          <TabsList>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
          </TabsList>
          <TabsContent value="anthropic">
            <Card>
              <CardHeader><CardTitle>Anthropic</CardTitle></CardHeader>
              <CardContent className={fieldGap}>
                <div className="flex flex-col gap-1.5">
                  <Label>API Key</Label>
                  <div className="relative">
                    <Input type={showAnthropicKey ? "text" : "password"} value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." className="pr-10" />
                    <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowAnthropicKey(v => !v)}>
                      {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Model</Label>
                  <Select value={anthropicModel} onValueChange={setAnthropicModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-sonnet-4-6">claude-sonnet-4-6</SelectItem>
                      <SelectItem value="claude-opus-5">claude-opus-5</SelectItem>
                      <SelectItem value="claude-haiku-4-5-20251001">claude-haiku-4-5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={saveAnthropic} disabled={savingAnthropic} className="w-full sm:w-auto">
                    {savingAnthropic ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button variant="outline" onClick={testAnthropic} disabled={testingAnthropic} className="w-full sm:w-auto">
                    {testingAnthropic ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="openai">
            <Card>
              <CardHeader><CardTitle>OpenAI</CardTitle></CardHeader>
              <CardContent className={fieldGap}>
                <div className="flex flex-col gap-1.5">
                  <Label>API Key</Label>
                  <div className="relative">
                    <Input type={showOpenaiKey ? "text" : "password"} value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-..." className="pr-10" />
                    <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowOpenaiKey(v => !v)}>
                      {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Model</Label>
                  <Select value={openaiModel} onValueChange={setOpenaiModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                      <SelectItem value="o3">o3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={saveOpenai} disabled={savingOpenai} className="w-full sm:w-auto">
                    {savingOpenai ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button variant="outline" onClick={testOpenai} disabled={testingOpenai} className="w-full sm:w-auto">
                    {testingOpenai ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
