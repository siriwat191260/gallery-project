import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Images, Upload } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = createClient();
  const { count: albumCount } = await supabase.from("albums").select("*", { count: "exact", head: true });
  const { count: photoCount } = await supabase.from("photos").select("*", { count: "exact", head: true });

  const stats = [
    { label: "Albums", value: albumCount ?? 0 },
    { label: "Photos", value: photoCount ?? 0 },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-light mb-8" style={{ color: "var(--text)" }}>Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-10 max-w-sm">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-3xl font-light" style={{ color: "var(--accent)" }}>{value}</p>
            <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Quick Actions</h2>
      <div className="flex gap-3">
        <Link
          href="/admin/albums"
          className="flex items-center gap-2 px-5 py-3 rounded text-sm transition-opacity hover:opacity-80"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
        >
          <Images size={16} />
          Manage Albums
        </Link>
        <Link
          href="/admin/upload"
          className="flex items-center gap-2 px-5 py-3 rounded text-sm transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "#0d0d0d", fontWeight: 600 }}
        >
          <Upload size={16} />
          Upload Photos
        </Link>
      </div>
    </div>
  );
}
