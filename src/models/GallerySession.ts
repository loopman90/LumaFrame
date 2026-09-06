export interface GallerySession {
  instanceId: string;
  profileId: string;
  currentMediaId?: string;
  queue: string[];
  queuePosition: number;
  paused: boolean;
  targetWindow?: string;
  renderToken: number;
}
