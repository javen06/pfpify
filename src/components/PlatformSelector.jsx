import { PLATFORMS, PRIORITIES } from "../lib/presets";

export default function PlatformSelector({
  selectedPreset,
  priority,
  maximumResolutionMode,
  customExportCap,
  onSelectPreset,
  onSelectPriority,
  onToggleMaximumResolution,
  onCustomExportCapChange,
  onCustomExportCapCommit,
}) {
  return (
    <section className="preset-section" aria-labelledby="preset-heading">
      <div className="section-heading">
        <h2 id="preset-heading">Choose a platform</h2>
      </div>

      <div className="preset-options">
        {Object.entries(PLATFORMS).map(([key, option]) => (
          <button
            key={key}
            type="button"
            className={`preset-button ${selectedPreset === key ? "active" : ""}`}
            aria-pressed={selectedPreset === key}
            onClick={() => onSelectPreset(key)}
          >
            <strong>{option.label}</strong>
            <span>{option.displayLabel}</span>
          </button>
        ))}
      </div>

      <details className="advanced-options">
        <summary>Advanced</summary>
        <div className="advanced-content">
          <div className="priority-setting">
            <strong>Optimisation priority</strong>
            <div className="priority-options">
              {Object.entries(PRIORITIES).map(([key, option]) => (
                <button
                  key={key}
                  type="button"
                  className={priority === key ? "active" : ""}
                  aria-pressed={priority === key}
                  onClick={() => onSelectPriority(key)}
                >
                  {option.name}
                </button>
              ))}
            </div>
            <div className="priority-help">
              <span>Balanced = recommended</span>
              <span>Max resolution = largest output</span>
              <span>Max quality = less JPEG compression</span>
            </div>
          </div>

          <div className="advanced-setting">
            <label className="mode-toggle">
              <input
                type="checkbox"
                checked={maximumResolutionMode}
                onChange={onToggleMaximumResolution}
              />
              <strong>Custom export cap</strong>
            </label>

            {maximumResolutionMode && (
              <div className="resolution-control">
                <div>
                  <label htmlFor="export-cap">Export cap</label>
                  <output htmlFor="export-cap">
                    {customExportCap} × {customExportCap}
                  </output>
                </div>
                <input
                  id="export-cap"
                  type="range"
                  min="400"
                  max="2999"
                  step="1"
                  value={customExportCap}
                  onChange={(event) =>
                    onCustomExportCapChange(Number(event.target.value))
                  }
                  onPointerUp={onCustomExportCapCommit}
                  onKeyUp={onCustomExportCapCommit}
                />
                <div className="range-labels">
                  <span>400</span>
                  <span>2999</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </details>
    </section>
  );
}
