export interface PlaylistItem {
  id: string;
  mediaId: string;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
}
