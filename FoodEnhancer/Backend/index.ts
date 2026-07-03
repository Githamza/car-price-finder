import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import * as fs from "fs";
import * as path from "path";

interface ImageEnhancementRequest {
  image: string; // base64 encoded image
  styleId: string; // style ID instead of prompt
  model?: string;
}

type ModelType = "qwen-image-edit" | "wan";

interface QwenImageEditRequest {
  model: string;
  input: {
    messages: Array<{
      role: string;
      content: Array<{ image: string } | { text: string }>;
    }>;
  };
  parameters: {
    negative_prompt?: string;
    watermark: boolean;
    stream: boolean;
  };
}

interface WanModelRequest {
  model: string;
  input: {
    prompt: string;
    images: string[];
  };
  parameters: {
    size?: string;
    n: number;
  };
}

interface ImageEnhancementResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface TaskStatusResponse {
  request_id: string;
  output: {
    task_id: string;
    task_status:
      | "PENDING"
      | "RUNNING"
      | "SUCCEEDED"
      | "FAILED"
      | "CANCELED"
      | "UNKNOWN";
    submit_time?: string;
    scheduled_time?: string;
    end_time?: string;
    results?: Array<{
      orig_prompt: string;
      url: string;
    }>;
    task_metrics?: {
      TOTAL: number;
      FAILED: number;
      SUCCEEDED: number;
    };
  };
  usage?: {
    image_count: number;
  };
}

interface ImageStyle {
  id: string;
  promptTitle: string;
  prompt: string;
  thumbnail: string;
  resultImage: string;
  FiguresImagesUrls?: string[];
}

interface AddFilterRequest {
  title: string;
  prompt: string;
  imageUrl: string;
}

interface AddFilterResponse {
  success: boolean;
  filterId?: string;
  error?: string;
}

interface DeleteFilterRequest {
  filterId: string;
}

// Load image styles from JSON file
function loadImageStyles(): ImageStyle[] {
  try {
    const stylesPath = path.join(__dirname, "imageStyles.json");
    const stylesData = fs.readFileSync(stylesPath, "utf8");
    return JSON.parse(stylesData);
  } catch (error) {
    console.error("Error loading image styles:", error);
    return [];
  }
}

// Get prompt by style ID
function getPromptByStyleId(styleId: string): string | null {
  const styles = loadImageStyles();
  const style = styles.find((s) => s.id === styleId);
  return style ? style.prompt : null;
}

function getFiguresImagesUrlsByStyleId(styleId: string): string[] | undefined {
  const styles = loadImageStyles();
  const style = styles.find((s) => s.id === styleId);
  return style ? style.FiguresImagesUrls : undefined;
}

