"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Tag,
  Megaphone,
  Zap,
  Users,
  Image,
  LogOut,
  Newspaper,
  Settings,
  ChevronRight,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/ads", label: "Ads", icon: Megaphone },
  { href: "/admin/breaking-news", label: "Breaking News", icon: Zap },
  { href: "/admin/media", label: "Media Library", icon: Image },
  { href: "/admin/social", label: "Instagram", icon: Share2 },
  { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700">
        <Newspaper className="h-6 w-6 text-blue-400" />
        <span className="font-bold text-lg">Lok Mandate</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && session?.user?.role !== "ADMIN") return null;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="ml-auto h-4 w-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || ""}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{session?.user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
