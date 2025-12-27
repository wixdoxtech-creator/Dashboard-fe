import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { format } from "date-fns";
  
  export interface AudioTrack {
    id: number;
    title: string;
    attachment: string;
    timestamp: string | number | Date;
    number?: string;
    duration?: string;
    size?: string;
  }
  
  interface AudioPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    audio: AudioTrack | null;
  }
  
  const AudioPlayer = ({ isOpen, onClose, audio }: AudioPlayerProps) => {
    if (!audio) return null;
  
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden">
          <div className="flex flex-col bg-background rounded-xl shadow-xl">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle>{audio.title}</DialogTitle>
              </div>
            </DialogHeader>
  
            <div className="p-4">
              <audio
                src={audio.attachment}
                controls
                className="w-full"
                preload="auto"
              >
                Your browser does not support the audio element.
              </audio>
  
              <div className="mt-3 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {audio.number && <span>Number: {audio.number}</span>}
                  {audio.duration && <span>Duration: {audio.duration}</span>}
                  {audio.size && <span>Size: {audio.size}</span>}
                </div>
                {audio.timestamp && (
                  <p className="text-xs mt-1">
                    {format(new Date(audio.timestamp), "MMMM d, yyyy h:mm a")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default AudioPlayer;
  