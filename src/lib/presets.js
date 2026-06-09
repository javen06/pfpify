export const PLATFORMS = {
  github: {
    id: "github",
    label: "GitHub",
    maxPx: 1000,
    maxBytes: 1_000_000,
    displayLabel: "1000×1000 · 1 MB",
    fileStem: "github-profile",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    maxPx: 1200,
    maxBytes: 8_000_000,
    displayLabel: "1200×1200 · 8 MB",
    fileStem: "linkedin-profile",
  },
  twitter: {
    id: "twitter",
    label: "Twitter/X",
    maxPx: 400,
    maxBytes: 2_000_000,
    displayLabel: "400×400 · 2 MB",
    fileStem: "twitter-profile",
  },
  discord: {
    id: "discord",
    label: "Discord",
    maxPx: 1024,
    maxBytes: 8_000_000,
    displayLabel: "1024×1024 · 8 MB",
    fileStem: "discord-profile",
  },
  general: {
    id: "general",
    label: "General",
    maxPx: 2000,
    maxBytes: 2_000_000,
    displayLabel: "2000×2000 · 2 MB",
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
