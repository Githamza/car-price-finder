// Configuration file for FoodEnhancer app
// In production, these values should come from environment variables

// Helper function to ensure URLs have proper protocol
const ensureHttps = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
};

export const config = {
  // Azure Function Configuration
  azureFunction: {
    // IMPORTANT: REACT_APP_FUNCTION_URL must include the full protocol (https://)
    // Examples:
    // ✅ REACT_APP_FUNCTION_URL=https://foodenhancerfunction.azurewebsites.net
    // ❌ REACT_APP_FUNCTION_URL=foodenhancerfunction.azurewebsites.net (missing protocol)
    baseUrl:
      (process.env.REACT_APP_FUNCTION_URL &&
        ensureHttps(process.env.REACT_APP_FUNCTION_URL)) ||
      "http://localhost:7071",
    endpoints: {
      enhanceImage: "/api/enhanceimage",
      getFilters: "/api/getfilters",
      addFilter: "/api/addfilter",
      deleteFilter: "/api/deletefilter",
    },
  },

  // Application Configuration
  app: {
    name: process.env.REACT_APP_NAME || "FoodEnhancer",
    siteUrl: process.env.REACT_APP_SITE_URL || "https://foodenhancer.app",
    version: process.env.REACT_APP_VERSION || "1.0.0",
  },

  // Image Processing Settings
  imageProcessing: {
    maxFileSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || "10485760"), // 10MB
    supportedFormats: ["image/jpeg", "image/png", "image/webp"],
    maxDimensions: {
      width: parseInt(process.env.REACT_APP_MAX_DIMENSIONS_WIDTH || "1024"),
      height: parseInt(process.env.REACT_APP_MAX_DIMENSIONS_HEIGHT || "1024"),
    },
    compression: {
      quality: parseFloat(process.env.REACT_APP_COMPRESSION_QUALITY || "0.7"),
      maxWidth: parseInt(process.env.REACT_APP_COMPRESSION_MAX_WIDTH || "800"),
      maxHeight: parseInt(
        process.env.REACT_APP_COMPRESSION_MAX_HEIGHT || "800"
      ),
    },
  },
};

// Helper function to get configuration value
export const getConfig = (key: string) => {
  const keys = key.split(".");
  let value: any = config;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }

  return value;
};
