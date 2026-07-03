import React from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Download, Loader2, Sparkles, ExternalLink } from "lucide-react";

interface ResultsTabProps {
  originalImage: string | null;
  enhancedImage: string | null;
  isProcessing: boolean;
  onDownload: (imageUrl: string, filename: string) => void;
  onReset: () => void;
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  originalImage,
  enhancedImage,
  isProcessing,
  onReset,
  onDownload,
}) => {
  const openImageInNewTab = (imageUrl: string) => {
    window.open(imageUrl, "_blank");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-green-500" />
          Enhanced Result
        </CardTitle>
        <CardDescription>Your AI-enhanced food photo</CardDescription>
        <div className="text-xs text-gray-500 mt-2">
          Using AI-powered image editing with automatic optimization
        </div>
        <div className="text-xs text-gray-400">
          Powered by Azure Functions + Alibaba Cloud DashScope API
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {enhancedImage ? (
          <div className="space-y-6">
            {/* Enhanced Image with Loop Button */}
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={enhancedImage}
                  alt="Enhanced"
                  className="w-full h-80 object-cover rounded-lg border-2 border-green-200 mx-auto"
                />
                {/* Loop Button - Bottom Right */}
                <Button
                  onClick={() => openImageInNewTab(enhancedImage)}
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 shadow-lg border border-gray-200 min-h-[40px] min-w-[40px] p-2"
                  title="Open image in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  onDownload(enhancedImage, "edited-food-photo.jpg")
                }
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={onReset} variant="outline" className="flex-1">
                Start Over
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            {isProcessing ? (
              <div className="space-y-4">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />
                <p>Editing your food photo...</p>
                <p className="text-sm">This may take a few moments</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
                <p>Your enhanced photo will appear here</p>
                <p className="text-sm">
                  Upload an image and click enhance to get started
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsTab;
