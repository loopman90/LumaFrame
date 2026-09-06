export type MediaKind = "image" | "gif" | "video";

export interface MediaItem {
  id: string;
  path: string;
  name: string;
  sourceId: string;
  type: MediaKind;
  extension: string;
  modifiedTime?: number;
  createdTime?: number;
  captureTime?: number;
  width?: number;
  height?: number;
  duration?: number;
  favorite?: boolean;
  hidden?: boolean;
  showCount?: number;
  lastShown?: number;
}
