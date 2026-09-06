import type { MediaKind } from "../models/MediaItem";

export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "svg"]);
export const GIF_EXTENSIONS = new Set(["gif"]);
export const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "m4v", "ogv", "mpeg", "mpg"]);
export const PROBABLE_VIDEO_EXTENSIONS = new Set([...VIDEO_EXTENSIONS, "mov"]);

export function normalizeExtension(path: string): string {
  const fileName = path.split(/[\\/]/).pop() ?? path;
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

export function mediaKindForPath(path: string): MediaKind | null {
  const extension = normalizeExtension(path);
  if (GIF_EXTENSIONS.has(extension)) return "gif";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (PROBABLE_VIDEO_EXTENSIONS.has(extension)) return "video";
  return null;
}

export function isSupportedMediaPath(path: string): boolean {
  return mediaKindForPath(path) !== null;
}

export function canProbablyPlayVideo(extension: string): boolean {
  if (typeof document === "undefined") return VIDEO_EXTENSIONS.has(extension);
  const video = createEl("video");
  const mime = videoMimeForExtension(extension);
  return mime ? video.canPlayType(mime) !== "" : false;
}

export function videoMimeForExtension(extension: string): string | null {
  switch (extension.toLowerCase()) {
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogv":
      return "video/ogg";
    case "mpeg":
    case "mpg":
      return "video/mpeg";
    case "mov":
      return "video/quicktime";
    default:
      return null;
  }
}
