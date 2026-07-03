import React from "react";
import UploadTab from "./tabs/UploadTab";
import ResultsTab from "./tabs/ResultsTab";

interface ImageEditorProps {
  selectedFile: File | null;
  previewUrl: string | null;
  enhancedImage: string | null;
  isProcessing: boolean;
  selectedStyleId?: string;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onEnhance: () => void;
  onReset: () => void;
  onDownload: (imageUrl: string, filename: string) => void;
  onStyleSelect: (style: {
    id: string;
    promptTitle: string;
    thumbnail: string;
    resultImage: string;
  }) => void;
}

/**
 * Main component for the image editor
 * Shows upload/preview and results side by side
 */
export const ImageEditor: React.FC<ImageEditorProps> = ({
  selectedFile,
  previewUrl,
  enhancedImage,
  isProcessing,
  selectedStyleId,
  onFileSelect,
  onDrop,
  onDragOver,
  onEnhance,
  onReset,
  onDownload,
  onStyleSelect,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Upload & Preview */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upload & Preview
            </h2>
            <p className="text-gray-600">
              Select and preview your food photo before enhancement
            </p>
          </div>
          <UploadTab
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isProcessing={isProcessing}
            selectedStyleId={selectedStyleId}
            onFileSelect={onFileSelect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onEnhance={onEnhance}
            onStyleSelect={onStyleSelect}
          />
        </div>

        {/* Right Side - Results */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Results</h2>
            <p className="text-gray-600">
              View your enhanced image and download the result
            </p>
          </div>
          <ResultsTab
            originalImage={previewUrl}
            enhancedImage={enhancedImage}
            isProcessing={isProcessing}
            onDownload={onDownload}
            onReset={onReset}
          />
        </div>
      </div>
    </div>
  );
};
