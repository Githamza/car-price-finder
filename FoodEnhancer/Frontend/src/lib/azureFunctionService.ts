import { config } from "../config";

export interface ImageEnhancementRequest {
  image: string; // base64 encoded image
  styleId: string; // style ID instead of prompt
  model?: string;
}

export interface ImageEnhancementResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageStyle {
  id: string;
  promptTitle: string;
  prompt: string;
  thumbnail: string;
  resultImage: string;
}

export interface GetFiltersResponse {
  success: boolean;
  filters: ImageStyle[];
  count: number;
  error?: string;
}

/**
 * Service for calling the Azure Function to enhance images
 */
export class AzureFunctionService {
  private baseUrl: string;
  private endpoints: any;

  constructor() {
    this.baseUrl = config.azureFunction.baseUrl;
    this.endpoints = config.azureFunction.endpoints;

    // Ensure baseUrl has proper protocol
    if (
      !this.baseUrl.startsWith("http://") &&
      !this.baseUrl.startsWith("https://")
    ) {
      this.baseUrl = `https://${this.baseUrl}`;
    }

    // Remove trailing slash from baseUrl if present
    this.baseUrl = this.baseUrl.replace(/\/$/, "");

    // Log the final configuration for debugging
    console.log("AzureFunctionService initialized with:", {
      baseUrl: this.baseUrl,
      endpoints: this.endpoints,
      enhanceImageUrl: this.getEndpointUrl("enhanceImage"),
      getFiltersUrl: this.getEndpointUrl("getFilters"),
    });
  }

  private getEndpointUrl(endpointKey: string): string {
    return `${this.baseUrl}${this.endpoints[endpointKey]}`;
  }

  /**
   * Enhance an image using the Azure Function
   * @param image - Base64 encoded image
   * @param styleId - Style ID for enhancement
   * @param model - Optional model name (defaults to qwen-image-edit)
   * @returns Promise with the enhancement result
   */
  async enhanceImage(
    image: string,
    styleId: string,
    model: string = "qwen-image-edit"
  ): Promise<ImageEnhancementResponse> {
    try {
      const url = this.getEndpointUrl("enhanceImage");

      // Log the constructed URL for debugging
      console.log("Making request to:", url);
      console.log("Base URL:", this.baseUrl);
      console.log("Endpoint:", this.endpoints.enhanceImage);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image,
          styleId,
          model,
        } as ImageEnhancementRequest),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("Azure Function Error Response:", errorText);

        let errorMessage = "Unknown error";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || "Unknown error";
        } catch (e) {
          errorMessage = errorText || "Unknown error";
        }

        throw new Error(
          `Azure Function request failed: ${response.status} - ${errorMessage}`
        );
      }

      const data: ImageEnhancementResponse = await response.json();
      console.log("Azure Function Response:", data);

      return data;
    } catch (error) {
      console.error("Error calling Azure Function:", error);
      throw error;
    }
  }

  /**
   * Get all available image styles from the backend
   * @returns Promise with all available styles
   */
  async getImageStyles(): Promise<GetFiltersResponse> {
    try {
      const url = this.getEndpointUrl("getFilters");

      console.log("Fetching image styles from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("Get Filters Error Response:", errorText);

        let errorMessage = "Unknown error";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || "Unknown error";
        } catch (e) {
          errorMessage = errorText || "Unknown error";
        }

        throw new Error(
          `Get filters request failed: ${response.status} - ${errorMessage}`
        );
      }

      const data: GetFiltersResponse = await response.json();
      console.log("Get Filters Response:", data);

      return data;
    } catch (error) {
      console.error("Error fetching image styles:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const azureFunctionService = new AzureFunctionService();