// Convert image URL to base64
async function convertImageUrlToBase64(
  imageUrl: string,
  context: InvocationContext
): Promise<string> {
  try {
    context.log(`Fetching image from URL: ${imageUrl}`);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // Get content type from response or default to image/png
    const contentType = response.headers.get("content-type") || "image/png";
    const base64WithPrefix = `data:${contentType};base64,${base64}`;

    context.log(
      `Successfully converted image to base64 (${buffer.length} bytes)`
    );
    return base64WithPrefix;
  } catch (error) {
    context.error(`Error converting image URL to base64:`, error);
    throw new Error(
      `Failed to convert image URL to base64: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Convert multiple image URLs to base64
async function convertImageUrlsToBase64(
  imageUrls: string[],
  context: InvocationContext
): Promise<string[]> {
  const promises = imageUrls.map((url) =>
    convertImageUrlToBase64(url, context)
  );
  return Promise.all(promises);
}

// Determine model type from environment or default
function getModelType(): ModelType {
  const modelType = process.env.IMAGE_MODEL_TYPE?.toLowerCase();
  return modelType === "wan" ? "wan" : "qwen-image-edit";
}

// Get model name based on type
function getModelName(modelType: ModelType): string {
  return modelType === "wan" ? "wan2.5-i2i-preview" : "qwen-image-edit";
}

// Build request for Qwen Image Edit model
function buildQwenImageEditRequest(
  model: string,
  image: string,
  prompt: string,
  figuresImagesUrls?: string[]
): QwenImageEditRequest {
  const images = [image, ...(figuresImagesUrls || [])];
  console.log(figuresImagesUrls);
  //encodeurl
  const hardcodedImage =
    "https://ajblxmolmmvvnobpzzhr.supabase.co/storage/v1/object/public/productsophotos/1754134344390-jz051h51r8q.jpeg";
  return {
    model,
    input: {
      messages: [
        {
          role: "user",
          content: [
            {
              image,
            },
            ...(figuresImagesUrls || []).map((url) => ({ image: url })),
            { text: prompt },
          ],
        },
      ],
    },
    parameters: {
      watermark: false,
      stream: true,
    },
  };
}

// Build request for WAN model
function buildWanModelRequest(
  model: string,
  image: string,
  prompt: string,
  figuresImagesUrls?: string[]
): WanModelRequest {
  let images = [image, ...(figuresImagesUrls || [])];

  return {
    model,
    input: {
      prompt,
      images,
    },
    parameters: {
      n: 1,
    },
  };
}

// Call DashScope API with appropriate configuration
async function callDashScopeAPI(
  request: QwenImageEditRequest | WanModelRequest,
  apiKey: string,
  modelType: ModelType,
  context: InvocationContext
): Promise<any> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Add async header for WAN model
  if (modelType === "wan") {
    headers["X-DashScope-Async"] = "enable";
  }

  context.log(`Calling DashScope API with model type: ${modelType}`);
  const url =
    modelType === "wan"
      ? "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis"
      : "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  return response;
}

// Poll for task status (WAN model only)
async function pollTaskStatus(
  taskId: string,
  apiKey: string,
  context: InvocationContext,
  maxAttempts: number = 60,
  pollInterval: number = 5000
): Promise<TaskStatusResponse> {
  const pollUrl = `https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      context.log(
        `Polling task ${taskId}, attempt ${attempt + 1}/${maxAttempts}`
      );

      const response = await fetch(pollUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        context.error(`Polling error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to poll task status: ${response.status}`);
      }

      const data: TaskStatusResponse = await response.json();
      context.log(`Task status: ${data.output.task_status}`);

      // Check if task is in a terminal state
      if (data.output.task_status === "SUCCEEDED") {
        context.log("Task succeeded!");
        return data;
      } else if (
        ["FAILED", "CANCELED", "UNKNOWN"].includes(data.output.task_status)
      ) {
        context.error(`Task ended with status: ${data.output.task_status}`);
        throw new Error(`Task ${data.output.task_status.toLowerCase()}`);
      }

      // Task is still PENDING or RUNNING, wait before next poll
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    } catch (error) {
      context.error(`Error during polling attempt ${attempt + 1}:`, error);
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      // Wait before retrying on error
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error("Task polling timed out");
}

// Process response based on model type
async function processModelResponse(
  data: any,
  modelType: ModelType,
  apiKey: string,
  context: InvocationContext
): Promise<string> {
  if (modelType === "wan") {
    // WAN model uses async tasks
    if (!data.output?.task_id || !data.output?.task_status) {
      throw new Error("Invalid async task response");
    }

    context.log(`Async task created with ID: ${data.output.task_id}`);
    context.log(`Initial task status: ${data.output.task_status}`);

    const taskResult = await pollTaskStatus(
      data.output.task_id,
      apiKey,
      context
    );

    if (!taskResult.output.results || taskResult.output.results.length === 0) {
      throw new Error("Task completed but no image was returned");
    }

    return taskResult.output.results[0].url;
  } else {
    // Qwen Image Edit model returns synchronously
    if (!data.output?.choices?.[0]?.message?.content?.[0]?.image) {
      throw new Error("No image returned from API");
    }

    return data.output.choices[0].message.content[0].image;
  }
}
export async function httpTrigger(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Image enhancement function processed a request.");

  // Handle CORS preflight request
  if (request.method === "OPTIONS") {
    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    };
  }

  try {
    const body = (await request.json()) as ImageEnhancementRequest;
    const { image, styleId } = body;

    // Validate request
    if (!image || !styleId) {
      return {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: false,
          error: "Missing required fields: image and styleId",
        },
      };
    }

    // Get prompt and additional images from style ID
    const prompt = getPromptByStyleId(styleId);
    if (!prompt) {
      return {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: false,
          error: `Style ID '${styleId}' not found`,
        },
      };
    }

    const figuresImagesUrls = getFiguresImagesUrlsByStyleId(styleId);

    // Get API key from environment
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      context.error("DASHSCOPE_API_KEY environment variable not set");
      return {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { success: false, error: "API configuration error" },
      };
    }

    // Convert figure image URLs to base64
    let figuresImagesBase64: string[] | undefined;
    if (figuresImagesUrls && figuresImagesUrls.length > 0) {
      try {
        context.log(
          `Converting ${figuresImagesUrls.length} figure images to base64...`
        );
        figuresImagesBase64 = await convertImageUrlsToBase64(
          figuresImagesUrls,
          context
        );
        context.log(`Successfully converted all figure images to base64`);
      } catch (error) {
        context.error("Failed to convert figure images to base64:", error);
        return {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
          jsonBody: {
            success: false,
            error: `Failed to process figure images: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        };
      }
    }

    // Determine model type and build request
    const modelType = getModelType();
    const modelName = getModelName(modelType);
    context.log(`Using model type: ${modelType}, model name: ${modelName}`);

    const dashScopeRequest =
      modelType === "wan"
        ? buildWanModelRequest(modelName, image, prompt, figuresImagesUrls)
        : buildQwenImageEditRequest(
            modelName,
            image,
            prompt,
            figuresImagesUrls
          );

    // Call DashScope API
    const response = await callDashScopeAPI(
      dashScopeRequest,
      apiKey,
      modelType,
      context
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      context.error(`DashScope API error: ${response.status} - ${errorText}`);

      let errorMessage = "Unknown error";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage =
          errorData.error?.message || errorData.message || "Unknown error";
      } catch (e) {
        errorMessage = errorText || "Unknown error";
      }

      return {
        status: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: false,
          error: `API request failed: ${errorMessage}`,
        },
      };
    }

    // Parse response
    const data = await response.json();
    context.log(
      "DashScope API response received:",
      JSON.stringify(data, null, 2)
    );

    // Process response based on model type
    const imageUrl = await processModelResponse(
      data,
      modelType,
      apiKey,
      context
    );
    context.log("Image URL obtained:", imageUrl);

    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      jsonBody: {
        success: true,
        imageUrl,
      },
    };
  } catch (error) {
    context.error("Error in image enhancement function:", error);
    return {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
    };
  }
}

// Function to add a new filter
export async function addFilter(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Add filter function processed a request.");

  // Handle CORS preflight request
  if (request.method === "OPTIONS") {
    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    };
  }

  try {
    const body = (await request.json()) as AddFilterRequest;
    const { title, prompt, imageUrl } = body;

    // Validate request
    if (!title || !prompt || !imageUrl) {
      return {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: false,
          error: "Missing required fields: title, prompt, and imageUrl",
        },
      };
    }

    // Load existing styles
    const styles = loadImageStyles();

    // Generate new ID (simple increment for now)
    const newId = (
      Math.max(...styles.map((s) => parseInt(s.id))) + 1
    ).toString();

    // Create new filter
    const newFilter: ImageStyle = {
      id: newId,
      promptTitle: title,
      prompt: prompt,
      thumbnail: title.toLowerCase().replace(/\s+/g, "-"),
      resultImage: imageUrl,
    };

    // Add to styles array
    styles.push(newFilter);

    // Save back to file
    try {
      const stylesPath = path.join(__dirname, "imageStyles.json");
      fs.writeFileSync(stylesPath, JSON.stringify(styles, null, 2), "utf8");

      context.log(`New filter added with ID: ${newId}`);

      return {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: true,
          filterId: newId,
        },
      };
    } catch (writeError) {
      context.error("Error writing to imageStyles.json:", writeError);
      return {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: false,
          error: "Failed to save filter",
        },
      };
    }
  } catch (error) {
    context.error("Error in add filter function:", error);
    return {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
    };
  }
}

// Function to get all filters
export async function getFilters(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Get filters function processed a request.");

  // Handle CORS preflight request
  if (request.method === "OPTIONS") {
    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    };
  }

  try {
    const styles = loadImageStyles();

    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      jsonBody: {
        success: true,
        filters: styles,
        count: styles.length,
      },
    };
  } catch (error) {
    context.error("Error in get filters function:", error);
    return {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
    };
  }
}

// Function to delete a filter
export async function deleteFilter(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Delete filter function processed a request.");

  // Handle CORS preflight request
  if (request.method === "OPTIONS") {
    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    };
  }

  try {
    const body = (await request.json()) as DeleteFilterRequest;
    const { filterId } = body;

    // Validate request
    if (!filterId) {
      return {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: false,
          error: "Missing required field: filterId",
        },
      };
    }

    // Load existing styles
    const styles = loadImageStyles();

    // Find and remove the filter
    const filterIndex = styles.findIndex((s) => s.id === filterId);

    if (filterIndex === -1) {
      return {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: false,
          error: `Filter with ID '${filterId}' not found`,
        },
      };
    }

    // Remove the filter
    styles.splice(filterIndex, 1);

    // Save back to file
    try {
      const stylesPath = path.join(__dirname, "imageStyles.json");
      fs.writeFileSync(stylesPath, JSON.stringify(styles, null, 2), "utf8");

      context.log(`Filter with ID ${filterId} deleted successfully`);

      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: true,
          message: `Filter with ID ${filterId} deleted successfully`,
        },
      };
    } catch (writeError) {
      context.error("Error writing to imageStyles.json:", writeError);
      return {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: {
          success: false,
          error: "Failed to delete filter",
        },
      };
    }
  } catch (error) {
    context.error("Error in delete filter function:", error);
    return {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
    };
  }
}

app.http("enhanceimage", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: httpTrigger,
});

app.http("addfilter", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: addFilter,
});

app.http("getfilters", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  handler: getFilters,
});

app.http("deletefilter", {
  methods: ["DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: deleteFilter,
});
