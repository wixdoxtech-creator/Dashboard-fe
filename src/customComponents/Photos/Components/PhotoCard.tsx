// PhotoCard.tsx
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Trash2 } from "lucide-react";

interface PhotoCardProps {
  id: string;
  name?: string;
  imageUrl?: string | null;
  timestamp: Date | null;
  onClick: () => void;
  onDelete?: (id: string) => void;    
  loading?: boolean;
  deleting?: boolean;                
  className?: string;
}

const PhotoCard = ({
  id,
  name,
  imageUrl,
  timestamp,
  onClick,
  onDelete,
  loading = false,
  deleting = false,
  className,
}: PhotoCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => { setImageLoaded(false); }, [imageUrl]);

  return (
    <Card
      className={cn(
        "overflow-hidden border rounded-lg transition-all duration-300 hover:shadow-lg cursor-pointer h-full group relative",
        deleting && "opacity-50 pointer-events-none",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 aspect-square relative overflow-hidden">
        {/* per-card loader */}
        {(loading || deleting) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90">
            <DotLottieReact
              src="https://lottie.host/c089048a-e098-482b-bedd-77f6afa685f8/9UTxvvWMSo.lottie"
              loop
              autoplay
              style={{ width: 200, height: 200 }}
            />
          </div>
        )}

        {/* delete button (top-right) */}
        {onDelete && !deleting && (
          <button
            type="button"
            title="Delete"
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            className="absolute right-2 top-2 z-10 rounded p-2 bg-white/90 shadow hover:bg-white transition md:opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-8 w-8 text-red-500" />
          </button>
        )}

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name ?? `Photo ${id}`}
            onLoad={() => setTimeout(() => setImageLoaded(true), 20)}
            className={cn(
              "object-cover w-full h-full transition-opacity duration-500",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <img
              src="/photothumbnail.png"
              alt="Photos"
              className="h-60 w-60 object-contain opacity-90 transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2 text-xs text-muted-foreground">
        {timestamp ? format(new Date(timestamp), "MMM d, yyyy, h:mm a") : ""}
      </CardFooter>
    </Card>
  );
};

export default PhotoCard;
