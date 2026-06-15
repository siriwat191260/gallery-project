import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Album } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: albums } = await supabase
    .from("albums")
    .select("*, photos(count)")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-1" style={{ color: "var(--accent)" }}>
              Photography
            </p>
            <h1 className="text-3xl font-light tracking-wide" style={{ color: "var(--text)" }}>
              Gallery
            </h1>
          </div>
        </div>
      </header>

      {/* Albums Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {!albums || albums.length === 0 ? (
          <div className="text-center py-32" style={{ color: "var(--text-muted)" }}>
            <p className="text-lg font-light">No albums yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album: Album) => (
              <Link key={album.id} href={`/albums/${album.id}`}>
                <div
                  className="group cursor-pointer rounded overflow-hidden"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-800">
                    {album.cover_image_url ? (
                      <Image
                        src={album.cover_image_url}
                        alt={album.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
                        <span className="text-sm">No cover</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h2 className="font-light text-lg" style={{ color: "var(--text)" }}>
                      {album.name}
                    </h2>
                    {album.description && (
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                        {album.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
