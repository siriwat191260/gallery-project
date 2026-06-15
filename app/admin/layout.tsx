import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <AdminSidebar userEmail={user.email ?? ""} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
