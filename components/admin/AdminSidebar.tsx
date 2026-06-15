"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Images, Upload, LayoutDashboard, LogOut } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/albums", label: "Albums", icon: Images },
  { href: "/admin/upload", label: "Upload", icon: Upload },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className="w-56 flex flex-col border-r shrink-0"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {/* Brand */}
      <div className="px-6 py-7 border-b" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "var(--accent)" }}>Admin</p>
        <p className="text-lg font-light mt-0.5" style={{ color: "var(--text)" }}>Gallery</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
              style={{
                background: active ? "var(--bg)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs px-3 mb-2 truncate" style={{ color: "var(--text-muted)" }}>{userEmail}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm w-full transition-colors hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
