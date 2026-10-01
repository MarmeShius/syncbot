import { useRef, useState } from "react";
import { Paperclip, X, FileText, Loader2 } from "lucide-react";
import { apiRequest } from "../api";

export default function FileUpload({ attachments = [], onChange, maxFiles = 3 }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (attachments.length >= maxFiles) {
      setError(`Maximum ${maxFiles} attachments allowed.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB limit.");
      return;
    }

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiRequest("/upload", {
        method: "POST",
        body: formData,
      });

      if (data.attachment) {
        onChange([...attachments, data.attachment]);
      }
    } catch (err) {
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    const updated = [...attachments];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        <button
          type="button"
          disabled={uploading || attachments.length >= maxFiles}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
          ) : (
            <Paperclip className="h-3.5 w-3.5" />
          )}
          <span>{uploading ? "Uploading..." : "Attach File"}</span>
        </button>

        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Images, PDF, Doc up to 5MB ({attachments.length}/{maxFiles})
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {attachments.map((att, i) => (
            <div
              key={att.filename || i}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span className="max-w-40 truncate font-medium">
                {att.originalName || att.filename}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

