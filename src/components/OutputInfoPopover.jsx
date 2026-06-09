import { PRIORITIES, formatBytes } from "../lib/presets";

export default function OutputInfoPopover({
  result,
  sourceDimensions,
  isUpdating,
  onClose,
}) {
  const budgetPercent = (result.blob.size / result.maxBytes) * 100;
  const budgetTone =
    budgetPercent > 100 ? "danger" : budgetPercent >= 80 ? "warning" : "safe";
  const reason = getReason(result, sourceDimensions);
  const withinLimit = result.blob.size < result.maxBytes;

  return (
    <aside className="output-inspector" aria-label="Output details">
      <div className="inspector-heading">
        <div>
          <strong>Output details</strong>
          {isUpdating && <span>Updating output…</span>}
        </div>
        <button type="button" aria-label="Close output details" onClick={onClose}>
          ×
        </button>
      </div>

      <dl className="inspector-grid">
        <div>
          <dt>Output</dt>
          <dd>{result.dimension} × {result.dimension}</dd>
        </div>
        <div>
          <dt>File</dt>
          <dd>{formatBytes(result.blob.size)} / {formatBytes(result.maxBytes)}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{PRIORITIES[result.priority].name}</dd>
        </div>
        <div>
          <dt>JPEG</dt>
          <dd>{result.quality.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd className={withinLimit ? "status-safe" : "status-danger"}>
            {withinLimit ? "Within limit" : "Over limit"}
          </dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{reason}</dd>
        </div>
      </dl>

      <div className="budget-row">
        <span>{withinLimit && budgetPercent >= 99 ? "Near limit" : "File budget"}</span>
        <strong>{budgetPercent.toFixed(1)}%</strong>
      </div>
      <div className="budget-track" aria-label={`${budgetPercent.toFixed(1)}% of file-size budget used`}>
        <span
          className={budgetTone}
          style={{ width: `${Math.min(100, budgetPercent)}%` }}
        />
      </div>
    </aside>
  );
}

function getReason(result, sourceDimensions) {
  const sourceLimit = Math.floor(
    Math.min(sourceDimensions.width, sourceDimensions.height),
  );
  const maximumDimension = Math.min(sourceLimit, result.exportCap);

  if (result.dimension < maximumDimension) return "File limit";
  if (sourceLimit <= result.exportCap) return "Original size";
  if (result.exportCap < sourceLimit) return "Export cap";
  return "Balanced";
}
