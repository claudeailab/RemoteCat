import { requireAdmin } from "@/lib/auth";
import { pageWrapper, pageInner, pageTitle, muted } from "@/lib/ui-conventions";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  return (
    <div className={pageWrapper}>
      <div className={pageInner}>
        <h1 className={pageTitle}>Admin Dashboard</h1>
        <p className={muted}>Signed in as {user.email}</p>
      </div>
    </div>
  );
}
