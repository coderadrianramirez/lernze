export async function imageBlob(file: File, maxSize = 1920): Promise<Blob> {
  const image = new Image();
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = url;
    });
    if (image.naturalWidth * image.naturalHeight > 40_000_000)
      throw new Error("Usa una imagen de hasta 40 megapíxeles.");
    const ratio = Math.min(
      1,
      maxSize / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    canvas
      .getContext("2d")!
      .drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("No pudimos preparar la imagen.")),
        "image/webp",
        0.86,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
