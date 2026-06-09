# Profile Pic Optimiser

A client-side React app that center-crops profile pictures and finds the
largest square JPEG that stays within a selected platform preset.

## Presets

- GitHub: 2999 × 2999 default export cap and strictly under 1 MB
- LinkedIn: 1200 × 1200 default export cap and strictly under 8 MB
- General: 2000 × 2000 default export cap and strictly under 2 MB

The optimiser prioritises output dimensions, then binary-searches JPEG quality
from 0.6 to 0.98. Transparent pixels are filled white before JPEG conversion.
Maximum resolution mode allows a custom 500–2999 export cap while retaining
the selected platform's file-size limit. All processing happens locally in the
browser.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
