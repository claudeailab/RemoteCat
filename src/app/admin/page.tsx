import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, plans, audit_logs } from "@/lib/db/schema";
import { count, eq, desc } from "drizzle-orm";
import { Users, CreditCard, Cloud, Activity, ShieldCheck } from "lucide-react";
import { pageWrapper, pageInner } from "@/lib/ui-conventions";

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = name.split(/[\s@]/)[0];
  return `${time}, ${first}`;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  gradient: string;
  delay?: string;
}

function StatCard({ icon: Icon, label, value, gradient, delay = "" }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white animate-slide-up card-hover ${delay} bg-gradient-to-br ${gradient}`}>
      <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full bg-black/10" />
      <Icon className="relative h-6 w-6 mb-3 opacity-90" />
      <p className="relative text-3xl font-bold tracking-tight">{value}</p>
      <p className="relative text-sm mt-0.5 text-white/75 font-medium">{label}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const [[totalUsers], [azureUsers], [totalPlans], [auditCount], recentAudit] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(eq(users.source, "azure")),
    db.select({ count: count() }).from(plans),
    db.select({ count: count() }).from(audit_logs),
    db.select({ userEmail: audit_logs.userEmail, action: audit_logs.action, resource: audit_logs.resource, createdAt: audit_logs.createdAt })
      .from(audit_logs).orderBy(desc(audit_logs.createdAt)).limit(5),
  ]);

  return (
    <div className={pageWrapper}>
      <div className={pageInner}>

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 p-6 text-white mb-8">
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-24 h-20 w-20 rounded-full bg-white/[0.07]" />
          <ShieldCheck className="relative h-8 w-8 mb-3 text-indigo-200" />
          <h1 className="relative text-2xl font-bold tracking-tight">{greeting(user.displayName ?? user.email)}</h1>
          <p className="relative text-white/70 text-sm mt-1">Admin Panel · Everything looks good.</p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={totalUsers.count} gradient="from-blue-500 to-indigo-600" />
          <StatCard icon={Cloud} label="Azure AD Users" value={azureUsers.count} gradient="from-sky-400 to-blue-600" delay="delay-75" />
          <StatCard icon={CreditCard} label="Plans" value={totalPlans.count} gradient="from-violet-500 to-purple-700" delay="delay-150" />
          <StatCard icon={Activity} label="Audit Events" value={auditCount.count} gradient="from-emerald-400 to-teal-600" delay="delay-225" />
        </div>

        {/* Recent activity */}
        {recentAudit.length > 0 && (
          <div className="animate-slide-up delay-300">
            <h2 className="text-base font-semibold mb-3 text-foreground/80">Recent Activity</h2>
            <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
              {recentAudit.map((log, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {(log.userEmail ?? "?")[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">
                      <span className="font-medium">{log.userEmail ?? "System"}</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{log.action}</span>
                      <span className="text-muted-foreground ml-1">{log.resource}</span>
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {new Date(log.createdAt!).toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
