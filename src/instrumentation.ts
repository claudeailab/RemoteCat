export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Create tables if they don't exist
  {
    const { db } = await import("./lib/db");
    const stmts = [
      `CREATE TABLE IF NOT EXISTS \`remotecat_settings\` (
        \`key\` varchar(255) NOT NULL,
        \`value\` text NOT NULL,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      `CREATE TABLE IF NOT EXISTS \`secret_reminders\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`expiry_date\` date NOT NULL,
        \`reminder_days\` int NOT NULL DEFAULT 30,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      `CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`email\` varchar(255) NOT NULL,
        \`display_name\` varchar(255),
        \`role\` varchar(50) NOT NULL DEFAULT 'user',
        \`source\` varchar(50) NOT NULL DEFAULT 'local',
        \`azure_oid\` varchar(255),
        \`password_hash\` varchar(255),
        \`last_login_at\` timestamp NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`users_email_unique\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      `CREATE TABLE IF NOT EXISTS \`sessions\` (
        \`id\` varchar(255) NOT NULL,
        \`user_id\` int NOT NULL,
        \`expires_at\` timestamp NOT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`sessions_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      `CREATE TABLE IF NOT EXISTS \`plans\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`monthly_price\` int NOT NULL DEFAULT 0,
        \`yearly_price\` int NOT NULL DEFAULT 0,
        \`features\` text NOT NULL DEFAULT ('[]'),
        \`stripe_price_id_monthly\` varchar(255),
        \`stripe_price_id_yearly\` varchar(255),
        \`active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      `CREATE TABLE IF NOT EXISTS \`remotecat_audit_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_email\` varchar(255),
        \`action\` varchar(100) NOT NULL,
        \`resource\` varchar(255) NOT NULL,
        \`detail\` text,
        \`ip\` varchar(45),
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    ];
    for (const sql of stmts) {
      await db.execute(sql as unknown as Parameters<typeof db.execute>[0]);
    }
  }

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
