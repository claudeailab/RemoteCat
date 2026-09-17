import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "./index";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
