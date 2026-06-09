# Pfpify

A client-side React app for cropping and exporting square profile images as
JPEG or PNG within practical platform presets.

## Presets

- GitHub: 1000 × 1000 export cap and strictly under 1 MB
- LinkedIn: 1200 × 1200 default export cap and strictly under 8 MB
- Twitter/X: 400 × 400 export cap and strictly under 2 MB
- Discord: 1024 × 1024 export cap and strictly under 8 MB
- General: 2000 × 2000 default export cap and strictly under 2 MB

JPEG export searches quality from 0.5 to 0.95 within the selected optimisation
mode. PNG export stays lossless and reduces dimensions until it fits.

Optimisation priorities:

- Balanced: largest output that can sustain about 0.82 JPEG quality or higher
- Max resolution: largest dimensions first, then highest available quality
- Max quality: keeps JPEG quality at 0.95 and reduces dimensions as needed

A custom 400–2999 export cap can override the practical preset cap while
retaining the selected platform's file limit. All processing happens locally
in the browser.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
