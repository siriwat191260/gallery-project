import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
}

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: album } = await supabase
    .from("albums")
    .select("*, photos(*)")
    .eq("id", params.id)
    .single();

  if (!album) notFound();

  const photos: Photo[] = (album.photos ?? []).map((p: Photo) => ({
    ...p,
    x: p.x ?? 50,
    y: p.y ?? 50,
    w: p.w ?? 280,
    h: p.h ?? 200,
  }));

  // Calculate canvas bounds
  const maxX = photos.reduce((max, p) => Math.max(max, p.x + p.w), 800);
  const maxY = photos.reduce((max, p) => Math.max(max, p.y + p.h), 600);
  const canvasW = maxX + 60;
  const canvasH = maxY + 60;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm transition-colors hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="w-px h-4" style={{ background: "var(--border)" }} />
          <h1 className="text-lg font-light" style={{ color: "var(--text)" }}>{album.name}</h1>
        </div>
      </header>

      <section className="px-6 py-8 overflow-auto">
        {photos.length === 0 ? (
          <div className="text-center py-32" style={{ color: "var(--text-muted)" }}>
            <p className="font-light">No photos in this album.</p>
          </div>
        ) : (
          <div style={{ position: "relative", width: canvasW, minHeight: canvasH, margin: "0 auto" }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  position: "absolute",
                  left: photo.x,
                  top: photo.y,
                  width: photo.w,
                  height: photo.h,
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                }}
              >
                <Image
                  src={photo.url}
                  alt={photo.caption ?? ""}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="400px"
                />
                {photo.caption && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "rgba(0,0,0,0.6)", color: "#e8e8e8",
                    fontSize: 11, padding: "5px 10px",
                    fontFamily: "sans-serif",
                  }}>
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
