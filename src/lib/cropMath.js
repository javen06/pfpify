export function getSourceCrop(image, crop) {
  const sourceSize = Math.min(image.width, image.height) / crop.zoom;
  const horizontalRatio = (crop.x + 1) / 2;
  const verticalRatio = (crop.y + 1) / 2;

  return {
    sourceSize,
    sourceX: (image.width - sourceSize) * horizontalRatio,
    sourceY: (image.height - sourceSize) * verticalRatio,
  };
}

export function getCropPreviewStyle(dimensions, crop) {
  const aspect = dimensions.width / dimensions.height;
  const baseWidth = aspect >= 1 ? aspect * 100 : 100;
  const baseHeight = aspect >= 1 ? 100 : (1 / aspect) * 100;
  const scaledWidth = baseWidth * crop.zoom;
  const scaledHeight = baseHeight * crop.zoom;
  const maxTranslateX = Math.max(0, (scaledWidth - 100) / 2);
  const maxTranslateY = Math.max(0, (scaledHeight - 100) / 2);

  return {
    width: `${scaledWidth}%`,
    height: `${scaledHeight}%`,
    left: `${50 - crop.x * maxTranslateX}%`,
    top: `${50 - crop.y * maxTranslateY}%`,
    transform: "translate(-50%, -50%)",
  };
}

export function getEditorOverflow(editorSize, dimensions, zoom) {
  const imageAspect = dimensions.width / dimensions.height;
  const renderedWidth =
    imageAspect >= 1 ? editorSize * imageAspect * zoom : editorSize * zoom;
  const renderedHeight =
    imageAspect >= 1 ? editorSize * zoom : (editorSize / imageAspect) * zoom;

  return {
    extraX: Math.max(0, (renderedWidth - editorSize) / 2),
    extraY: Math.max(0, (renderedHeight - editorSize) / 2),
  };
}
