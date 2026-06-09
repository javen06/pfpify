# Profile Pic Optimiser

A client-side React app that center-crops profile pictures and finds the
largest square JPEG that stays within a selected platform preset.

## Presets

- GitHub: 2999 × 2999 default export cap and strictly under 1 MB
- LinkedIn: 1200 × 1200 default export cap and strictly under 8 MB
- General: 2000 × 2000 default export cap and strictly under 2 MB

The optimiser prioritises output dimensions, then binary-searches JPEG quality
within the selected optimisation mode. Transparent pixels are filled white
before JPEG conversion.

Optimisation priorities:

- Balanced: largest output that can sustain about 0.82 JPEG quality or higher
- Max resolution: largest dimensions first, then highest available quality
- Max quality: keeps JPEG quality at 0.98 and reduces dimensions as needed

A custom 500–2999 export cap can override the practical preset cap while
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
