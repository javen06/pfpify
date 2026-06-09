import { getSourceCrop } from "./cropMath";

export function drawSquareCrop(
  canvas,
  image,
  dimension,
  crop,
  fillBackground = true,
) {
  const context = canvas.getContext("2d");
  const { sourceSize, sourceX, sourceY } = getSourceCrop(image, crop);

  canvas.width = dimension;
  canvas.height = dimension;
  context.clearRect(0, 0, dimension, dimension);
  if (fillBackground) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, dimension, dimension);
  }
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

export function canvasToJpeg(canvas, quality) {
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

export function canvasToPng(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("The browser could not encode this image."));
      }
    }, "image/png");
  });
}
