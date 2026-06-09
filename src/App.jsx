import { useEffect, useRef, useState } from "react";

const MIN_QUALITY = 0.6;
const MAX_QUALITY = 0.98;
const QUALITY_SEARCH_STEPS = 10;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const PRESETS = {
  github: {
    name: "GitHub",
    defaultExportCap: 2999,
    maxBytes: 1_000_000,
    note: "GitHub recommends about 500 × 500 for display. The default export cap remains below 3000 × 3000 while enforcing the 1 MB file-size limit.",
    downloadLabel: "Download GitHub JPEG",
    fileName: "github-profile.jpg",
  },
  linkedin: {
    name: "LinkedIn",
    defaultExportCap: 1200,
    maxBytes: 8_000_000,
    note: "The 1200 × 1200 export cap is a practical profile-photo choice, not a platform hard maximum. This preset is not intended for banner images.",
    downloadLabel: "Download LinkedIn JPEG",
    fileName: "linkedin-profile.jpg",
  },
  general: {
    name: "General",
    defaultExportCap: 2000,
    maxBytes: 2_000_000,
    note: "A practical 2000 × 2000 export cap with a 2 MB file-size limit for broad profile-picture compatibility.",
    downloadLabel: "Download Optimised JPEG",
    fileName: "optimised-profile.jpg",
  },
};

function formatBytes(bytes) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("The browser could not encode this image."));
        }
      },
      "image/jpeg",
      quality,
    );
  });
}

function drawSquareCrop(canvas, image, dimension) {
  const context = canvas.getContext("2d");
  const sourceSize = Math.min(image.width, image.height);
  const sourceX = (image.width - sourceSize) / 2;
  const sourceY = (image.height - sourceSize) / 2;

  canvas.width = dimension;
  canvas.height = dimension;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, dimension, dimension);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    dimension,
    dimension,
  );
}

async function bestJpegForDimension(canvas, image, dimension, maxBytes) {
  drawSquareCrop(canvas, image, dimension);

  const highQualityBlob = await canvasToJpeg(canvas, MAX_QUALITY);
  if (highQualityBlob.size < maxBytes) {
    return { blob: highQualityBlob, quality: MAX_QUALITY, dimension };
  }

  const lowQualityBlob = await canvasToJpeg(canvas, MIN_QUALITY);
  if (lowQualityBlob.size >= maxBytes) {
    return null;
  }

  let low = MIN_QUALITY;
  let high = MAX_QUALITY;
  let bestBlob = lowQualityBlob;
  let bestQuality = MIN_QUALITY;

  for (let index = 0; index < QUALITY_SEARCH_STEPS; index += 1) {
    const quality = (low + high) / 2;
    const candidate = await canvasToJpeg(canvas, quality);

    if (candidate.size < maxBytes) {
      bestBlob = candidate;
      bestQuality = quality;
      low = quality;
    } else {
      high = quality;
    }
  }

  return { blob: bestBlob, quality: bestQuality, dimension };
}

async function optimiseImage(canvas, image, preset) {
  const originalSquareSize = Math.floor(Math.min(image.width, image.height));
  const maximumDimension = Math.min(originalSquareSize, preset.exportCap);

  if (maximumDimension < 1) {
    throw new Error("The selected image has invalid dimensions.");
  }

  const maximumResult = await bestJpegForDimension(
    canvas,
    image,
    maximumDimension,
    preset.maxBytes,
  );

  if (maximumResult) {
    return maximumResult;
  }

  let low = 1;
  let high = maximumDimension - 1;
  let bestResult = null;

  while (low <= high) {
    const dimension = Math.floor((low + high) / 2);
    const result = await bestJpegForDimension(
      canvas,
      image,
      dimension,
      preset.maxBytes,
    );

    if (result) {
      bestResult = result;
      low = dimension + 1;
    } else {
      high = dimension - 1;
    }
  }

  if (!bestResult) {
    throw new Error("The image could not be compressed below this preset's limit.");
  }

  return bestResult;
}

