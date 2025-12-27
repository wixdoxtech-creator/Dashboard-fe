import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

const LightboxModal = ({
  isOpen,
  onClose,
  currentIndex,
  imageUrl,
  total,
  onPrev,
  onNext,
}: LightboxModalProps) => {
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrev();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNext();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-sm">
        <div className="relative flex flex-col w-full h-full">
          {/* Navigation buttons */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Image container */}
          <div className="flex-1 flex items-center justify-center p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Photo ${currentIndex + 1}`}
                className="max-h-[75vh] max-w-full object-contain"
              />
            ) : (
              <div className="text-white text-lg">No image</div>
            )}
          </div>

          {/* Footer info */}
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">{currentIndex + 1} / {total}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LightboxModal;
