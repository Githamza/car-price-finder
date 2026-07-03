import { config } from "../config";

// Convert file to base64 for API requests
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Compress and resize image to optimize API performance
export const compressImage = (
  file: File,
  maxWidth: number = config.imageProcessing.compression.maxWidth,
  maxHeight: number = config.imageProcessing.compression.maxHeight,
  quality: number = config.imageProcessing.compression.quality
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

// Validate file size and dimensions
export const validateFile = (
  file: File
): { valid: boolean; error?: string } => {
  // Check file type
  if (!config.imageProcessing.supportedFormats.includes(file.type)) {
    return {
      valid: false,
      error: "Please select a valid image file (JPEG, PNG, or WebP)",
    };
  }

  // Check file size
  if (file.size > config.imageProcessing.maxFileSize) {
    return {
      valid: false,
      error: `File size must be less than ${
        config.imageProcessing.maxFileSize / (1024 * 1024)
      }MB`,
    };
  }

  return { valid: true };
};
