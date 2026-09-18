"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users, CreditCard, Mail, Bot, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Features } from "@/lib/features";
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

const SIDEBAR_BG = "linear-gradient(175deg, hsl(247,72%,19%) 0%, hsl(254,65%,13%) 55%, hsl(262,60%,9%) 100%)";

interface NavItem { href: string; label: string; icon: React.ElementType }
interface Props {
  user: { email: string; displayName?: string | null };
  features: Features;
}

function initials(str: string) {
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return str.slice(0, 2).toUpperCase();
}

export default function AdminSidebar({ user, features }: Props) {
  const path = usePathname();

  const navLink = (href: string, label: string, Icon: React.ElementType, exact = false) => {
    const active = exact ? path === href : path.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
          active
            ? "bg-white/[0.13] text-white font-medium shadow-sm"
            : "text-white/55 hover:bg-white/[0.07] hover:text-white/90"
        )}
      >
        <span className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md transition-colors",
          active ? "text-indigo-300" : "text-white/40"
        )}>
          <Icon className="h-4 w-4" />
        </span>
        {label}
        {active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-300 shrink-0" />
        )}
      </Link>
    );
  };

  const navGroup = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mt-4">
        <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
          {title}
        </p>
        <div className="flex flex-col gap-0.5">
          {items.map(({ href, label, icon: Icon }) => navLink(href, label, Icon))}
        </div>
      </div>
    );
  };

  const platformItems: NavItem[] = [
    { href: "/admin/users", label: "Users", icon: Users },
    ...(features.subscriptions ? [{ href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard }] : []),
  ];

  const systemItems: NavItem[] = [
    { href: "/admin/settings", label: "Settings", icon: SlidersHorizontal },
    ...(features.payments ? [{ href: "/admin/payments", label: "Payments", icon: CreditCard }] : []),
    ...(features.m365 ? [{ href: "/admin/m365", label: "Microsoft 365", icon: Settings }] : []),
    ...(features.email ? [{ href: "/admin/email", label: "Email Settings", icon: Mail }] : []),
    ...(features.ai ? [{ href: "/admin/ai", label: "Artificial Intelligence", icon: Bot }] : []),
  ];

  const mobileItems = [
    { href: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
    ...(features.m365 ? [{ href: "/admin/m365", label: "M365", icon: Settings }] : []),
    ...(features.ai ? [{ href: "/admin/ai", label: "AI", icon: Bot }] : []),
    { href: "/admin/users", label: "Users", icon: Users },
    ...(features.subscriptions ? [{ href: "/admin/subscriptions", label: "Plans", icon: CreditCard }] : []),
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 z-40"
        style={{ background: SIDEBAR_BG }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.08]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-400/20 shrink-0">
            <CatLogo className="h-5 w-5 text-indigo-300" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight text-white truncate">RemoteCat</span>
            <span className="text-[10px] text-white/35 font-mono">v{version.version}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col">
          {navLink("/admin", "Dashboard", LayoutDashboard, true)}
          {navGroup("Platform", platformItems)}
          {navGroup("System", systemItems)}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-default">
            <div className="h-7 w-7 rounded-full bg-indigo-500/40 flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-1 ring-indigo-300/30">
              {initials(user.displayName ?? user.email)}
            </div>
            <span className="text-xs text-white/60 truncate">{user.displayName ?? user.email}</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 border-t z-40 flex"
        style={{ background: SIDEBAR_BG, borderColor: "rgba(255,255,255,0.08)" }}
      >
        {mobileItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                active ? "text-indigo-300" : "text-white/45 hover:text-white/80"
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
