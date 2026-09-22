import { memo, useCallback } from "react";
import { Globe, Lock, Pin } from "lucide-react";

import { VideoThumb } from "#app/components/video-thumb";

import type { VideoSummary, VideoVisibility } from "../types";
import { MediaCardShell } from "./media-card-shell";
import { VideoActionsMenu } from "./video-actions-menu";

interface VideoCardProps {
  video: VideoSummary;
  onOpen?: (id: string) => void;
  onTogglePin: (video: VideoSummary) => void;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}

function formatRelative(iso: string | Date): string {
  const time = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const diffSec = (Date.now() - time) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604_800) return `${Math.floor(diffSec / 86_400)}d ago`;
  return new Date(time).toLocaleDateString();
}

function VisibilityIcon({ visibility }: { visibility: VideoVisibility }) {
  if (visibility === "public") return <Globe className="size-3" />;
  return <Lock className="size-3" />;
}

function VideoCardImpl({ video, onOpen, onTogglePin }: VideoCardProps) {
  const { id, title, duration, visibility, createdAt, pinned, status, thumbnailUrl, previewUrl } = video;
  const formattedDuration = formatDuration(duration);

  const handleOpen = useCallback(() => onOpen?.(id), [onOpen, id]);
  const handleTogglePin = useCallback(() => {
    onTogglePin(video);
  }, [onTogglePin, video]);

  const thumb = (
    <VideoThumb
      poster={thumbnailUrl}
      preview={previewUrl}
      title={title}
      status={status}
      duration={formattedDuration}
      overlay={
        pinned ? (
          <span
            className="bg-background/80 absolute top-1.5 right-1.5 inline-flex size-5 items-center justify-center"
            aria-label="Pinned"
          >
            <Pin className="size-3" />
          </span>
        ) : undefined
      }
    />
  );

  const titleNode = <h3 className="line-clamp-2 text-sm leading-snug font-semibold group-hover:underline">{title}</h3>;

  const meta = (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1">
        <VisibilityIcon visibility={visibility} />
        <span className="capitalize">{visibility}</span>
      </span>
      <span>•</span>
      <span>{formatRelative(createdAt)}</span>
    </div>
  );

  return (
    <MediaCardShell
      thumb={thumb}
      title={titleNode}
      meta={meta}
      actions={<VideoActionsMenu pinned={pinned} onTogglePin={handleTogglePin} />}
      onOpen={handleOpen}
    />
  );
}

export const VideoCard = memo(VideoCardImpl);
