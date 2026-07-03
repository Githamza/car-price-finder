import React, { useState } from "react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Download, Sparkles } from "lucide-react";
import { useImageProcessor } from "./hooks/useImageProcessor";
import { useFileManager } from "./hooks/useFileManager";
import { useImageHistory } from "./hooks/useImageHistory";
import { useDownload } from "./hooks/useDownload";
import { ImageEditor } from "./components/ImageEditor";
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider,
} from "./components/motion-primitives/image-comparison";
import { ImageStyle } from "./lib/azureFunctionService";
import "./App.css";

function App() {
  // State for selected photography style
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | undefined>();

  // Custom hooks for different concerns
  const {
    selectedFile,
    previewUrl,
    enhancedImage,
    setEnhancedImage,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    resetSelection,
  } = useFileManager();

  const { processImage, isProcessing } = useImageProcessor();
  const { editedImages, addToHistory } = useImageHistory();
  const { downloadImage } = useDownload();

  const editImage = async () => {
    console.log("Edit button clicked!");
    console.log("selectedFile:", selectedFile);
    console.log("previewUrl:", previewUrl);
    console.log("selectedStyleId:", selectedStyleId);

    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    if (!previewUrl) {
      alert("Please wait for the image to load");
      return;
    }

    if (!selectedStyleId) {
      alert("Please select a photography style first");
      return;
    }

    try {
      // Use custom hook for image processing with styleId
      const result = await processImage({
        file: selectedFile,
        styleId: selectedStyleId,
        fallbackUrl: previewUrl,
      });

      if (result.success && result.imageUrl) {
        setEnhancedImage(result.imageUrl);
        console.log("Edited image URL:", result.imageUrl);

        // Save to history using the hook
        addToHistory({
          originalUrl: previewUrl,
          editedUrl: result.imageUrl,
          prompt: selectedStyle?.promptTitle || "Style enhancement",
        });
      } else {
        // Handle error case
        alert(
          `Error editing image: ${result.error || "Unknown error occurred"}`
        );
      }
    } catch (error) {
      console.error("Error editing image:", error);
      alert(
        `Error editing image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Sparkles className="text-orange-500" />
            FoodEnhancer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your food photos with AI-powered editing for professional,
            appetizing images perfect for restaurant menus
          </p>

          {/* Before/After Comparison */}
          <div className="mt-8 max-w-2xl mx-auto">
            <ImageComparison className="w-full h-80 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <ImageComparisonImage
                src="/comparaison/salade-after.png"
                alt="Original salad photo"
                position="left"
              />
              <ImageComparisonImage
                src="/comparaison/salad-before.jpg"
                alt="Enhanced salad photo"
                position="right"
              />
              <ImageComparisonSlider className="bg-white" />
            </ImageComparison>
            <p className="text-sm text-gray-500 mt-2">
              Drag the slider to see the transformation
            </p>
          </div>
        </div>

        {/* Side-by-Side Image Editor */}
        <ImageEditor
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          enhancedImage={enhancedImage}
          isProcessing={isProcessing}
          selectedStyleId={selectedStyleId}
          onFileSelect={handleFileSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onEnhance={editImage}
          onReset={() => {
            resetSelection();
            setSelectedStyle(null);
            setSelectedStyleId(undefined);
          }}
          onDownload={downloadImage}
          onStyleSelect={(style: ImageStyle) => {
            setSelectedStyle(style);
            setSelectedStyleId(style.id);
          }}
        />

        {/* History Section */}
        {editedImages.length > 0 && (
          <Card className="mt-12 max-w-7xl mx-auto">
            <CardHeader>
              <CardTitle>Editing History</CardTitle>
              <CardDescription>
                Your previously edited food photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {editedImages.map((image) => (
                  <div key={image.id} className="space-y-3">
                    <div className="relative group">
                      <img
                        src={image.editedUrl}
                        alt="Edited"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          onClick={() =>
                            downloadImage(
                              image.editedUrl,
                              `edited-${image.id}.jpg`
                            )
                          }
                          size="sm"
                          variant="secondary"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {image.prompt}
                    </p>
                    <p className="text-xs text-gray-400">
                      {image.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Section */}
        <Card className="mt-12 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Share Your Feedback
            </CardTitle>
            <CardDescription>
              Help us improve FoodEnhancer by sharing your thoughts and
              suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action="https://formspree.io/f/mrbazkyg"
              method="POST"
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="feedback"
                  className="text-sm font-medium text-gray-700"
                >
                  Your Feedback
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  placeholder="Tell us what you think about FoodEnhancer, what features you'd like to see, or any issues you encountered..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Your feedback helps us make FoodEnhancer better for everyone
                </p>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Send Feedback
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
