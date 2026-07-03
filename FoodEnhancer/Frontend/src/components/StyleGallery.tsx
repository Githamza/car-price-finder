import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ImageStyle } from "../lib/azureFunctionService";
import { Loader2, AlertCircle } from "lucide-react";

interface StyleGalleryProps {
  imageStyles: ImageStyle[];
  selectedStyleId?: string;
  onStyleSelect: (style: ImageStyle) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const StyleGallery: React.FC<StyleGalleryProps> = ({
  imageStyles,
  selectedStyleId,
  onStyleSelect,
  loading = false,
  error = null,
  onRetry,
}) => {
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

  const getThumbnailColor = (thumbnail: string) => {
    const colors: { [key: string]: string } = {
      "moody-food": "bg-gradient-to-br from-gray-800 via-gray-900 to-black",
      "bright-lifestyle":
        "bg-gradient-to-br from-blue-50 via-white to-gray-100",
      "vintage-film":
        "bg-gradient-to-br from-amber-100 via-orange-200 to-yellow-100",
      "high-key-studio": "bg-gradient-to-br from-gray-100 via-white to-blue-50",
      "minimalist-white":
        "bg-gradient-to-br from-white via-gray-50 to-gray-100",
      "warm-sunset":
        "bg-gradient-to-br from-orange-200 via-yellow-200 to-red-200",
      "urban-street":
        "bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800",
      "elegant-dining": "bg-gradient-to-br from-gray-100 via-white to-blue-50",
    };
    return colors[thumbnail] || "bg-gradient-to-br from-gray-200 to-gray-300";
  };

  const getThumbnailIcon = (thumbnail: string) => {
    const icons: { [key: string]: string } = {
      "moody-food": "🌙",
      "bright-lifestyle": "☀️",
      "vintage-film": "📷",
      "high-key-studio": "💡",
      "minimalist-white": "⚪",
      "warm-sunset": "🌅",
      "urban-street": "🏙️",
      "elegant-dining": "🍷",
    };
    return icons[thumbnail] || "📸";
  };

  const handleStyleSelect = (style: ImageStyle) => {
    console.log("Style selected:", style.id);
    onStyleSelect(style);
  };

  if (loading) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Choose Your Photography Style
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading photography styles...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Choose Your Photography Style
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <span>Failed to load styles</span>
            </div>
            <p className="text-sm text-gray-600 max-w-md">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (imageStyles.length === 0) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Choose Your Photography Style
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-gray-600">
            <p>No photography styles available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Choose Your Photography Style
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {imageStyles.map((style) => (
          <Card
            key={style.id}
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg touch-manipulation ${
              selectedStyleId === style.id
                ? "ring-2 ring-blue-500 shadow-lg bg-blue-50"
                : "hover:scale-105 active:scale-95"
            }`}
            onMouseEnter={() => setHoveredStyle(style.id)}
            onMouseLeave={() => setHoveredStyle(null)}
            onClick={() => handleStyleSelect(style)}
            onTouchStart={() => {
              // On mobile, immediately select the style
              handleStyleSelect(style);
            }}
          >
            <div className="p-4">
              {/* Thumbnail */}
              <div className="w-full h-24 rounded-lg mb-3 overflow-hidden">
                <img
                  src={style.resultImage}
                  alt={style.promptTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log("error", e);
                    // Fallback to colored background if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.parentElement;
                    if (fallback) {
                      fallback.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-3xl ${getThumbnailColor(
                          style.thumbnail
                        )}">
                          ${getThumbnailIcon(style.thumbnail)}
                        </div>
                      `;
                    }
                  }}
                />
              </div>

              {/* Title */}
              <h4 className="font-medium text-gray-900 mb-2 text-sm text-center">
                {style.promptTitle}
              </h4>

              {/* Selection indicator */}
              {selectedStyleId === style.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Hover overlay - Only show on desktop */}
              {hoveredStyle === style.id &&
                typeof window !== "undefined" &&
                window.innerWidth > 768 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                      Select Style
                    </Button>
                  </div>
                )}
            </div>
          </Card>
        ))}
      </div>

      {selectedStyleId && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">
                Style Selected:{" "}
                {imageStyles.find((s) => s.id === selectedStyleId)?.promptTitle}
              </h4>
              <p className="text-sm text-blue-700">
                This photography style will be automatically applied to enhance
                your image.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleGallery;
