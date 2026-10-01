import { Download, File } from "lucide-react";

export default function AttachmentList({ attachments = [] }) {
  if (!attachments || attachments.length === 0) return null;

  const rawApi = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = rawApi.replace(/\/api\/?$/, "");

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimetype, filename) => {
    if (mimetype?.startsWith("image/")) return true;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(filename || "");
  };

  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {attachments.map((att, idx) => {
        const fullUrl = att.url?.startsWith("http") ? att.url : `${baseUrl}${att.url}`;
        const image = isImage(att.mimetype, att.originalName || att.filename);

        return (
          <a
            key={att.filename || idx}
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-xs transition hover:border-emerald-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {image ? (
              <img
                src={fullUrl}
                alt={att.originalName}
                className="h-9 w-9 rounded object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <File className="h-4 w-4" />
              </div>
            )}

            <div className="max-w-44 text-left">
              <p className="truncate font-medium text-slate-800 group-hover:text-emerald-600 dark:text-slate-200 dark:group-hover:text-emerald-400">
                {att.originalName || att.filename}
              </p>
              {att.size && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {formatSize(att.size)}
                </p>
              )}
            </div>

            <Download className="ml-1 h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400" />
          </a>
        );
      })}
    </div>
  );
}

