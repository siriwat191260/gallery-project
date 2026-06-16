"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Save, Trash2, Check } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

const HANDLE_POS: Record<string, React.CSSProperties> = {
  tl: { top: -5, left: -5 },
  tr: { top: -5, right: -5 },
  bl: { bottom: -5, left: -5 },
  br: { bottom: -5, right: -5 },
};

const HANDLE_CURSOR: Record<string, string> = {
  tl: "nwse-resize", tr: "nesw-resize", bl: "nesw-resize", br: "nwse-resize",
};

export default function CanvasEditorPage() {
  const params = useParams();
  const albumId = params.id as string;
  const supabase = createClient();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

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

  const onMouseDownMove = (e: React.MouseEvent, photoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(photoId);
    setDragging(photoId);
    const photo = photos.find((p) => p.id === photoId)!;
    dragRef.current = {
      photoId, type: "move", handle: null,
      startX: e.clientX, startY: e.clientY,
      origX: photo.x, origY: photo.y, origW: photo.w, origH: photo.h,
    };
  };

  const onMouseDownResize = (e: React.MouseEvent, photoId: string, handle: Handle) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(photoId);
    const photo = photos.find((p) => p.id === photoId)!;
    dragRef.current = {
      photoId, type: "resize", handle,
      startX: e.clientX, startY: e.clientY,
      origX: photo.x, origY: photo.y, origW: photo.w, origH: photo.h,
    };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const { photoId, type, handle, startX, startY, origX, origY, origW, origH } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== photoId) return p;
        if (type === "move") return { ...p, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) };
        let nx = origX, ny = origY, nw = origW, nh = origH;
        if (handle === "br") { nw = Math.max(MIN_W, origW + dx); nh = Math.max(MIN_H, origH + dy); }
        if (handle === "bl") { nw = Math.max(MIN_W, origW - dx); nx = origX + (origW - nw); nh = Math.max(MIN_H, origH + dy); }
        if (handle === "tr") { nw = Math.max(MIN_W, origW + dx); nh = Math.max(MIN_H, origH - dy); ny = origY + (origH - nh); }
        if (handle === "tl") { nw = Math.max(MIN_W, origW - dx); nx = origX + (origW - nw); nh = Math.max(MIN_H, origH - dy); ny = origY + (origH - nh); }
        return { ...p, x: nx, y: ny, w: nw, h: nh };
      })
    );
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    setDragging(null);
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
    const url = new URL(photo.url);
    const pathParts = url.pathname.split("/object/public/photos/");
    if (pathParts[1]) await supabase.storage.from("photos").remove([pathParts[1]]);
    await supabase.from("photos").delete().eq("id", photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setSelected(null);
    setConfirmDelete(null);
    const { data: albumData } = await supabase.from("albums").select("cover_image_url").eq("id", albumId).single();
    if (albumData?.cover_image_url === photo.url) {
      const remaining = photos.filter((p) => p.id !== photoId);
      await supabase.from("albums").update({ cover_image_url: remaining[0]?.url ?? null }).eq("id", albumId);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">Loading...</motion.div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      {/* Toolbar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/admin/albums" className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60" style={{ color: "var(--text-muted)" }}>
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
            className="text-xs px-3 py-1.5 rounded transition-opacity hover:opacity-70"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            Preview ↗
          </Link>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm disabled:opacity-50"
            style={{
              background: saved ? "#2d5a2d" : "var(--accent)",
              color: saved ? "#aeffae" : "#0d0d0d",
              fontWeight: 600,
              transition: "background 0.3s",
            }}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span key="saved" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                  <Check size={14} /> Saved
                </motion.span>
              ) : saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Saving...</motion.span>
              ) : (
                <motion.span key="save" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
                  <Save size={14} /> Save
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto"
        style={{
          background: "#0e0e0e",
          backgroundImage: "radial-gradient(circle, #2a2a2a 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onClick={() => { setSelected(null); setConfirmDelete(null); }}
      >
        {photos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: "var(--text-muted)" }}
          >
            <div className="text-center">
              <p className="text-lg font-light mb-1">No photos yet</p>
              <p className="text-sm">Upload photos from the Upload page</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {photos.map((photo) => {
            const isSelected = selected === photo.id;
            const isDragging = dragging === photo.id;

            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                style={{
                  position: "absolute",
                  left: photo.x,
                  top: photo.y,
                  width: photo.w,
                  height: photo.h,
                  borderRadius: 6,
                  overflow: "visible",
                  cursor: isDragging ? "grabbing" : "grab",
                  userSelect: "none",
                  zIndex: isSelected ? 10 : 1,
                  // 3D depth effect
                  boxShadow: isSelected
                    ? "0 20px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), 0 0 0 2px #c9a96e"
                    : "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)",
                  transform: isDragging ? "scale(1.02)" : "scale(1)",
                  transition: isDragging ? "box-shadow 0.15s, transform 0.1s" : "box-shadow 0.25s, transform 0.2s",
                }}
                onMouseDown={(e) => onMouseDownMove(e, photo.id)}
                onClick={(e) => { e.stopPropagation(); setSelected(photo.id); }}
              >
                {/* Inner photo */}
                <div style={{ width: "100%", height: "100%", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    fill
                    style={{ objectFit: "cover", pointerEvents: "none" }}
                    sizes="400px"
                  />
                  {/* Sheen overlay on select */}
                  <motion.div
                    animate={{ opacity: isSelected ? 0.06 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #fff 0%, transparent 60%)", pointerEvents: "none" }}
                  />
                </div>

                {/* Caption */}
                {photo.caption && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(4px)",
                    color: "#e8e8e8",
                    fontSize: 10, padding: "5px 8px", borderRadius: "0 0 6px 6px",
                    fontFamily: "sans-serif", pointerEvents: "none",
                  }}>
                    {photo.caption}
                  </div>
                )}

                {/* Controls when selected */}
                <AnimatePresence>
                  {isSelected && (
                    <>
                      {/* Delete confirm bar */}
                      {confirmDelete === photo.id ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          style={{ position: "absolute", top: -44, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, zIndex: 30, whiteSpace: "nowrap" }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                            style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 4, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "sans-serif", boxShadow: "0 4px 12px rgba(192,57,43,0.5)" }}
                          >
                            Confirm delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                            style={{ background: "rgba(20,20,20,0.9)", color: "#aaa", border: "1px solid #333", borderRadius: 4, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "sans-serif" }}
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        /* Delete button */
                        <motion.button
                          key="delete-btn"
                          initial={{ opacity: 0, scale: 0.6, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(photo.id); }}
                          onMouseDown={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            top: -14,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 28, height: 28,
                            background: "#c0392b",
                            border: "2px solid #1a0808",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", zIndex: 30,
                            boxShadow: "0 4px 12px rgba(192,57,43,0.6)",
                          }}
                        >
                          <Trash2 size={12} color="#fff" />
                        </motion.button>
                      )}

                      {/* Resize handles */}
                      {(["tl", "tr", "bl", "br"] as Handle[]).map((handle) => (
                        <motion.div
                          key={handle}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          whileHover={{ scale: 1.4 }}
                          onMouseDown={(e) => { e.stopPropagation(); onMouseDownResize(e, photo.id, handle); }}
                          style={{
                            position: "absolute",
                            ...HANDLE_POS[handle!],
                            width: 10, height: 10,
                            background: "#c9a96e",
                            border: "2px solid #0d0d0d",
                            borderRadius: 3,
                            cursor: HANDLE_CURSOR[handle!],
                            zIndex: 20,
                            boxShadow: "0 2px 8px rgba(201,169,110,0.4)",
                          }}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="px-5 py-2 border-t text-xs flex gap-6 shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontFamily: "sans-serif" }}
      >
        <span>Drag — move photo</span>
        <span>Corner handles — resize</span>
        <span>Click photo → red button — delete</span>
        <span>Save to apply changes</span>
      </motion.div>
    </div>
  );
}
