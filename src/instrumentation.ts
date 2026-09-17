export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const checks: { name: string; check: () => Promise<void> }[] = [];

  checks.push({
    name: "Database",
    check: async () => {
      const { db } = await import("./lib/db");
      await db.execute("SELECT 1" as unknown as Parameters<typeof db.execute>[0]);
    },
  });

  if (process.env.REMOTE_CAT_SMTP_ENABLED === "true") {
    checks.push({
      name: "SMTP",
      check: async () => {
        const nodemailer = await import("nodemailer");
        const { getSetting } = await import("./lib/encryption");
        const host = await getSetting("smtp_host");
        if (!host) throw new Error("SMTP not configured");
        const t = nodemailer.default.createTransport({ host, port: 587 });
        await t.verify();
      },
    });
  }

  if (process.env.REMOTE_CAT_ANTHROPIC_ENABLED === "true") {
    checks.push({
      name: "Anthropic",
      check: async () => {
        const { getSetting } = await import("./lib/encryption");
        const key = await getSetting("anthropic_apiKey");
        if (!key) throw new Error("Anthropic key not set");
      },
    });
  }

  if (process.env.REMOTE_CAT_OPENAI_ENABLED === "true") {
    checks.push({
      name: "OpenAI",
      check: async () => {
        const { getSetting } = await import("./lib/encryption");
        const key = await getSetting("openai_apiKey");
        if (!key) throw new Error("OpenAI key not set");
      },
    });
  }

  if (process.env.REMOTE_CAT_STRIPE_ENABLED === "true") {
    checks.push({
      name: "Stripe",
      check: async () => {
        const { getSetting } = await import("./lib/encryption");
        const key = await getSetting("stripe_secretKey");
        if (!key) throw new Error("Stripe key not set");
      },
    });
  }

  if (process.env.REMOTE_CAT_M365_ENABLED === "true") {
    checks.push({
      name: "M365",
      check: async () => {
        const { getSetting } = await import("./lib/encryption");
        const clientId = await getSetting("m365_clientId");
        if (!clientId) throw new Error("M365 not configured");
      },
    });
  }

  const results = await Promise.allSettled(
    checks.map(({ check }) => Promise.race([check(), new Promise<void>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000))]))
  );

  const col1 = Math.max(...checks.map(c => c.name.length)) + 2;
  console.log("\n┌" + "─".repeat(col1 + 12) + "┐");
  console.log("│ Service" + " ".repeat(col1 - 7) + "Status     │");
  console.log("├" + "─".repeat(col1 + 12) + "┤");
  checks.forEach(({ name }, i) => {
    const ok = results[i].status === "fulfilled";
    const status = ok ? "✅ OK      " : "❌ FAIL    ";
    console.log(`│ ${name.padEnd(col1)}${status}│`);
  });
  console.log("└" + "─".repeat(col1 + 12) + "┘\n");
}
