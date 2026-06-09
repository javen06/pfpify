export const PRESETS = {
  github: {
    name: "GitHub",
    defaultExportCap: 2999,
    maxBytes: 1_000_000,
    note: "GitHub recommends about 500 × 500 for display. The 1 MB file limit and 2999 × 2999 export cap are separate constraints.",
    downloadLabel: "Download GitHub JPEG",
    fileName: "github-profile.jpg",
  },
  linkedin: {
    name: "LinkedIn",
    defaultExportCap: 1200,
    maxBytes: 8_000_000,
    note: "LinkedIn allows a larger file budget, but this preset uses a display-optimised 1200 × 1200 export cap.",
    downloadLabel: "Download LinkedIn JPEG",
    fileName: "linkedin-profile.jpg",
  },
  general: {
    name: "General",
    defaultExportCap: 2000,
    maxBytes: 2_000_000,
    note: "A practical 2000 × 2000 export cap with a 2 MB file limit for broad profile-picture compatibility.",
    downloadLabel: "Download Optimised JPEG",
    fileName: "optimised-profile.jpg",
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
    description: "Keeps JPEG quality at 0.98 and reduces dimensions if needed.",
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
