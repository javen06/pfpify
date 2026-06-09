import { getCropPreviewStyle } from "../lib/cropMath";

export default function AvatarPreview({
  imageUrl,
  sourceDimensions,
  crop,
  result,
}) {
  return (
    <aside className="crop-summary">
      <div className="avatar-preview-large">
        <img
          src={imageUrl}
          alt="Approximate circular display preview"
          draggable="false"
          style={getCropPreviewStyle(sourceDimensions, crop)}
        />
      </div>
      {result && (
        <p>
          {result.dimension}×{result.dimension} · {result.format.toUpperCase()}
        </p>
      )}
    </aside>
  );
}
