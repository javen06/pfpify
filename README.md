# Pfpify

Browser-only profile picture cropper and optimiser for platform-ready avatars.

Pfpify lets you upload an image, position it with drag and zoom controls,
preview the circular avatar crop, and export a square JPEG or PNG for GitHub,
LinkedIn, X, Discord, or general use.

Images are processed locally in the browser and are never uploaded to a server.

**Live app:** [pfpify.vercel.app](https://pfpify.vercel.app/)

**Repository:** [github.com/javen06/pfpify](https://github.com/javen06/pfpify)

## Features

- Browser-only image processing with the Canvas API
- Drag-to-position square crop editor
- Zoom controls from `1x` to `4x`
- Circular avatar preview
- JPEG and PNG export
- Platform presets for GitHub, LinkedIn, X, Discord, and general avatars
- Automatic file-size and dimension fitting
- Responsive GitHub-inspired dark interface
- Reusable `AvatarCropper` React component
- No backend, accounts, analytics, or image uploads

## How It Works

1. Choose a platform preset.
2. Upload a JPG, PNG, or WebP image.
3. Drag and zoom the image inside the crop editor.
4. Preview the approximate circular avatar crop.
5. Choose JPEG or PNG.
6. Download the optimised square image.

The downloaded image remains square. Platforms such as GitHub and LinkedIn
apply their own circular display treatment.

## Platform Presets

| Platform | Practical export cap | File limit |
| --- | ---: | ---: |
| GitHub | 1000 × 1000 | Under 1 MB |
| LinkedIn | 1200 × 1200 | Under 8 MB |
| Twitter/X | 400 × 400 | Under 2 MB |
| Discord | 1024 × 1024 | Under 8 MB |
| General | 2000 × 2000 | Under 2 MB |

These are practical profile-image export caps used by Pfpify. They should not
be interpreted as official hard limits for every platform.

## Privacy

Pfpify performs all image operations locally using browser APIs:

- `createImageBitmap`
- HTML Canvas
- `canvas.toBlob`
- Object URLs

The selected image is not sent to Vercel or any other server. The deployed site
serves only the application files.

## Image Optimisation

### JPEG

JPEG export fills transparent pixels with white and searches for a valid square
output under the selected file limit.

Pfpify uses binary search across output dimensions and JPEG compression
quality. The quality range is `0.50` to `0.95`.

Available priorities:

- **Balanced:** Finds a strong tradeoff between output size and JPEG
  compression.
- **Max resolution:** Prioritises the largest output dimensions.
- **Max quality:** Prioritises lower JPEG compression, reducing dimensions when
  needed.

JPEG quality is an encoder compression setting, not a sharpness score. A
tightly zoomed crop can be easier to compress while still containing less
original detail.

### PNG

PNG export:

- Preserves transparency
- Does not use JPEG-style quality compression
- Reduces output dimensions until the image fits the selected byte limit
- Warns when a useful PNG output cannot fit and recommends JPEG instead

## Tech Stack

- React
- Vite
- JavaScript
- HTML Canvas API
- CSS
- Vercel

No image-processing libraries or backend services are used.

## Local Development

### Requirements

- Node.js `20.19+` or `22.12+`
- npm
- A modern browser with Canvas and `createImageBitmap` support

### Installation

```bash
git clone https://github.com/javen06/pfpify.git
cd pfpify
npm install
```

### Start the Development Server

```bash
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

## Reusable Component

Pfpify includes a reusable `AvatarCropper` component.

```jsx
import { AvatarCropper } from "./lib/index.js";

export default function App() {
  return <AvatarCropper platform="github" />;
}
```

### Props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `platform` | `"github" \| "linkedin" \| "twitter" \| "discord" \| "general"` | `"github"` | Initial platform preset |
| `customPreset` | `{ maxPx: number, maxBytes: number }` | `undefined` | Overrides the initial platform limits |
| `defaultFormat` | `"jpeg" \| "png"` | `"jpeg"` | Initial export format |
| `showPreview` | `boolean` | `true` | Shows or hides the circular preview |
| `onExport` | `(blob, metadata) => void` | `undefined` | Receives completed export data |
| `className` | `string` | `undefined` | Adds a class to the component root |

Example:

```jsx
import { AvatarCropper } from "./lib/index.js";

function ProfileImageTool() {
  function handleExport(blob, metadata) {
    console.log(metadata);
  }

  return (
    <AvatarCropper
      platform="discord"
      defaultFormat="png"
      showPreview
      onExport={handleExport}
    />
  );
}
```

Export metadata:

```js
{
  width,
  height,
  sizeBytes,
  format,
  platform,
  maxPx,
  maxBytes
}
```

The component currently uses the CSS classes defined in `src/styles.css`.
Include those styles when reusing it outside the existing application.

## Project Structure

```text
src/
├── components/
│   ├── AvatarPreview.jsx
│   ├── CropEditor.jsx
│   ├── OutputInfoPopover.jsx
│   └── PlatformSelector.jsx
├── lib/
│   ├── AvatarCropper.jsx
│   ├── cropMath.js
│   ├── imageCanvas.js
│   ├── index.js
│   ├── optimiseImage.js
│   └── presets.js
├── App.jsx
├── main.jsx
└── styles.css
```

### Key Modules

- `AvatarCropper.jsx` owns the upload, crop, preview, optimisation, format, and
  download workflow.
- `cropMath.js` contains crop, preview-position, and drag-overflow
  calculations.
- `imageCanvas.js` draws square crops and encodes Canvas output as JPEG or PNG.
- `optimiseImage.js` implements dimension and JPEG quality searches.
- `presets.js` contains platform presets and formatting helpers.
- `index.js` exposes the reusable library API.

## Deployment

Pfpify is deployed on Vercel:

[https://pfpify.vercel.app/](https://pfpify.vercel.app/)

For another Vercel deployment:

1. Import the GitHub repository into Vercel.
2. Select the Vite framework preset.
3. Use `npm run build` as the build command.
4. Use `dist` as the output directory.

No environment variables or backend services are required.

## Current Limitations

- The crop is always square.
- The circular preview is approximate; each platform may render avatars
  differently.
- PNG files can remain large because PNG is lossless.
- Platform requirements may change over time.
- Very large source files may use significant browser memory.
