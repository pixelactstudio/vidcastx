import { useEffect, useRef, useState } from "react";
import { FileVideo, Play } from "lucide-react";

import { cn } from "@vidcastx/ui/lib/utils";

interface VideoThumbProps {
  poster?: string | null;
  preview?: string | null;
  title: string;
  status?: string;
  duration?: string | null;
  overlay?: React.ReactNode;
}

export function VideoThumb({ poster, preview, title, status, duration, overlay }: VideoThumbProps) {
  const [hover, setHover] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (hover && preview) {
      node.currentTime = 0;
      void node.play().catch((error: unknown) => {
        console.warn("video preview failed to play", error);
      });
    } else {
      node.pause();
      node.currentTime = 0;
      setPreviewReady(false);
    }
  }, [hover, preview]);

  const handlePointerEnter = () => {
    if (globalThis.matchMedia("(hover: none)").matches) return;
    setHover(true);
  };

  return (
    <div
      className="bg-muted relative aspect-video w-full overflow-hidden"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => {
        setHover(false);
      }}
    >
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="from-muted to-muted-foreground/10 absolute inset-0 flex items-center justify-center bg-gradient-to-br">
          <FileVideo className="text-muted-foreground h-10 w-10" />
        </div>
      )}

      {preview && (
        <video
          ref={videoRef}
          src={preview}
          muted
          loop
          playsInline
          preload="none"
          onCanPlay={() => {
            setPreviewReady(true);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
            hover && previewReady ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200",
          hover && "bg-black/20",
        )}
      >
        <Play
          className={cn(
            "h-10 w-10 text-white drop-shadow-lg transition-opacity duration-200",
            hover && !previewReady ? "opacity-100" : "opacity-0",
          )}
          fill="white"
        />
      </div>

      {duration && (
        <span className="absolute right-1.5 bottom-1.5 bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {duration}
        </span>
      )}

      {status && status !== "ready" && (
        <span className="absolute top-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white uppercase">
          {status}
        </span>
      )}

      {overlay}
    </div>
  );
}
