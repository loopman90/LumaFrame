import type { MediaSource } from "../models/MediaSource";
import { createId } from "../utils/id";

export class SourceService {
  createVaultSource(path: string): MediaSource {
    return {
      id: createId("source"),
      name: path ? folderName(path) : "Vault",
      type: "vault",
      path,
      includeSubfolders: true,
      enabled: true
    };
  }

  createExternalSource(path: string): MediaSource {
    return {
      id: createId("source"),
      name: folderName(path),
      type: "external",
      path,
      includeSubfolders: true,
      enabled: true
    };
  }
}

function folderName(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] ?? "Media Source" : "Media Source";
}
