"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Album } from "@/types";
import Image from "next/image";
import { Trash2, Plus, Pencil } from "lucide-react";

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAlbum, setEditAlbum] = useState<Album | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchAlbums = async () => {
    const { data } = await supabase.from("albums").select("*").order("created_at", { ascending: false });
    setAlbums(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAlbums(); }, []);

  const openCreate = () => {
    setEditAlbum(null);
    setName("");
    setDescription("");
    setShowForm(true);
  };

  const openEdit = (album: Album) => {
    setEditAlbum(album);
    setName(album.name);
    setDescription(album.description ?? "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (editAlbum) {
      await supabase.from("albums").update({ name, description }).eq("id", editAlbum.id);
    } else {
      await supabase.from("albums").insert({ name, description });
    }
    setSaving(false);
    setShowForm(false);
    fetchAlbums();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this album and all its photos?")) return;
    await supabase.from("albums").delete().eq("id", id);
    fetchAlbums();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-light" style={{ color: "var(--text)" }}>Albums</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded text-sm transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "#0d0d0d", fontWeight: 600 }}
        >
          <Plus size={16} /> New Album
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded p-6 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="text-lg font-light" style={{ color: "var(--text)" }}>
              {editAlbum ? "Edit Album" : "New Album"}
            </h2>
            <div>
              <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-muted)" }}>Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded text-sm outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded text-sm outline-none resize-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded text-sm disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#0d0d0d", fontWeight: 600 }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded text-sm"
                style={{ background: "var(--bg)", color: "var(--text-muted)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Albums list */}
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : albums.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No albums yet.</p>
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <div
              key={album.id}
              className="flex items-center gap-4 rounded p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {/* Cover thumb */}
              <div className="w-14 h-14 rounded overflow-hidden shrink-0 bg-neutral-800">
                {album.cover_image_url ? (
                  <Image src={album.cover_image_url} alt="" width={56} height={56} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-light" style={{ color: "var(--text)" }}>{album.name}</p>
                {album.description && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{album.description}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(album)} className="p-2 rounded transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(album.id)} className="p-2 rounded transition-opacity hover:opacity-70 text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
