import { getCropPreviewStyle } from "../lib/cropMath";

export default function AvatarPreview({
  imageUrl,
  sourceDimensions,
  crop,
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
      <h3>Preview</h3>
      <p>Approximate circular preview.</p>
    </aside>
  );
}
