"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Activity, Plus, BookOpen, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Beranda" },
  { href: "/activity", icon: Activity, label: "Aktivitas" },
  { href: "/groups/new", icon: Plus, label: "Pot Baru", isAction: true },
  { href: "/guide", icon: BookOpen, label: "Panduan" },
  { href: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-glass/95 backdrop-blur-md border-t border-pink-soft/60 safe-bottom">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="size-14 rounded-full bg-pink-strong flex items-center justify-center shadow-lg shadow-pink-strong/30 hover:bg-pink-deep transition-colors active:scale-95">
                  <Icon className="size-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors"
            >
              <Icon
                className={`size-5 transition-colors ${
                  isActive ? "text-pink-strong" : "text-ink-soft"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-pink-strong" : "text-ink-soft"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}