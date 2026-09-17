import { requireSession } from "@/lib/auth";
import { pageWrapper, pageInner, pageTitle, muted } from "@/lib/ui-conventions";

export default async function DashboardPage() {
  const user = await requireSession();
  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <h1 className={pageTitle}>Dashboard</h1>
        <p className={muted}>Welcome, {user.displayName ?? user.email}</p>
      </div>
    </div>
  );
}
