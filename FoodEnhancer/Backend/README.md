# FoodEnhancer Backend API

Azure Function backend for the FoodEnhancer image enhancement service.

## API Endpoints

### 1. Enhance Image
**POST** `/api/enhanceimage`

Enhances an image using AI-powered filters.

**Request Body:**
```json
{
  "image": "base64_encoded_image_string",
  "styleId": "filter_id"
}
```

> **Note**: The model type is determined by the `IMAGE_MODEL_TYPE` environment variable.

**Response:**
```json
{
  "success": true,
  "imageUrl": "enhanced_image_url"
}
```

### 2. Add Filter
**POST** `/api/addfilter`

Adds a new image enhancement filter.

**Request Body:**
```json
{
  "title": "Filter Title",
  "prompt": "Detailed AI prompt for the filter",
  "imageUrl": "URL to the filter's result image"
}
```

**Response:**
```json
{
  "success": true,
  "filterId": "new_filter_id"
}
```

### 3. Get All Filters
**GET** `/api/getfilters`

Retrieves all available image enhancement filters.

**Response:**
```json
{
  "success": true,
  "filters": [
    {
      "id": "1",
      "promptTitle": "Filter Title",
      "prompt": "Filter prompt",
      "thumbnail": "filter-thumbnail",
      "resultImage": "/filters/filter-image.png"
    }
  ],
  "count": 1
}
```

### 4. Delete Filter
**DELETE** `/api/deletefilter`

Deletes an existing filter.

**Request Body:**
```json
{
  "filterId": "filter_id_to_delete"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Filter with ID filter_id deleted successfully"
}
```

## Environment Variables

- `DASHSCOPE_API_KEY`: API key for DashScope AI service
- `IMAGE_MODEL_TYPE`: Model type to use for image enhancement. Options:
  - `qwen-image-edit` (default) - Synchronous model, returns results immediately
  - `wan` - Asynchronous model (WAN 2.5), uses polling for results

### Model Types

#### Qwen Image Edit Model (`qwen-image-edit`)
- **Behavior**: Synchronous - returns image URL immediately
- **Use Case**: Faster response times, suitable for real-time applications
- **No Polling Required**: Results returned in initial API response

#### WAN Model (`wan`)
- **Behavior**: Asynchronous - requires polling for results
- **Use Case**: More advanced image processing capabilities
- **Polling**: Automatically polls for task completion every 5 seconds (max 5 minutes)
- **Task Statuses**: PENDING → RUNNING → SUCCEEDED/FAILED/CANCELED

### Image Processing

The backend automatically handles figure images referenced in `imageStyles.json`:

1. **Automatic URL to Base64 Conversion**: If a style includes `FiguresImagesUrls`, these URLs are automatically fetched and converted to base64 format before sending to the AI model
2. **Parallel Processing**: Multiple images are fetched concurrently for optimal performance
3. **Error Handling**: If any image fails to download, a clear error message is returned
4. **Format Support**: Supports all common image formats (PNG, JPEG, WebP, GIF, etc.)

This ensures the DashScope API can process all images without requiring external URL access.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start local development
npm start
```

## Project Structure

- `index.ts` - Main Azure Function with all API endpoints
- `imageStyles.json` - Configuration file containing filter definitions
- `function.json` - Azure Function configuration
- `host.json` - Azure Functions host configuration

