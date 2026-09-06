export function localFileUrl(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  if (!isAbsoluteLocalPath(normalized)) return path;
  const encoded = normalized
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")
    .replace(/^([A-Za-z])%3A/, "$1:");
  return normalized.startsWith("/") ? `file://${encoded}` : `file:///${encoded}`;
}

function isAbsoluteLocalPath(path: string): boolean {
  return path.startsWith("/") || /^[A-Za-z]:\//.test(path);
}
