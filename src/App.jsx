import { useEffect, useRef, useState } from "react";

import AvatarPreview from "./components/AvatarPreview";
import CropEditor from "./components/CropEditor";
import OutputInfoPopover from "./components/OutputInfoPopover";
import PlatformSelector from "./components/PlatformSelector";
import { getEditorOverflow } from "./lib/cropMath";
import { optimiseImage } from "./lib/optimiseImage";
import { ACCEPTED_TYPES, PRESETS, formatBytes } from "./lib/presets";

export default function App() {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const editorRef = useRef(null);
  const processingIdRef = useRef(0);
  const cropDebounceRef = useRef(null);
  const dragRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [selectedPreset, setSelectedPreset] = useState("github");
  const [priority, setPriority] = useState("balanced");
  const [maximumResolutionMode, setMaximumResolutionMode] = useState(false);
  const [customExportCap, setCustomExportCap] = useState(2999);
  const [crop, setCrop] = useState({ zoom: 1, x: 0, y: 0 });
  const [sourceDimensions, setSourceDimensions] = useState({
    width: 1,
    height: 1,
  });
  const [sourceFile, setSourceFile] = useState(null);
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOutputPending, setIsOutputPending] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [error, setError] = useState("");

  const preset = PRESETS[selectedPreset];

  useEffect(() => {
    return () => beforeUrl && URL.revokeObjectURL(beforeUrl);
  }, [beforeUrl]);

  useEffect(() => {
    return () => afterUrl && URL.revokeObjectURL(afterUrl);
  }, [afterUrl]);

  useEffect(() => {
    return () => {
      clearTimeout(cropDebounceRef.current);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  function getExportCap(presetKey = selectedPreset) {
    return maximumResolutionMode
      ? customExportCap
      : PRESETS[presetKey].defaultExportCap;
  }

  async function processFile(
    file,
    presetKey,
    exportCap,
    updateSource = true,
    cropSettings = crop,
    prioritySetting = priority,
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
    setIsOutputPending(true);
    setError("");

    if (updateSource) {
      const initialCrop = { zoom: 1, x: 0, y: 0 };
      cropSettings = initialCrop;
      setCrop(initialCrop);
      setResult(null);
      setAfterUrl("");
      setSourceFile(file);
      setBeforeUrl(URL.createObjectURL(file));
    }

    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });

      if (updateSource) {
        setSourceDimensions({
          width: bitmap.width,
          height: bitmap.height,
        });
      }

      let optimised;
      try {
        optimised = await optimiseImage(
          canvasRef.current,
          bitmap,
          activePreset,
          cropSettings,
          prioritySetting,
        );
      } finally {
        bitmap.close();
      }

      if (processingId !== processingIdRef.current) return;
      if (optimised.blob.size >= activePreset.maxBytes) {
        throw new Error("The output did not stay strictly below the selected file limit.");
      }

      setAfterUrl(URL.createObjectURL(optimised.blob));
      setResult({
        ...optimised,
        platform: activePreset.name,
        exportCap: activePreset.exportCap,
        maxBytes: activePreset.maxBytes,
        priority: prioritySetting,
        formattedSize: formatBytes(optimised.blob.size),
      });
      setIsOutputPending(false);
    } catch (processingError) {
      if (processingId === processingIdRef.current) {
        setError(processingError.message || "The image could not be processed.");
      }
    } finally {
      if (processingId === processingIdRef.current) {
        setIsProcessing(false);
        setIsOutputPending(false);
      }
    }
  }

  function reprocess({
    presetKey = selectedPreset,
    cropSettings = crop,
    prioritySetting = priority,
    exportCap = getExportCap(presetKey),
  } = {}) {
    if (!sourceFile) return;
    processFile(
      sourceFile,
      presetKey,
      exportCap,
      false,
      cropSettings,
      prioritySetting,
    );
  }

  function selectPreset(presetKey) {
    setSelectedPreset(presetKey);
    reprocess({
      presetKey,
      exportCap: getExportCap(presetKey),
    });
  }

  function selectPriority(nextPriority) {
    setPriority(nextPriority);
    reprocess({ prioritySetting: nextPriority });
  }

  function toggleMaximumResolution(event) {
    const enabled = event.target.checked;
    setMaximumResolutionMode(enabled);
    reprocess({
      exportCap: enabled ? customExportCap : preset.defaultExportCap,
    });
  }

  function applyCustomExportCap() {
    if (maximumResolutionMode) {
      reprocess({ exportCap: customExportCap });
    }
  }

  function scheduleOptimisation(nextCrop) {
    clearTimeout(cropDebounceRef.current);
    cropDebounceRef.current = setTimeout(() => {
      reprocess({ cropSettings: nextCrop });
    }, 350);
  }

  function updateCrop(nextCrop) {
    processingIdRef.current += 1;
    setCrop(nextCrop);
    setIsOutputPending(true);
    scheduleOptimisation(nextCrop);
  }

  function handlePointerDown(event) {
    if (!beforeUrl) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      crop,
    };
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const editorSize = editorRef.current?.clientWidth || 1;
    const { extraX, extraY } = getEditorOverflow(
      editorSize,
      sourceDimensions,
      drag.crop.zoom,
    );
    const nextCrop = {
      ...drag.crop,
      x:
        extraX > 0
          ? Math.max(
              -1,
              Math.min(
                1,
                drag.crop.x - (event.clientX - drag.startX) / extraX,
              ),
            )
          : 0,
      y:
        extraY > 0
          ? Math.max(
              -1,
              Math.min(
                1,
                drag.crop.y - (event.clientY - drag.startY) / extraY,
              ),
            )
          : 0,
    };

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      processingIdRef.current += 1;
      setCrop(nextCrop);
      setIsOutputPending(true);
      scheduleOptimisation(nextCrop);
    });
  }

  function handlePointerUp(event) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  function handleUpload(file) {
    processFile(
      file,
      selectedPreset,
      getExportCap(),
      true,
      crop,
      priority,
    );
  }

  function handleDrop(event) {
    event.preventDefault();
    handleUpload(event.dataTransfer.files[0]);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">local image processing</p>
        <h1>AvatarPress</h1>
        <p className="intro">
          Crop, preview, and export clean profile images locally.
        </p>
      </section>

      <PlatformSelector
        selectedPreset={selectedPreset}
        priority={priority}
        maximumResolutionMode={maximumResolutionMode}
        customExportCap={customExportCap}
        onSelectPreset={selectPreset}
        onSelectPriority={selectPriority}
        onToggleMaximumResolution={toggleMaximumResolution}
        onCustomExportCapChange={setCustomExportCap}
        onCustomExportCapCommit={applyCustomExportCap}
      />

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
          onChange={(event) => handleUpload(event.target.files[0])}
        />
        <p>JPG, PNG, WebP</p>
        <button
          type="button"
          className="select-button"
          disabled={isProcessing}
          onClick={() => inputRef.current?.click()}
        >
          {isProcessing ? "Optimising…" : "Select image"}
        </button>
      </section>

      {error && <p className="error-message">{error}</p>}

      {beforeUrl && (
        <section className="review-section" aria-live="polite">
          <div className="review-heading">
            <div>
              <span>Step 3</span>
              <h2>Adjust crop</h2>
            </div>
          </div>

          <div className="crop-workspace">
            <CropEditor
              editorRef={editorRef}
              imageUrl={beforeUrl}
              sourceDimensions={sourceDimensions}
              crop={crop}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onCropChange={updateCrop}
            />
            <AvatarPreview
              imageUrl={beforeUrl}
              sourceDimensions={sourceDimensions}
              crop={crop}
            />
          </div>
        </section>
      )}

      {afterUrl && result && (
        <section className="download-panel">
          <div className="download-summary">
            <strong>Ready for {result.platform}</strong>
            <p>
              {result.dimension}×{result.dimension} ·{" "}
              {formatBytes(result.blob.size)} ·{" "}
              <span>
                {result.blob.size < result.maxBytes ? "within limit" : "over limit"}
              </span>
            </p>
          </div>

          <div className="download-actions">
            <button
              type="button"
              className="info-button"
              aria-label="Output details"
              title="Output details"
              aria-expanded={isInfoOpen}
              onClick={() => setIsInfoOpen((open) => !open)}
            >
              i
            </button>
            <a
              className={`download-button ${isOutputPending ? "disabled" : ""}`}
              href={isOutputPending ? undefined : afterUrl}
              aria-disabled={isOutputPending}
              download={preset.fileName}
            >
              {isOutputPending ? "Updating…" : "Download JPEG"}
            </a>
          </div>

          {isInfoOpen && (
            <OutputInfoPopover
              result={result}
              sourceDimensions={sourceDimensions}
              isUpdating={isOutputPending || isProcessing}
              onClose={() => setIsInfoOpen(false)}
            />
          )}
        </section>
      )}

      <canvas ref={canvasRef} className="hidden-canvas" />
    </main>
  );
}
