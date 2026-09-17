"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import version from "../../../version.json";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/settings/m365", label: "M365", icon: Settings },
  { href: "/admin/settings/email", label: "Email / SMTP", icon: Settings },
  { href: "/admin/settings/ai", label: "AI", icon: Settings },
  { href: "/admin/settings/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/users", label: "Users", icon: Users },
];

interface Props { user: { email: string; displayName?: string | null } }

export default function AdminSidebar({ user }: Props) {
  const path = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 border-r bg-background z-40">
        <div className="flex flex-col gap-1 p-4 border-b">
          <span className="font-semibold text-sm">RemoteCat</span>
          <span className="text-xs text-muted-foreground">v{version.version}</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                path === href && "bg-accent font-medium"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-muted-foreground truncate">{user.email}</div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background z-40 flex">
        {nav.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
              path === href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate max-w-[4rem]">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
