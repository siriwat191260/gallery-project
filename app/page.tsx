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
      <header className="bg-header">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#fff",
              fontFamily: "sans-serif",
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 4,
              marginBottom: 14,
              background: "#c4845a",
              boxShadow: "0 2px 12px rgba(196,132,90,0.4), 0 1px 0 rgba(255,255,255,0.2) inset, 0 -1px 0 rgba(0,0,0,0.15) inset",
            }}
          >
            Photography
          </p>
          <h1
            className="gallery-title"
            style={{
              fontSize: 40,
              fontWeight: 200,
              letterSpacing: "0.06em",
              color: "#3a2e28",
              lineHeight: 1,
            }}
          >
            Gallery
          </h1>
        </div>
      </header>

      {/* Albums Grid */}
      <section className="max-w-6xl mx-auto px-8 py-12">
        {!albums || albums.length === 0 ? (
          <div className="text-center py-32" style={{ color: "var(--text-muted)" }}>
            <p className="text-lg font-light">No albums yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {albums.map((album: Album) => (
              <Link key={album.id} href={`/albums/${album.id}`} className="group block">
                <div
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 20px rgba(180,140,110,0.18)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  className="group-hover:[transform:translateY(-4px)] group-hover:[box-shadow:0_12px_40px_rgba(180,140,110,0.35)]"
                >
                  {/* Cover Image */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    {album.cover_image_url ? (
                      <>
                        <Image
                          src={album.cover_image_url}
                          alt={album.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div style={{
                          position: "absolute", inset: 0,
                          background: "linear-gradient(to top, rgba(58,46,40,0.75) 0%, rgba(58,46,40,0.1) 50%, transparent 100%)",
                        }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 18px" }}>
                          <h2 style={{
                            fontSize: 18,
                            fontWeight: 300,
                            color: "#fdf8f0",
                            letterSpacing: "0.02em",
                            textShadow: "0 1px 8px rgba(58,46,40,0.6)",
                          }}>
                            {album.name}
                          </h2>
                          {album.description && (
                            <p style={{
                              fontSize: 12,
                              color: "rgba(253,248,240,0.7)",
                              marginTop: 3,
                              fontFamily: "sans-serif",
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical" as const,
                            }}>
                              {album.description}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-2"
                        style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.4}>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <span style={{ fontSize: 11, fontFamily: "sans-serif" }}>No cover</span>
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          padding: "14px 18px",
                          borderTop: "1px solid var(--border)",
                        }}>
                          <h2 style={{ fontSize: 16, fontWeight: 300, color: "var(--text)" }}>
                            {album.name}
                          </h2>
                        </div>
                      </div>
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
