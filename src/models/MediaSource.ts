export type MediaSourceType = "vault" | "external";

export interface MediaSource {
  id: string;
  name: string;
  type: MediaSourceType;
  path: string;
  includeSubfolders: boolean;
  enabled: boolean;
  unavailable?: boolean;
}
