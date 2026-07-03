import { useState } from "react";
import { compressImage, fileToBase64 } from "../lib/imageUtils";
import { azureFunctionService } from "../lib/azureFunctionService";

interface ImageProcessingResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface ImageProcessingOptions {
  file: File;
  styleId: string; // Changed from prompt to styleId
  fallbackUrl?: string;
}

/**
 * Custom hook for processing images through AI enhancement
 * Follows Single Responsibility Principle - only handles image processing
 */
export const useImageProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Processes an image through compression and AI enhancement
   * @param options - Configuration for image processing
   * @returns Promise with processing result
   */
  const processImage = async (
    options: ImageProcessingOptions
  ): Promise<ImageProcessingResult> => {
    const { file, styleId, fallbackUrl } = options;

    setIsProcessing(true);

    try {
      const enhancedUrl = await enhanceImageWithAI(file, styleId);
      return { success: true, imageUrl: enhancedUrl };
    } catch (error) {
      console.error("Image processing failed:", error);

      // Return fallback if available, otherwise return error
      if (fallbackUrl) {
        return { success: true, imageUrl: fallbackUrl };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Enhances image through compression and AI processing
   * @param file - Image file to process
   * @param styleId - Style ID for enhancement
   * @returns Promise with enhanced image URL
   */
  const enhanceImageWithAI = async (
    file: File,
    styleId: string
  ): Promise<string> => {
    // Step 1: Compress image for optimal API performance
    const compressedFile = await compressImage(file);

    // Step 2: Convert compressed image to base64
    const base64Image = await fileToBase64(compressedFile);

    // Step 3: Process with AI service using styleId
    const result = await azureFunctionService.enhanceImage(
      base64Image,
      styleId
    );

    if (result.success && result.imageUrl) {
      return result.imageUrl;
    }

    throw new Error("AI enhancement failed - no image returned");
  };

  return {
    processImage,
    isProcessing,
  };
};
