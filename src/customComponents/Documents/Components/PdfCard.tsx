import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2 } from "lucide-react";
import type { PdfData } from "../Data/PdfData";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";

interface PdfCardProps {
  pdf: PdfData;
  onView: (pdf: PdfData) => void;
  onDelete?: (id: string) => void;  
  deleting?: boolean;              
}

function normalizeName(name: string) {
  const idx = name.indexOf("-");
  return idx > 0 ? name.slice(idx + 1).trim() : name;
}

// Truncate preserving extension; middle-ellipsis for long names
function truncateFileName(name: string, maxLength = 42) {
  if (!name) return "document.pdf";
  const n = normalizeName(name);
  if (n.length <= maxLength) return n;

  const dot = n.lastIndexOf(".");
  const ext = dot !== -1 ? n.slice(dot) : "";
  const base = dot !== -1 ? n.slice(0, dot) : n;
  const keep = Math.max(8, maxLength - ext.length - 3);
  return `${base.slice(0, keep)}…${ext}`;
}

function formatTimestamp(timestamp: Date | string | number) {
  try {
    return new Date(timestamp).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Unknown date";
  }
}

export const PdfCard: React.FC<PdfCardProps> = ({ pdf, onView, onDelete, deleting = false }) => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  const openPdf = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (deleting) return;
    onView(pdf);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") openPdf(e);
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-lg border bg-background transition-all duration-200 hover:shadow-xl hover:scale-[1.01] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 relative",
        deleting && "opacity-50 pointer-events-none"
      )}
      onClick={openPdf}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open ${normalizeName(pdf.name)} (PDF)`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {(loading || deleting) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
            <DotLottieReact
              src="https://lottie.host/c089048a-e098-482b-bedd-77f6afa685f8/9UTxvvWMSo.lottie"
              loop
              autoplay
              style={{ width: "200px", height: "200px" }}
            />
          </div>
        )}

        {/* Delete button (top-right) */}
        {onDelete && !deleting && (
          <button
            type="button"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(String(pdf.id));
            }}
            className="absolute right-2 top-2 z-20 rounded p-2 bg-white/90 shadow hover:bg-white transition md:opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-8 w-8 text-red-600" />
          </button>
        )}

        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800" />

        {/* Document thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/docs.png"
            alt={normalizeName(pdf.name) || "Document"}
            className={cn(
              "h-40 w-40 object-contain opacity-90 transition-transform duration-200 group-hover:scale-105",
              loading ? "opacity-0" : "opacity-100"
            )}
            loading="lazy"
            draggable={false}
            onLoad={() => setTimeout(() => setLoading(false), 500)}
          />
        </div>

        <div className="absolute left-3 top-3 flex gap-2">
          {pdf.entity && (
            <Badge
              variant="outline"
              className="text-[15px] max-w-[160px] truncate border-none text-gray-500"
              title={pdf.entity}
            >
              {pdf.entity}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-semibold truncate text-gray-600">
            {truncateFileName(pdf.name)}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatTimestamp(pdf.timestamp)}
            </span>
            <span className="select-none">•</span>
            <span>{pdf.size || "Unknown size"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PdfCard;
