import { useEffect, useRef, useState } from "react";

import AvatarPreview from "../components/AvatarPreview";
import CropEditor from "../components/CropEditor";
import OutputInfoPopover from "../components/OutputInfoPopover";
import PlatformSelector from "../components/PlatformSelector";
import { getEditorOverflow } from "./cropMath";
import { optimiseImage } from "./optimiseImage";
import {
  ACCEPTED_TYPES,
  PLATFORMS,
  formatBytes,
} from "./presets";

const INITIAL_CROP = { zoom: 1, x: 0, y: 0 };

export default function AvatarCropper({
  platform = "github",
  customPreset,
  defaultFormat = "jpeg",
  showPreview = true,
  onExport,
  className,
}) {
  const initialPlatform = PLATFORMS[platform] ? platform : "general";
  const initialFormat = defaultFormat === "png" ? "png" : "jpeg";
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const editorRef = useRef(null);
  const reviewRef = useRef(null);
  const processingIdRef = useRef(0);
  const cropDebounceRef = useRef(null);
  const dragRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [selectedPlatform, setSelectedPlatform] = useState(initialPlatform);
  const [priority, setPriority] = useState("balanced");
  const [outputFormat, setOutputFormat] = useState(initialFormat);
  const [maximumResolutionMode, setMaximumResolutionMode] = useState(false);
  const [customExportCap, setCustomExportCap] = useState(
    getPlatformConfig(initialPlatform).maxPx,
  );
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [sourceDimensions, setSourceDimensions] = useState({
    width: 1,
    height: 1,
  });
  const [sourceFile, setSourceFile] = useState(null);
  const [beforeUrl, setBeforeUrl] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [afterUrl, setAfterUrl] = useState("");
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOutputPending, setIsOutputPending] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [error, setError] = useState("");

  const selectedPreset = getPlatformConfig(selectedPlatform);

  function getPlatformConfig(platformKey) {
    const basePreset = PLATFORMS[platformKey] || PLATFORMS.general;

    if (customPreset && platformKey === platform) {
      return {
        ...basePreset,
        maxPx: customPreset.maxPx,
        maxBytes: customPreset.maxBytes,
      };
    }

    return basePreset;
  }

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

  useEffect(() => {
    if (!imageLoaded) return;

    const frameId = requestAnimationFrame(() => {
      reviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [imageLoaded]);

  useEffect(() => {
    const nextPlatform = PLATFORMS[platform] ? platform : "general";
    if (nextPlatform === selectedPlatform) return;

    const nextPreset = getPlatformConfig(nextPlatform);
    setSelectedPlatform(nextPlatform);
    setMaximumResolutionMode(false);
    setCustomExportCap(nextPreset.maxPx);

    if (sourceFile) {
      processFile(
        sourceFile,
        nextPlatform,
        nextPreset.maxPx,
        false,
        crop,
        priority,
        outputFormat,
      );
    }
  }, [platform]);

  function getExportCap(platformKey = selectedPlatform) {
    return maximumResolutionMode
      ? customExportCap
      : getPlatformConfig(platformKey).maxPx;
  }

  async function processFile(
    file,
    platformKey,
    exportCap,
    updateSource = true,
    cropSettings = crop,
    prioritySetting = priority,
    formatSetting = outputFormat,
  ) {
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    const processingId = processingIdRef.current + 1;
    processingIdRef.current = processingId;
    const platformPreset = getPlatformConfig(platformKey);
    const activePreset = {
      ...platformPreset,
      exportCap,
    };

    setIsProcessing(true);
    setIsOutputPending(true);
    setError("");

    if (updateSource) {
      cropSettings = INITIAL_CROP;
      setCrop(INITIAL_CROP);
      setResult(null);
      setAfterUrl("");
      setSourceFile(file);
      setImageLoaded(false);
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
        setImageLoaded(true);
      }

      let optimised;
      try {
        optimised = await optimiseImage(
          canvasRef.current,
          bitmap,
          activePreset,
          cropSettings,
          prioritySetting,
          formatSetting,
        );
      } finally {
        bitmap.close();
      }

      if (processingId !== processingIdRef.current) return;
      if (optimised.blob.size >= activePreset.maxBytes) {
        throw new Error(
          "The output did not stay strictly below the selected file limit.",
        );
      }

      const nextResult = {
        ...optimised,
        platform: activePreset.label,
        platformId: activePreset.id,
        exportCap: activePreset.exportCap,
        maxBytes: activePreset.maxBytes,
        priority: prioritySetting,
        format: formatSetting,
        fileName: `${activePreset.fileStem}.${formatSetting === "png" ? "png" : "jpg"}`,
        formattedSize: formatBytes(optimised.blob.size),
      };

      setAfterUrl(URL.createObjectURL(optimised.blob));
      setResult(nextResult);
      setIsOutputPending(false);
      onExport?.(optimised.blob, {
        width: optimised.dimension,
        height: optimised.dimension,
        sizeBytes: optimised.blob.size,
        format: formatSetting,
        platform: activePreset.id,
        maxPx: activePreset.exportCap,
        maxBytes: activePreset.maxBytes,
      });
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
    platformKey = selectedPlatform,
    cropSettings = crop,
    prioritySetting = priority,
    exportCap = getExportCap(platformKey),
    formatSetting = outputFormat,
  } = {}) {
    if (!sourceFile) return;
    processFile(
      sourceFile,
      platformKey,
      exportCap,
      false,
      cropSettings,
      prioritySetting,
      formatSetting,
    );
  }

  function selectPlatform(platformKey) {
    setSelectedPlatform(platformKey);
    reprocess({
      platformKey,
      exportCap: getExportCap(platformKey),
    });
  }

  function selectPriority(nextPriority) {
    setPriority(nextPriority);
    reprocess({ prioritySetting: nextPriority });
  }

  function selectOutputFormat(nextFormat) {
    if (nextFormat === outputFormat) return;
    setOutputFormat(nextFormat);
    setResult(null);
    setAfterUrl("");
    reprocess({ formatSetting: nextFormat });
  }

  function toggleMaximumResolution(event) {
    const enabled = event.target.checked;
    setMaximumResolutionMode(enabled);
    reprocess({
      exportCap: enabled ? customExportCap : selectedPreset.maxPx,
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
      selectedPlatform,
      getExportCap(),
      true,
      crop,
      priority,
      outputFormat,
    );
  }

  function handleDrop(event) {
    event.preventDefault();
    handleUpload(event.dataTransfer.files[0]);
  }

  return (
    <div className={className}>
      <PlatformSelector
        selectedPreset={selectedPlatform}
        priority={priority}
        maximumResolutionMode={maximumResolutionMode}
        customExportCap={customExportCap}
        onSelectPreset={selectPlatform}
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

      {imageLoaded && beforeUrl && (
        <section
          ref={reviewRef}
          className="review-section"
          aria-live="polite"
        >
          <div className="review-heading">
            <h2>Adjust crop</h2>
          </div>

          <div
            className={
              showPreview
                ? "crop-workspace"
                : "crop-workspace crop-workspace-single"
            }
          >
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
            {showPreview && (
              <AvatarPreview
                imageUrl={beforeUrl}
                sourceDimensions={sourceDimensions}
                crop={crop}
                result={result}
              />
            )}
          </div>
        </section>
      )}

      {imageLoaded && afterUrl && result && (
        <section className="download-panel">
          <div className="download-summary">
            <strong>Ready for {result.platform}</strong>
            <p>
              {result.dimension}×{result.dimension} ·{" "}
              {formatBytes(result.blob.size)} · {result.format.toUpperCase()} ·{" "}
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
            <div className="format-setting" aria-label="Output format">
              <button
                type="button"
                className={outputFormat === "jpeg" ? "active" : ""}
                aria-pressed={outputFormat === "jpeg"}
                onClick={() => selectOutputFormat("jpeg")}
              >
                JPEG
              </button>
              <button
                type="button"
                className={outputFormat === "png" ? "active" : ""}
                aria-pressed={outputFormat === "png"}
                onClick={() => selectOutputFormat("png")}
              >
                PNG
              </button>
            </div>
            <a
              className={`download-button ${isOutputPending ? "disabled" : ""}`}
              href={isOutputPending ? undefined : afterUrl}
              aria-disabled={isOutputPending}
              download={result.fileName}
            >
              {isOutputPending
                ? "Updating…"
                : `Download ${result.format.toUpperCase()}`}
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
    </div>
  );
}
