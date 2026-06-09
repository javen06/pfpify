export const PRESETS = {
  github: {
    name: "GitHub",
    defaultExportCap: 1000,
    maxBytes: 1_000_000,
    fileStem: "github-profile",
  },
  linkedin: {
    name: "LinkedIn",
    defaultExportCap: 1200,
    maxBytes: 8_000_000,
    fileStem: "linkedin-profile",
  },
  twitter: {
    name: "Twitter/X",
    defaultExportCap: 400,
    maxBytes: 2_000_000,
    fileStem: "twitter-profile",
  },
  discord: {
    name: "Discord",
    defaultExportCap: 1024,
    maxBytes: 8_000_000,
    fileStem: "discord-profile",
  },
  general: {
    name: "General",
    defaultExportCap: 2000,
    maxBytes: 2_000_000,
    fileStem: "optimised-profile",
  },
};

export const PRIORITIES = {
  balanced: {
    name: "Balanced",
    description: "Keeps JPEG quality near 0.82 or higher where possible.",
  },
  resolution: {
    name: "Max resolution",
    description: "Prioritises the largest dimensions, then JPEG quality.",
  },
  quality: {
    name: "Max quality",
    description: "Keeps JPEG quality at 0.95 and reduces dimensions if needed.",
  },
};

export const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function formatBytes(bytes) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}