export default function App() {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const processingIdRef = useRef(0);
  const [selectedPreset, setSelectedPreset] = useState("github");
  const [maximumResolutionMode, setMaximumResolutionMode] = useState(false);
  const [customExportCap, setCustomExportCap] = useState(2999);
  const [sourceFile, setSourceFile] = useState(null);
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const preset = PRESETS[selectedPreset];

  useEffect(() => {
    return () => beforeUrl && URL.revokeObjectURL(beforeUrl);
  }, [beforeUrl]);

  useEffect(() => {
    return () => afterUrl && URL.revokeObjectURL(afterUrl);
  }, [afterUrl]);

  async function processFile(
    file,
    presetKey,
    exportCap,
    updateSource = true,
  ) {
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    const processingId = processingIdRef.current + 1;
    processingIdRef.current = processingId;
    const activePreset = {
      ...PRESETS[presetKey],
      exportCap,
    };

    setIsProcessing(true);
    setError("");
    setResult(null);
    setAfterUrl("");

    if (updateSource) {
      setSourceFile(file);
      setBeforeUrl(URL.createObjectURL(file));
    }

    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      let optimised;

      try {
        optimised = await optimiseImage(
          canvasRef.current,
          bitmap,
          activePreset,
        );
      } finally {
        bitmap.close();
      }

      if (processingId !== processingIdRef.current) return;
      if (optimised.blob.size >= activePreset.maxBytes) {
        throw new Error("The output did not stay strictly below the selected limit.");
      }

      setAfterUrl(URL.createObjectURL(optimised.blob));
      setResult({
        ...optimised,
        platform: activePreset.name,
        exportCap: activePreset.exportCap,
        maxBytes: activePreset.maxBytes,
      });
    } catch (processingError) {
      if (processingId === processingIdRef.current) {
        setError(processingError.message || "The image could not be processed.");
      }
    } finally {
      if (processingId === processingIdRef.current) {
        setIsProcessing(false);
      }
    }
  }

  function selectPreset(presetKey) {
    setSelectedPreset(presetKey);
    if (sourceFile) {
      const exportCap = maximumResolutionMode
        ? customExportCap
        : PRESETS[presetKey].defaultExportCap;
      processFile(sourceFile, presetKey, exportCap, false);
    }
  }

  function toggleMaximumResolution(event) {
    const enabled = event.target.checked;
    setMaximumResolutionMode(enabled);

    if (sourceFile) {
      const exportCap = enabled ? customExportCap : preset.defaultExportCap;
      processFile(sourceFile, selectedPreset, exportCap, false);
    }
  }

  function applyCustomExportCap() {
    if (sourceFile && maximumResolutionMode) {
      processFile(sourceFile, selectedPreset, customExportCap, false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    const exportCap = maximumResolutionMode
      ? customExportCap
      : preset.defaultExportCap;
    processFile(event.dataTransfer.files[0], selectedPreset, exportCap);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Local image processing</p>
        <h1>Profile Pic Optimiser</h1>
        <p className="intro">
          Upload once, choose a platform, and export a clean square profile
          image within platform limits.
        </p>
      </section>

      <section className="preset-section" aria-labelledby="preset-heading">
        <div className="section-heading">
          <div>
            <span>Step 1</span>
            <h2 id="preset-heading">Choose a platform</h2>
          </div>
          <p>JPEG · square crop · maximum safe resolution</p>
        </div>

        <div className="preset-options">
          {Object.entries(PRESETS).map(([key, option]) => (
            <button
              key={key}
              type="button"
              className={`preset-button ${selectedPreset === key ? "active" : ""}`}
              aria-pressed={selectedPreset === key}
              onClick={() => selectPreset(key)}
            >
              <strong>{option.name}</strong>
              <span>
                {option.defaultExportCap} × {option.defaultExportCap} export cap
                {" · "}under {formatBytes(option.maxBytes)}
              </span>
            </button>
          ))}
        </div>
        <p className="preset-note">{preset.note}</p>
        <p className="preset-explanation">
          File-size limit and image dimensions are separate. A platform can
          allow a larger file but still be better served by a smaller
          display-optimised image.
        </p>
        <p className="preset-explanation">
          Some platforms allow larger file sizes but display profile photos at
          smaller sizes. This app uses practical export caps for clean
          profile-photo clarity.
        </p>

        <div className="advanced-setting">
          <label className="mode-toggle">
            <input
              type="checkbox"
              checked={maximumResolutionMode}
              onChange={toggleMaximumResolution}
            />
            <span>
              <strong>Use maximum resolution mode</strong>
              <small>
                Choose your own export cap while keeping the {preset.name} file-size
                limit.
              </small>
            </span>
          </label>

          {maximumResolutionMode && (
            <div className="resolution-control">
              <div>
                <label htmlFor="export-cap">Manual export cap</label>
                <output htmlFor="export-cap">
                  {customExportCap} × {customExportCap}
                </output>
              </div>
              <input
                id="export-cap"
                type="range"
                min="500"
                max="2999"
                step="1"
                value={customExportCap}
                onChange={(event) =>
                  setCustomExportCap(Number(event.target.value))
                }
                onPointerUp={applyCustomExportCap}
                onKeyUp={applyCustomExportCap}
              />
              <div className="range-labels">
                <span>500</span>
                <span>2999</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className="drop-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="drop-step">
          <span>Step 2</span>
          <strong>Upload image</strong>
        </div>
        <input
          ref={inputRef}
          className="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const exportCap = maximumResolutionMode
              ? customExportCap
              : preset.defaultExportCap;
            processFile(event.target.files[0], selectedPreset, exportCap);
          }}
        />
        <div className="upload-mark" aria-hidden="true">
          +
        </div>
        <h2>{isProcessing ? "Finding the best output..." : "Choose an image"}</h2>
        <p>Drop a JPG, PNG, or WebP here, or select one from your device.</p>
        <button
          type="button"
          className="select-button"
          disabled={isProcessing}
          onClick={() => inputRef.current?.click()}
        >
          Select image
        </button>
      </section>

      {error && <p className="error-message">{error}</p>}

      {beforeUrl && (
        <section className="review-section" aria-live="polite">
          <div className="review-heading">
            <span>Step 3</span>
            <h2>Review output</h2>
          </div>
          <div className="results">
            <article className="preview-card">
            <div className="preview-heading">
              <div>
                <span>Before</span>
                <strong>{sourceFile?.name}</strong>
              </div>
              <span className="size-label">
                {formatBytes(sourceFile?.size || 0)}
              </span>
            </div>
            <div className="image-frame original-frame">
              <img src={beforeUrl} alt="Original upload preview" />
            </div>
            </article>

            <article className="preview-card">
            <div className="preview-heading">
              <div>
                <span>After · {preset.name}</span>
                <strong>
                  {result
                    ? `${result.dimension} × ${result.dimension} JPEG`
                    : "Optimising output"}
                </strong>
              </div>
              <span className="size-label">
                {result ? formatBytes(result.blob.size) : "Processing"}
              </span>
            </div>
            <div className="image-frame">
              {afterUrl ? (
                <img src={afterUrl} alt={`Optimised ${preset.name} preview`} />
              ) : (
                <div className="processing-placeholder">Working…</div>
              )}
            </div>
            {afterUrl && (
              <div className="avatar-preview">
                <img src={afterUrl} alt="Circular profile avatar preview" />
                <div>
                  <span>Avatar preview</span>
                  <small>Approximate circular profile display</small>
                </div>
              </div>
            )}
            {result && (
              <dl className="result-details">
                <div>
                  <dt>Platform</dt>
                  <dd>{result.platform}</dd>
                </div>
                <div>
                  <dt>Export cap used</dt>
                  <dd>{result.exportCap} × {result.exportCap}</dd>
                </div>
                <div>
                  <dt>Final dimensions</dt>
                  <dd>{result.dimension} × {result.dimension}</dd>
                </div>
                <div>
                  <dt>File-size limit</dt>
                  <dd>Under {formatBytes(result.maxBytes)}</dd>
                </div>
                <div>
                  <dt>Final file size</dt>
                  <dd>{formatBytes(result.blob.size)}</dd>
                </div>
                <div>
                  <dt>JPEG quality</dt>
                  <dd>{result.quality.toFixed(2)}</dd>
                </div>
              </dl>
            )}
            </article>
          </div>
        </section>
      )}

      {afterUrl && result && (
        <section className="download-panel">
          <div className="download-step">
            <span>Step 4</span>
          </div>
          <div>
            <span>
              Ready for {result.platform} · {result.dimension}×{result.dimension} ·{" "}
              {formatBytes(result.blob.size)} · JPEG quality{" "}
              {result.quality.toFixed(2)}
            </span>
            <p>
              Within limit:{" "}
              <strong>{result.blob.size < result.maxBytes ? "Yes" : "No"}</strong>
            </p>
          </div>
          <a
            className="download-button"
            href={afterUrl}
            download={preset.fileName}
          >
            {preset.downloadLabel}
          </a>
        </section>
      )}

      <canvas ref={canvasRef} className="hidden-canvas" />

      <footer>
        Images are processed locally in your browser and never uploaded.
      </footer>
    </main>
  );
}
