import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { Play } from "lucide-react";

interface VideoCardProps {
  id: string;
  thumbnailUrl: string;
  title: string;
  timestamp: Date;
  onClick: () => void;
  className?: string;
  aspect?: "square" | "video"; // ← new
}

const VideoCard = ({
  id,
  thumbnailUrl,
  title,
  timestamp,
  onClick,
  className,
  aspect = "square", // ← default to square to match image cards
}: VideoCardProps) => {
  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-video";

  return (
    <Card
      className={cn(
        "overflow-hidden border rounded-lg transition-all duration-100 hover:shadow-lg cursor-pointer h-full",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-0 relative overflow-hidden", aspectClass)}>
        <img
          src={thumbnailUrl}
          alt={`Video ${id} - ${title}`}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Play className="w-12 h-12 text-white" />
        </div>
      </CardContent>

      {/* Keep footer heights consistent to avoid tiny text causing layout jitter */}
      <CardFooter className="flex flex-col items-start p-3 min-h-[64px]">
        <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {format(timestamp, "MMM d, yyyy, h:mm a")}
        </p>
      </CardFooter>
    </Card>
  );
};

export default VideoCard;
