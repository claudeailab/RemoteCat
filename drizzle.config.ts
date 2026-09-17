import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.REMOTE_CAT_DB_HOST!,
    port: Number(process.env.REMOTE_CAT_DB_PORT ?? 3306),
    user: process.env.REMOTE_CAT_DB_USER!,
    password: process.env.REMOTE_CAT_DB_PASSWORD!,
    database: process.env.REMOTE_CAT_DB_NAME!,
  },
} satisfies Config;
