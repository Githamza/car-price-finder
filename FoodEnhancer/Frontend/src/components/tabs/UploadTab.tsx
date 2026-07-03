import React, { useRef } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Upload, Camera, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { StyleGallery } from "../StyleGallery";
import { useImageStyles } from "../../hooks/useImageStyles";
import { ImageStyle } from "../../lib/azureFunctionService";

interface UploadTabProps {
  selectedFile: File | null;
  previewUrl: string | null;
  isProcessing: boolean;
  selectedStyleId?: string;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onEnhance: () => void;
  onStyleSelect: (style: ImageStyle) => void;
}

const UploadTab: React.FC<UploadTabProps> = ({
  selectedFile,
  previewUrl,
  isProcessing,
  selectedStyleId,
  onFileSelect,
  onDrop,
  onDragOver,
  onEnhance,
  onStyleSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { styles: imageStyles, loading: stylesLoading, error: stylesError, refreshStyles } = useImageStyles();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="text-orange-500" />
          Upload Food Photo
        </CardTitle>
        <CardDescription>
          Drag and drop or click to select a food photo for AI-powered editing
        </CardDescription>
        <div className="text-xs text-gray-500 mt-2">
          Supported: JPEG, PNG, WebP • Max: 10MB • Auto-compressed to 800×800px
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            previewUrl
              ? "border-orange-300 bg-orange-50"
              : "border-gray-300 hover:border-orange-400 hover:bg-orange-50"
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-64 object-cover rounded-lg mx-auto"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                Choose Different Image
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your food photo here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Images are automatically compressed for optimal API
                  performance
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Select Image
              </Button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
          aria-label="File upload input"
          title="Select food photo file"
        />

        {/* Style Gallery */}
        <div className="space-y-4">
          <Label>Choose Photography Style</Label>
          <StyleGallery
            imageStyles={imageStyles}
            onStyleSelect={onStyleSelect}
            selectedStyleId={selectedStyleId}
            loading={stylesLoading}
            error={stylesError}
            onRetry={refreshStyles}
          />
        </div>

        {/* Enhance Button - Fixed for mobile */}
        <Button
          onClick={() => {
            console.log("Button clicked!");
            console.log("selectedFile:", selectedFile);
            console.log("selectedStyleId:", selectedStyleId);
            onEnhance();
          }}
          disabled={!selectedFile || isProcessing || stylesLoading || !!stylesError}
          className="w-full bg-orange-500 hover:bg-orange-600 h-14 text-lg min-h-[56px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Editing...
            </>
          ) : !selectedFile ? (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Select an image first
            </>
          ) : stylesLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading styles...
            </>
          ) : stylesError ? (
            <>
              <AlertCircle className="mr-2 h-5 w-5" />
              Styles unavailable
            </>
          ) : !selectedStyleId ? (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Choose a style first
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Edit Photo
            </>
          )}
        </Button>

        {/* Status info */}
        <div className="text-xs text-gray-500 text-center">
          {!selectedFile && "• Upload an image to enable editing"}
          {selectedFile && stylesLoading && "• Loading photography styles..."}
          {selectedFile && stylesError && "• Failed to load styles"}
          {selectedFile &&
            !stylesLoading &&
            !stylesError &&
            !selectedStyleId &&
            "• Select a photography style to enable editing"}
          {selectedFile && selectedStyleId && "• Ready to edit!"}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadTab;
