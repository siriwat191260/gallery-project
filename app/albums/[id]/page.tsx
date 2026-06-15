import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: album } = await supabase
    .from("albums")
    .select("*, photos(*)")
    .eq("id", params.id)
    .order("order_index", { referencedTable: "photos" })
    .single();

  if (!album) notFound();

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm transition-colors hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={16} />
            Back
          </Link>
          <div className="w-px h-4" style={{ background: "var(--border)" }} />
          <div>
            <h1 className="text-lg font-light" style={{ color: "var(--text)" }}>{album.name}</h1>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10">
        {album.description && (
          <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>{album.description}</p>
        )}

        {album.photos?.length === 0 ? (
          <div className="text-center py-32" style={{ color: "var(--text-muted)" }}>
            <p className="font-light">No photos in this album.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {album.photos?.map((photo: { id: string; url: string; caption: string | null }) => (
              <div key={photo.id} className="break-inside-avoid overflow-hidden rounded" style={{ border: "1px solid var(--border)" }}>
                <div className="relative w-full">
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                {photo.caption && (
                  <p className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
