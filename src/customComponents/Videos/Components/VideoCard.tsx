import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface VideoCardProps {
  id: string;
  title?: string;
  thumbnailUrl?: string;
  timestamp: Date | string | number | null;
  onClick: () => void;
  onDelete?: (id: string) => void;  
  deleting?: boolean;          
  className?: string;
}

export default function VideoCard({
  id,
  title,
  thumbnailUrl = "/video.png",
  timestamp,
  onClick,
  onDelete,
  deleting = false,
  className
}: VideoCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => setImgLoaded(false), [thumbnailUrl]);

  return (
    <Card
      className={cn(
        "overflow-hidden border rounded-lg transition-all duration-300 hover:shadow-lg h-full group relative",
        deleting && "opacity-50 pointer-events-none",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 aspect-video relative overflow-hidden bg-black">
        {/* Delete button */}
        {onDelete && !deleting && (
          <button
  type="button"
  title="Delete"
  onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
  className="
    absolute right-2 top-2
    z-10                               
    rounded p-2 bg-white/90 shadow hover:bg-white transition
    md:opacity-0 md:group-hover:opacity-100 
  "
>
  <Trash2 className="h-8 w-8 text-red-600" />
</button>

        )}

        {/* Thumbnail */}
        <img
          src={thumbnailUrl}
          alt={title ?? `Video ${id}`}
          onLoad={() => setTimeout(() => setImgLoaded(true), 20)}
          className={cn(
            "object-cover w-full h-full transition-opacity duration-500",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Deleting overlay */}
        {deleting && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
            <span className="text-white text-sm">Deleting…</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2 text-xs text-muted-foreground">
        <div className="truncate w-full">
          <div className="font-medium text-foreground/80 truncate">{title}</div>
          {timestamp ? (
            <div>{format(new Date(timestamp), "MMM d, yyyy, h:mm a")}</div>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
