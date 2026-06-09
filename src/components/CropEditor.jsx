import { getCropPreviewStyle } from "../lib/cropMath";

export default function CropEditor({
  editorRef,
  imageUrl,
  sourceDimensions,
  crop,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onCropChange,
}) {
  return (
    <div>
      <div
        ref={editorRef}
        className="crop-editor"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={imageUrl}
          alt="Drag to position the profile crop"
          draggable="false"
          style={getCropPreviewStyle(sourceDimensions, crop)}
        />
        <div className="circle-mask" aria-hidden="true" />
        <div className="circle-guide" aria-hidden="true" />
      </div>

      <div className="zoom-row">
        <label htmlFor="crop-zoom">Zoom</label>
        <input
          id="crop-zoom"
          type="range"
          min="1"
          max="4"
          step="0.01"
          value={crop.zoom}
          onChange={(event) =>
            onCropChange({
              ...crop,
              zoom: Number(event.target.value),
            })
          }
        />
        <output htmlFor="crop-zoom">{crop.zoom.toFixed(2)}×</output>
      </div>

      <div className="crop-guidance">
        <p>Drag to reposition · Zoom to frame</p>
        {crop.zoom > 2.5 && (
          <span>High zoom may soften detail.</span>
        )}
      </div>
    </div>
  );
}
