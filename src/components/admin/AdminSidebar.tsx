"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Settings, Users, CreditCard, Mail, Bot,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import version from "../../../version.json";

function CatLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 22C7 15.373 11.029 10 16 10C20.971 10 25 15.373 25 22C25 26 20.971 28 16 28C11.029 28 7 26 7 22Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
      <path d="M7 17L5 8L11 15" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
      <path d="M25 17L27 8L21 15" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
      <path d="M12.5 20.5C12.5 19.5 13 18.5 13.5 18.5C14 18.5 14.5 19.5 14.5 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17.5 20.5C17.5 19.5 18 18.5 18.5 18.5C19 18.5 19.5 19.5 19.5 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="16" cy="23" r="1" fill="currentColor"/>
      <path d="M14.5 24.5C15 25.5 17 25.5 17.5 24.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  );
}

const platformItems = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
];

const systemItems = [
  { href: "/admin/settings/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/settings/m365", label: "Microsoft 365", icon: Settings },
  { href: "/admin/settings/email", label: "Email Settings", icon: Mail },
  { href: "/admin/settings/ai", label: "Artificial Intelligence", icon: Bot },
];

interface NavItem { href: string; label: string; icon: React.ElementType }
interface Props { user: { email: string; displayName?: string | null } }

export default function AdminSidebar({ user }: Props) {
  const path = usePathname();
  const platformActive = platformItems.some(i => path.startsWith(i.href));
  const systemActive = systemItems.some(i => path.startsWith(i.href));
  const [platformOpen, setPlatformOpen] = useState(platformActive);
  const [systemOpen, setSystemOpen] = useState(systemActive);

  const navGroup = (title: string, items: NavItem[], anyActive: boolean, open: boolean, toggle: () => void) => (
    <div className="mt-2">
      <button
        onClick={toggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
          anyActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>{title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5 pl-2 border-l-2 border-primary/20 ml-3">
          {items.map(({ href, label, icon: Icon }) => navLink(href, label, Icon))}
        </div>
      )}
    </div>
  );

  const navLink = (href: string, label: string, Icon: React.ElementType, exact = false) => {
    const active = exact ? path === href : path.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          active
            ? "bg-primary text-primary-foreground font-medium"
            : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 z-40"
        style={{ background: "var(--color-sidebar)", borderRight: "1px solid var(--color-sidebar-border)" }}
      >
        {/* Logo + name */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: "var(--color-sidebar-border)" }}>
          <CatLogo className="h-7 w-7 text-primary shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight truncate">RemoteCat</span>
            <span className="text-xs text-muted-foreground">v{version.version}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {navLink("/admin", "Dashboard", LayoutDashboard, true)}

          {navGroup("Platform", platformItems, platformActive, platformOpen, () => setPlatformOpen(o => !o))}
          {navGroup("System", systemItems, systemActive, systemOpen, () => setSystemOpen(o => !o))}
        </nav>

        <div
          className="p-4 border-t text-xs text-muted-foreground truncate"
          style={{ borderColor: "var(--color-sidebar-border)" }}
        >
          {user.displayName ?? user.email}
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background z-40 flex" style={{ borderColor: "var(--color-sidebar-border)" }}>
        {[
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
          { href: "/admin/settings/m365", label: "M365", icon: Settings },
          { href: "/admin/settings/ai", label: "AI", icon: Bot },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/subscriptions", label: "Plans", icon: CreditCard },
        ].map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-[4rem]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
