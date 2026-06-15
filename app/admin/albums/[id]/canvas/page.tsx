"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Save, Trash2, Check } from "lucide-react";
import Link from "next/link";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Album {
  id: string;
  name: string;
}

type Handle = "tl" | "tr" | "bl" | "br" | null;

const MIN_W = 100;
const MIN_H = 80;

export default function CanvasEditorPage() {
  const params = useParams();
  const albumId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const dragRef = useRef<{
    photoId: string;
    type: "move" | "resize";
    handle: Handle;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: albumData }, { data: photosData }] = await Promise.all([
        supabase.from("albums").select("id, name").eq("id", albumId).single(),
        supabase.from("photos").select("id, url, caption, x, y, w, h").eq("album_id", albumId),
      ]);
      setAlbum(albumData);
      setPhotos(
        (photosData ?? []).map((p) => ({
          ...p,
          x: p.x ?? 50,
          y: p.y ?? 50,
          w: p.w ?? 280,
          h: p.h ?? 200,
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, [albumId]);

  const getCanvasOffset = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return { ox: rect?.left ?? 0, oy: rect?.top ?? 0 };
  };

  const onMouseDownMove = (e: React.MouseEvent, photoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(photoId);
    const photo = photos.find((p) => p.id === photoId)!;
    dragRef.current = {
      photoId,
      type: "move",
      handle: null,
      startX: e.clientX,
      startY: e.clientY,
      origX: photo.x,
      origY: photo.y,
      origW: photo.w,
      origH: photo.h,
    };
  };

  const onMouseDownResize = (e: React.MouseEvent, photoId: string, handle: Handle) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(photoId);
    const photo = photos.find((p) => p.id === photoId)!;
    dragRef.current = {
      photoId,
      type: "resize",
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origX: photo.x,
      origY: photo.y,
      origW: photo.w,
      origH: photo.h,
    };
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { photoId, type, handle, startX, startY, origX, origY, origW, origH } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setPhotos((prev) =>
        prev.map((p) => {
          if (p.id !== photoId) return p;
          if (type === "move") {
            return { ...p, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) };
          }
          // resize
          let nx = origX, ny = origY, nw = origW, nh = origH;
          if (handle === "br") { nw = Math.max(MIN_W, origW + dx); nh = Math.max(MIN_H, origH + dy); }
          if (handle === "bl") { nw = Math.max(MIN_W, origW - dx); nx = origX + (origW - nw); nh = Math.max(MIN_H, origH + dy); }
          if (handle === "tr") { nw = Math.max(MIN_W, origW + dx); nh = Math.max(MIN_H, origH - dy); ny = origY + (origH - nh); }
          if (handle === "tl") { nw = Math.max(MIN_W, origW - dx); nx = origX + (origW - nw); nh = Math.max(MIN_H, origH - dy); ny = origY + (origH - nh); }
          return { ...p, x: nx, y: ny, w: nw, h: nh };
        })
      );
    },
    []
  );

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleSave = async () => {
    setSaving(true);
    await Promise.all(
      photos.map((p) =>
        supabase.from("photos").update({ x: p.x, y: p.y, w: p.w, h: p.h }).eq("id", p.id)
      )
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;

    // Extract storage path from URL
    const url = new URL(photo.url);
    const pathParts = url.pathname.split("/object/public/photos/");
    if (pathParts[1]) {
      await supabase.storage.from("photos").remove([pathParts[1]]);
    }
    await supabase.from("photos").delete().eq("id", photoId);

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setSelected(null);
    setConfirmDelete(null);

    // Update cover if deleted photo was cover
    const { data: albumData } = await supabase.from("albums").select("cover_image_url").eq("id", albumId).single();
    if (albumData?.cover_image_url === photo.url) {
      const remaining = photos.filter((p) => p.id !== photoId);
      await supabase.from("albums").update({ cover_image_url: remaining[0]?.url ?? null }).eq("id", albumId);
    }
  };

  const HANDLE_POS: Record<string, { top?: string; bottom?: string; left?: string; right?: string }> = {
    tl: { top: "-5px", left: "-5px" },
    tr: { top: "-5px", right: "-5px" },
    bl: { bottom: "-5px", left: "-5px" },
    br: { bottom: "-5px", right: "-5px" },
  };

  const HANDLE_CURSOR: Record<string, string> = {
    tl: "nwse-resize", tr: "nesw-resize", bl: "nesw-resize", br: "nwse-resize",
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
      Loading...
    </div>
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-3">
          <Link href="/admin/albums" className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={15} /> Albums
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <span className="text-sm font-light" style={{ color: "var(--text)" }}>{album?.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </span>
          <Link
            href={`/albums/${albumId}`}
            target="_blank"
            className="text-xs px-3 py-1.5 rounded"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            Preview ↗
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm disabled:opacity-50"
            style={{ background: saved ? "#2d5a2d" : "var(--accent)", color: saved ? "#aeffae" : "#0d0d0d", fontWeight: 600 }}
          >
            {saved ? <><Check size={14} /> Saved</> : saving ? "Saving..." : <><Save size={14} /> Save</>}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto"
        style={{ background: "#111", backgroundImage: "radial-gradient(circle, #2a2a2a 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        onClick={() => setSelected(null)}
      >
        {photos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <div className="text-center">
              <p className="text-lg font-light mb-1">No photos yet</p>
              <p className="text-sm">Upload photos from the Upload page</p>
            </div>
          </div>
        )}

        {photos.map((photo) => {
          const isSelected = selected === photo.id;
          return (
            <div
              key={photo.id}
              style={{
                position: "absolute",
                left: photo.x,
                top: photo.y,
                width: photo.w,
                height: photo.h,
                outline: isSelected ? "2px solid #c9a96e" : "1px solid #2a2a2a",
                borderRadius: 4,
                overflow: "visible",
                cursor: "move",
                userSelect: "none",
                zIndex: isSelected ? 10 : 1,
              }}
              onMouseDown={(e) => onMouseDownMove(e, photo.id)}
              onClick={(e) => { e.stopPropagation(); setSelected(photo.id); }}
            >
              {/* Photo */}
              <div style={{ width: "100%", height: "100%", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                <Image src={photo.url} alt={photo.caption ?? ""} fill style={{ objectFit: "cover", pointerEvents: "none" }} sizes="400px" />
              </div>

              {/* Delete button */}
              {isSelected && (
                <>
                  {confirmDelete === photo.id ? (
                    <div
                      style={{ position: "absolute", top: -36, right: 0, display: "flex", gap: 4, zIndex: 20 }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                        style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "sans-serif" }}
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                        style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "sans-serif" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(photo.id); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute", top: -14, right: -14, width: 28, height: 28,
                        background: "#c0392b", border: "none", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", zIndex: 20,
                      }}
                    >
                      <Trash2 size={13} color="#fff" />
                    </button>
                  )}

                  {/* Resize handles */}
                  {(["tl", "tr", "bl", "br"] as Handle[]).map((handle) => (
                    <div
                      key={handle}
                      onMouseDown={(e) => { e.stopPropagation(); onMouseDownResize(e, photo.id, handle); }}
                      style={{
                        position: "absolute",
                        ...HANDLE_POS[handle!],
                        width: 10, height: 10,
                        background: "#c9a96e",
                        border: "2px solid #0d0d0d",
                        borderRadius: 2,
                        cursor: HANDLE_CURSOR[handle!],
                        zIndex: 20,
                      }}
                    />
                  ))}
                </>
              )}

              {/* Caption */}
              {photo.caption && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0.6)", color: "#e8e8e8",
                  fontSize: 10, padding: "4px 8px", borderRadius: "0 0 4px 4px",
                  fontFamily: "sans-serif", pointerEvents: "none",
                }}>
                  {photo.caption}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div className="px-5 py-2 border-t text-xs flex gap-6 shrink-0" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontFamily: "sans-serif" }}>
        <span>Drag — move photo</span>
        <span>Corner handles — resize</span>
        <span>Click photo → red button — delete</span>
        <span>Save to apply changes</span>
      </div>
    </div>
  );
}
