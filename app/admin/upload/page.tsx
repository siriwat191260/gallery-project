"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import type { Album } from "@/types";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";

interface FileWithPreview {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  caption: string;
}

export default function AdminUploadPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("albums").select("*").order("name").then(({ data }) => {
      setAlbums(data ?? []);
      if (data && data.length > 0) setSelectedAlbum(data[0].id);
    });
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = accepted.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
      caption: "",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, caption } : f)));
  };

  const handleUpload = async () => {
    if (!selectedAlbum || files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === "done") continue;

      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f));

      try {
        const ext = item.file.name.split(".").pop();
        const path = `${selectedAlbum}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(path, item.file, { contentType: item.file.type });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);

        // Get current photo count for ordering
        const { count } = await supabase.from("photos").select("*", { count: "exact", head: true }).eq("album_id", selectedAlbum);

        await supabase.from("photos").insert({
          album_id: selectedAlbum,
          url: publicUrl,
          caption: item.caption || null,
          order_index: (count ?? 0) + i,
        });

        // Set cover if first photo
        const { data: album } = await supabase.from("albums").select("cover_image_url").eq("id", selectedAlbum).single();
        if (!album?.cover_image_url) {
          await supabase.from("albums").update({ cover_image_url: publicUrl }).eq("id", selectedAlbum);
        }

        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "done" } : f));
      } catch {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "error" } : f));
      }
    }

    setUploading(false);
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-light mb-8" style={{ color: "var(--text)" }}>Upload Photos</h1>

      {/* Album select */}
      <div className="mb-6">
        <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
          Upload to Album
        </label>
        <select
          value={selectedAlbum}
          onChange={(e) => setSelectedAlbum(e.target.value)}
          className="px-3 py-2.5 rounded text-sm outline-none"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", minWidth: 240 }}
        >
          {albums.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="rounded border-2 border-dashed p-10 text-center cursor-pointer transition-colors mb-6"
        style={{
          borderColor: isDragActive ? "var(--accent)" : "var(--border)",
          background: isDragActive ? "rgba(201,169,110,0.05)" : "var(--surface)",
        }}
      >
        <input {...getInputProps()} />
        <Upload size={28} className="mx-auto mb-3" style={{ color: "var(--accent)" }} />
        <p className="text-sm" style={{ color: "var(--text)" }}>
          {isDragActive ? "Drop photos here" : "Drag photos here, or click to browse"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>JPG, PNG, WEBP supported</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3 mb-6">
          {files.map((item, i) => (
            <div
              key={i}
              className="flex gap-3 items-start rounded p-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="relative w-16 h-16 rounded overflow-hidden shrink-0">
                <Image src={item.preview} alt="" fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate mb-1.5" style={{ color: "var(--text-muted)" }}>{item.file.name}</p>
                <input
                  value={item.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Caption (optional)"
                  disabled={item.status !== "pending"}
                  className="w-full px-2 py-1.5 rounded text-xs outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {item.status === "uploading" && (
                  <span className="text-xs" style={{ color: "var(--accent)" }}>Uploading...</span>
                )}
                {item.status === "done" && <CheckCircle size={18} className="text-green-400" />}
                {item.status === "error" && <AlertCircle size={18} className="text-red-400" />}
                {item.status === "pending" && (
                  <button onClick={() => removeFile(i)} className="p-1 hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingCount > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedAlbum}
          className="flex items-center gap-2 px-6 py-3 rounded text-sm disabled:opacity-50 transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "#0d0d0d", fontWeight: 600 }}
        >
          <Upload size={16} />
          {uploading ? "Uploading..." : `Upload ${pendingCount} photo${pendingCount > 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}
