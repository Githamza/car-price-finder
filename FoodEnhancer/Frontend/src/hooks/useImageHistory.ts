import { useState } from "react";

interface EditedImage {
  id: string;
  originalUrl: string;
  editedUrl: string;
  prompt: string;
  timestamp: Date;
}

/**
 * Custom hook for managing image editing history
 * Follows Single Responsibility Principle - only handles history operations
 */
export const useImageHistory = () => {
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);

  const addToHistory = (imageData: Omit<EditedImage, "id" | "timestamp">) => {
    const newEditedImage: EditedImage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...imageData,
    };
    setEditedImages((prev) => [newEditedImage, ...prev]);
  };

  const clearHistory = () => {
    setEditedImages([]);
  };

  const removeFromHistory = (id: string) => {
    setEditedImages((prev) => prev.filter((img) => img.id !== id));
  };

  return {
    editedImages,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
};
