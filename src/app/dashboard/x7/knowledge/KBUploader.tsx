"use client";

import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

export function KBUploader({ kbId }: { kbId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("knowledge_base_id", kbId);

    try {
      const res = await fetch("/api/x7/knowledge/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Success! Processed ${data.chunksProcessed} chunks from ${data.filename}.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-red-400 text-xs">{error}</span>}
      <label className={`flex items-center justify-center gap-2 text-xs font-medium bg-white/5 px-3 py-1.5 rounded border border-white/10 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer text-white'}`}>
        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        {isUploading ? 'Procesando...' : 'Upload File'}
        <input 
          type="file" 
          accept=".txt,.md,.csv" 
          className="hidden" 
          onChange={handleUpload}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}
