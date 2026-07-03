import { useState, useRef } from "react";
import { validateFile } from "../lib/imageUtils";

interface FileManagerState {
  selectedFile: File | null;
  previewUrl: string | null;
  enhancedImage: string | null;
}

/**
 * Custom hook for managing file uploads, validation, and preview
 * Follows Single Responsibility Principle - only handles file operations
 */
export const useFileManager = () => {
  const [fileState, setFileState] = useState<FileManagerState>({
    selectedFile: null,
    previewUrl: null,
    enhancedImage: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File): boolean => {
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return false;
    }
    return true;
  };

  const setFile = (file: File) => {
    if (validateAndSetFile(file)) {
      const url = URL.createObjectURL(file);
      setFileState((prev) => ({
        ...prev,
        selectedFile: file,
        previewUrl: url,
        enhancedImage: null,
      }));
      return true;
    }
    return false;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const resetSelection = (clearPrompt?: () => void) => {
    setFileState({
      selectedFile: null,
      previewUrl: null,
      enhancedImage: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (clearPrompt) {
      clearPrompt();
    }
  };

  const setEnhancedImage = (imageUrl: string) => {
    setFileState((prev) => ({
      ...prev,
      enhancedImage: imageUrl,
    }));
  };

  return {
    ...fileState,
    fileInputRef,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    resetSelection,
    setEnhancedImage,
  };
};
