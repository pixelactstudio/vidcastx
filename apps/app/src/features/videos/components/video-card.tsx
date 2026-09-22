import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Copy,
  Download,
  Eye,
  EyeOff,
  FolderInput,
  Globe,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vidcastx/ui/components/dropdown-menu";

import { VideoThumb } from "#app/components/video-thumb";

interface VideoCardVideo {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  status: string;
  duration: number | null;
  resolution: string | null;
  createdAt: string | Date;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}

function formatRelative(date: string | Date) {
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}d ago`;
  return d.toLocaleDateString();
}

function VisibilityIcon({ visibility }: { visibility: string }) {
  if (visibility === "public") return <Globe className="h-3 w-3" />;
  if (visibility === "unlisted") return <Eye className="h-3 w-3" />;
  return <EyeOff className="h-3 w-3" />;
}

export function VideoCard({ video }: { video: VideoCardVideo }) {
  const duration = formatDuration(video.duration);

  return (
    <div className="group flex flex-col gap-3">
      <Link to="/dashboard/videos/$videoId" params={{ videoId: video.id }} className="block">
        <VideoThumb
          poster={video.thumbnailUrl}
          preview={video.previewUrl}
          title={video.title}
          status={video.status}
          duration={duration}
        />
      </Link>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Link to="/dashboard/videos/$videoId" params={{ videoId: video.id }} className="block">
            <h3 className="line-clamp-2 text-sm leading-snug font-semibold group-hover:underline">{video.title}</h3>
          </Link>
          {video.description && <p className="text-muted-foreground line-clamp-1 text-xs">{video.description}</p>}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <VisibilityIcon visibility={video.visibility} />
              <span className="capitalize">{video.visibility}</span>
            </span>
            <span>•</span>
            <span>{formatRelative(video.createdAt)}</span>
            {video.resolution && (
              <>
                <span>•</span>
                <span className="font-mono">{video.resolution}</span>
              </>
            )}
          </div>
        </div>

        <VideoCardMenu videoId={video.id} />
      </div>
    </div>
  );
}

function VideoCardMenu({ videoId: _videoId }: { videoId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="Video actions"
          />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Pencil className="h-4 w-4" />
            Edit metadata
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FolderInput className="h-4 w-4" />
            Move to folder
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Share2 className="h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LinkIcon className="h-4 w-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="h-4 w-4" />
            Download source
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BarChart3 className="h-4 w-4" />
            Analytics
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Eye className="h-4 w-4" />
            View public page
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 className="h-4 w-4" />
          Move to trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
