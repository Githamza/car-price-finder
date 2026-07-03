"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFilter = exports.getFilters = exports.addFilter = exports.httpTrigger = void 0;
const functions_1 = require("@azure/functions");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load image styles from JSON file
function loadImageStyles() {
    try {
        const stylesPath = path.join(__dirname, "imageStyles.json");
        const stylesData = fs.readFileSync(stylesPath, "utf8");
        return JSON.parse(stylesData);
    }
    catch (error) {
        console.error("Error loading image styles:", error);
        return [];
    }
}
// Get prompt by style ID
function getPromptByStyleId(styleId) {
    const styles = loadImageStyles();
    const style = styles.find((s) => s.id === styleId);
    return style ? style.prompt : null;
}
function getFiguresImagesUrlsByStyleId(styleId) {
    const styles = loadImageStyles();
    const style = styles.find((s) => s.id === styleId);
    return style ? style.FiguresImagesUrls : undefined;
}
// Convert image URL to base64
async function convertImageUrlToBase64(imageUrl, context) {
    try {
        context.log(`Fetching image from URL: ${imageUrl}`);
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        // Get content type from response or default to image/png
        const contentType = response.headers.get("content-type") || "image/png";
        const base64WithPrefix = `data:${contentType};base64,${base64}`;
        context.log(`Successfully converted image to base64 (${buffer.length} bytes)`);
        return base64WithPrefix;
    }
    catch (error) {
        context.error(`Error converting image URL to base64:`, error);
        throw new Error(`Failed to convert image URL to base64: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
// Convert multiple image URLs to base64
async function convertImageUrlsToBase64(imageUrls, context) {
    const promises = imageUrls.map((url) => convertImageUrlToBase64(url, context));
    return Promise.all(promises);
}
// Determine model type from environment or default
function getModelType() {
    const modelType = process.env.IMAGE_MODEL_TYPE?.toLowerCase();
    return modelType === "wan" ? "wan" : "qwen-image-edit";
}
// Get model name based on type
function getModelName(modelType) {
    return modelType === "wan" ? "wan2.5-i2i-preview" : "qwen-image-edit";
}
// Build request for Qwen Image Edit model
function buildQwenImageEditRequest(model, image, prompt, figuresImagesUrls) {
    const images = [image, ...(figuresImagesUrls || [])];
    console.log(figuresImagesUrls);
    //encodeurl
    const hardcodedImage = "https://ajblxmolmmvvnobpzzhr.supabase.co/storage/v1/object/public/productsophotos/1754134344390-jz051h51r8q.jpeg";
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
function buildWanModelRequest(model, image, prompt, figuresImagesUrls) {
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
async function callDashScopeAPI(request, apiKey, modelType, context) {
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };
    // Add async header for WAN model
    if (modelType === "wan") {
        headers["X-DashScope-Async"] = "enable";
    }
    context.log(`Calling DashScope API with model type: ${modelType}`);
    const url = modelType === "wan"
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
async function pollTaskStatus(taskId, apiKey, context, maxAttempts = 60, pollInterval = 5000) {
    const pollUrl = `https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            context.log(`Polling task ${taskId}, attempt ${attempt + 1}/${maxAttempts}`);
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
            const data = await response.json();
            context.log(`Task status: ${data.output.task_status}`);
            // Check if task is in a terminal state
            if (data.output.task_status === "SUCCEEDED") {
                context.log("Task succeeded!");
                return data;
            }
            else if (["FAILED", "CANCELED", "UNKNOWN"].includes(data.output.task_status)) {
                context.error(`Task ended with status: ${data.output.task_status}`);
                throw new Error(`Task ${data.output.task_status.toLowerCase()}`);
            }
            // Task is still PENDING or RUNNING, wait before next poll
            if (attempt < maxAttempts - 1) {
                await new Promise((resolve) => setTimeout(resolve, pollInterval));
            }
        }
        catch (error) {
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
async function processModelResponse(data, modelType, apiKey, context) {
    if (modelType === "wan") {
        // WAN model uses async tasks
        if (!data.output?.task_id || !data.output?.task_status) {
            throw new Error("Invalid async task response");
        }
        context.log(`Async task created with ID: ${data.output.task_id}`);
        context.log(`Initial task status: ${data.output.task_status}`);
        const taskResult = await pollTaskStatus(data.output.task_id, apiKey, context);
        if (!taskResult.output.results || taskResult.output.results.length === 0) {
            throw new Error("Task completed but no image was returned");
        }
        return taskResult.output.results[0].url;
    }
    else {
        // Qwen Image Edit model returns synchronously
        if (!data.output?.choices?.[0]?.message?.content?.[0]?.image) {
            throw new Error("No image returned from API");
        }
        return data.output.choices[0].message.content[0].image;
    }
}
async function httpTrigger(request, context) {
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
        const body = (await request.json());
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
        let figuresImagesBase64;
        if (figuresImagesUrls && figuresImagesUrls.length > 0) {
            try {
                context.log(`Converting ${figuresImagesUrls.length} figure images to base64...`);
                figuresImagesBase64 = await convertImageUrlsToBase64(figuresImagesUrls, context);
                context.log(`Successfully converted all figure images to base64`);
            }
            catch (error) {
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
                        error: `Failed to process figure images: ${error instanceof Error ? error.message : "Unknown error"}`,
                    },
                };
            }
        }
        // Determine model type and build request
        const modelType = getModelType();
        const modelName = getModelName(modelType);
        context.log(`Using model type: ${modelType}, model name: ${modelName}`);
        const dashScopeRequest = modelType === "wan"
            ? buildWanModelRequest(modelName, image, prompt, figuresImagesUrls)
            : buildQwenImageEditRequest(modelName, image, prompt, figuresImagesUrls);
        // Call DashScope API
        const response = await callDashScopeAPI(dashScopeRequest, apiKey, modelType, context);
        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            context.error(`DashScope API error: ${response.status} - ${errorText}`);
            let errorMessage = "Unknown error";
            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.error?.message || errorData.message || "Unknown error";
            }
            catch (e) {
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
        context.log("DashScope API response received:", JSON.stringify(data, null, 2));
        // Process response based on model type
        const imageUrl = await processModelResponse(data, modelType, apiKey, context);
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
    }
    catch (error) {
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
exports.httpTrigger = httpTrigger;
// Function to add a new filter
async function addFilter(request, context) {
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
        const body = (await request.json());
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
        const newId = (Math.max(...styles.map((s) => parseInt(s.id))) + 1).toString();
        // Create new filter
        const newFilter = {
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
        }
        catch (writeError) {
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
    }
    catch (error) {
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
exports.addFilter = addFilter;
// Function to get all filters
async function getFilters(request, context) {
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
    }
    catch (error) {
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
exports.getFilters = getFilters;
// Function to delete a filter
async function deleteFilter(request, context) {
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
        const body = (await request.json());
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
        }
        catch (writeError) {
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
    }
    catch (error) {
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
exports.deleteFilter = deleteFilter;
functions_1.app.http("enhanceimage", {
    methods: ["POST", "OPTIONS"],
    authLevel: "anonymous",
    handler: httpTrigger,
});
functions_1.app.http("addfilter", {
    methods: ["POST", "OPTIONS"],
    authLevel: "anonymous",
    handler: addFilter,
});
functions_1.app.http("getfilters", {
    methods: ["GET", "OPTIONS"],
    authLevel: "anonymous",
    handler: getFilters,
});
functions_1.app.http("deletefilter", {
    methods: ["DELETE", "OPTIONS"],
    authLevel: "anonymous",
    handler: deleteFilter,
});
//# sourceMappingURL=index.js.map