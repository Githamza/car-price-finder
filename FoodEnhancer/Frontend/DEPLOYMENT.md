# FoodEnhancer Frontend Deployment Guide

## Environment Variables

### Required Environment Variables

When deploying the FoodEnhancer frontend, ensure the following environment variables are properly set:

#### `REACT_APP_FUNCTION_URL`
- **Purpose**: Base URL for the Azure Function backend
- **Format**: Should include the full URL with protocol
- **Examples**:
  - ✅ `https://foodenhancerfunction.azurewebsites.net`
  - ✅ `https://your-function-app.azurewebsites.net`
  - ❌ `foodenhancerfunction.azurewebsites.net` (missing protocol)
  - ❌ `http://foodenhancerfunction.azurewebsites.net` (insecure)

#### `REACT_APP_NAME`
- **Purpose**: Application name
- **Default**: "FoodEnhancer"

#### `REACT_APP_SITE_URL`
- **Purpose**: Frontend application URL
- **Default**: "https://foodenhancer.app"

#### `REACT_APP_VERSION`
- **Purpose**: Application version
- **Default**: "1.0.0"

## Common Deployment Issues

### 1. Malformed API URLs
**Problem**: API calls result in malformed URLs like:
```
https://foodenhancerwebapp.z6.web.core.windows.net/foodenhancerfunction.azurewebsites.net/api/enhanceimage
```

**Cause**: Missing `https://` protocol in the `REACT_APP_FUNCTION_URL` environment variable

**Solution**: Ensure `REACT_APP_FUNCTION_URL` includes the full protocol:
```bash
REACT_APP_FUNCTION_URL=https://foodenhancerfunction.azurewebsites.net
```

### 2. CORS Issues
**Problem**: API calls fail with CORS errors

**Solution**: Ensure the Azure Function has proper CORS configuration for your frontend domain

### 3. Environment Variable Not Loading
**Problem**: Environment variables are not being read in production

**Solution**: 
- Ensure environment variables are set in your hosting platform
- For Azure Static Web Apps, use the "Configuration" section
- For other platforms, check their environment variable documentation

## Azure Static Web Apps Configuration

If deploying to Azure Static Web Apps, add these environment variables in the Azure Portal:

1. Go to your Static Web App
2. Navigate to "Configuration" → "Application settings"
3. Add the following key-value pairs:

```
REACT_APP_FUNCTION_URL = https://foodenhancerfunction.azurewebsites.net
REACT_APP_NAME = FoodEnhancer
REACT_APP_SITE_URL = https://your-app-name.azurestaticapps.net
```

## Testing Configuration

After deployment, check the browser console for these log messages:
```
AzureFunctionService initialized with: {
  baseUrl: "https://foodenhancerfunction.azurewebsites.net",
      endpoint: "/api/enhanceimage",
      fullUrl: "https://foodenhancerfunction.azurewebsites.net/api/enhanceimage"
}
```

If you see malformed URLs, check your environment variable configuration.

## Build and Deploy Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test the build locally
npx serve -s build

# Deploy to your hosting platform
# (Follow your hosting platform's deployment instructions)
```

## Troubleshooting

### Check Environment Variables
```bash
# Check if environment variables are loaded
echo $REACT_APP_FUNCTION_URL
```

### Verify URL Construction
The application logs the constructed URLs to the console. Check for:
- Correct base URL
- Proper endpoint
- No double slashes or malformed URLs

### Test API Endpoint
Test the API endpoint directly:
```bash
curl -X POST https://foodenhancerfunction.azurewebsites.net/api/enhanceimage \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'
```
