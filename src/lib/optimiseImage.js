import { canvasToJpeg, canvasToPng, drawSquareCrop } from "./imageCanvas";

export const MIN_QUALITY = 0.5;
export const BALANCED_MIN_QUALITY = 0.82;
export const MAX_QUALITY = 0.95;
const QUALITY_SEARCH_STEPS = 10;
const MIN_USEFUL_PNG_DIMENSION = 128;

async function encodeAtQuality(canvas, image, dimension, maxBytes, crop, quality) {
  drawSquareCrop(canvas, image, dimension, crop);
  const blob = await canvasToJpeg(canvas, quality);
  return blob.size < maxBytes ? { blob, quality, dimension } : null;
}

async function bestQualityAtDimension(
  canvas,
  image,
  dimension,
  maxBytes,
  crop,
  minimumQuality,
) {
  drawSquareCrop(canvas, image, dimension, crop);

  const highQualityBlob = await canvasToJpeg(canvas, MAX_QUALITY);
  if (highQualityBlob.size < maxBytes) {
    return { blob: highQualityBlob, quality: MAX_QUALITY, dimension };
  }

  const lowQualityBlob = await canvasToJpeg(canvas, minimumQuality);
  if (lowQualityBlob.size >= maxBytes) return null;

  let low = minimumQuality;
  let high = MAX_QUALITY;
  let bestBlob = lowQualityBlob;
  let bestQuality = minimumQuality;

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

async function findLargestDimension(maximumDimension, testDimension) {
  const maximumResult = await testDimension(maximumDimension);
  if (maximumResult) return maximumResult;

  let low = 1;
  let high = maximumDimension - 1;
  let bestResult = null;

  while (low <= high) {
    const dimension = Math.floor((low + high) / 2);
    const result = await testDimension(dimension);

    if (result) {
      bestResult = result;
      low = dimension + 1;
    } else {
      high = dimension - 1;
    }
  }

  return bestResult;
}

export async function optimiseImage(canvas, image, preset, crop, priority) {
  const originalSquareSize = Math.floor(Math.min(image.width, image.height));
  const maximumDimension = Math.min(originalSquareSize, preset.exportCap);

  if (maximumDimension < 1) {
    throw new Error("The selected image has invalid dimensions.");
  }

  let result;

  if (priority === "quality") {
    result = await findLargestDimension(maximumDimension, (dimension) =>
      encodeAtQuality(
        canvas,
        image,
        dimension,
        preset.maxBytes,
        crop,
        MAX_QUALITY,
      ),
    );
  } else {
    const minimumQuality =
      priority === "balanced" ? BALANCED_MIN_QUALITY : MIN_QUALITY;
    result = await findLargestDimension(maximumDimension, (dimension) =>
      bestQualityAtDimension(
        canvas,
        image,
        dimension,
        preset.maxBytes,
        crop,
        minimumQuality,
      ),
    );
  }

  if (!result) {
    throw new Error("The image could not be compressed below this preset's file limit.");
  }

  return result;
}

export async function optimisePng(canvas, image, preset, crop) {
  const originalSquareSize = Math.floor(Math.min(image.width, image.height));
  const maximumDimension = Math.min(originalSquareSize, preset.exportCap);

  if (maximumDimension < 1) {
    throw new Error("The selected image has invalid dimensions.");
  }

  const result = await findLargestDimension(maximumDimension, async (dimension) => {
    drawSquareCrop(canvas, image, dimension, crop, false);
    const blob = await canvasToPng(canvas);
    return blob.size < preset.maxBytes ? { blob, dimension } : null;
  });

  if (
    !result ||
    (maximumDimension >= MIN_USEFUL_PNG_DIMENSION &&
      result.dimension < MIN_USEFUL_PNG_DIMENSION)
  ) {
    throw new Error(
      "PNG may exceed this platform limit. Try JPEG for smaller files.",
    );
  }

  return result;
}
