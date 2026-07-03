# Style Gallery Feature

## Overview
The Style Gallery feature allows users to select from predefined photography styles that will be automatically applied to their food images during the enhancement process.

## Features

### 1. Predefined Photography Styles
- **Moody Food Photography**: Dark, dramatic lighting with rich colors and shallow depth of field
- **Bright & Airy Lifestyle**: Natural daylight with clean, minimalist aesthetic
- **Vintage Film Aesthetic**: Nostalgic, warm tones with subtle grain texture
- **High-Key Studio Lighting**: Professional, bright lighting perfect for commercial use

### 2. Interactive Gallery
- Visual thumbnails with representative icons and colors
- Hover effects with selection buttons
- Clear selection indicators
- Responsive grid layout (1-4 columns based on screen size)

### 3. Integration with Enhancement Process
- Selected style prompt is automatically combined with user's additional instructions
- Styles are applied before sending to the AI enhancement API
- Selection persists until reset or new selection

## How It Works

### 1. Style Selection
1. User uploads a food image
2. User browses the style gallery and selects a desired photography style
3. Selected style is highlighted with a blue ring and checkmark
4. Style information is displayed below the gallery

### 2. Enhancement Process
1. When user clicks "Edit Photo", the selected style prompt is combined with any additional user instructions
2. Combined prompt is sent to the AI enhancement service
3. Image is processed with the selected photography aesthetic
4. Results are displayed in the Results tab

### 3. Data Structure
Each style contains:
- `id`: Unique identifier
- `promptTitle`: Human-readable name
- `prompt`: Detailed photography instructions for AI
- `thumbnail`: Visual identifier for the style

## Technical Implementation

### Components
- `StyleGallery.tsx`: Main gallery component with selection logic
- `UploadTab.tsx`: Updated to include style selection
- `ImageEditor.tsx`: Updated to handle style selection
- `App.tsx`: Updated to manage style state and combine prompts

### State Management
- `selectedStyle`: Stores the complete style object
- `selectedStyleId`: Stores the selected style ID for UI updates
- Style selection is reset when starting a new image upload

### File Structure
```
src/
├── data/
│   └── imageStyles.json          # Style definitions
├── components/
│   ├── StyleGallery.tsx          # Style selection gallery
│   ├── tabs/
│   │   └── UploadTab.tsx         # Updated with style gallery
│   └── ImageEditor.tsx           # Updated with style handling
└── App.tsx                       # Updated with style state
```

## Usage Examples

### Basic Style Selection
```typescript
// User selects "Moody Food Photography"
const selectedStyle = {
  id: "1",
  promptTitle: "Moody Food Photography",
  prompt: "A highly detailed food photography style...",
  thumbnail: "moody-food"
};
```

### Prompt Combination
```typescript
// Original user prompt: "Make it more appetizing"
// Selected style prompt: "A highly detailed food photography style..."
// Final combined prompt: "A highly detailed food photography style... Make it more appetizing"
```

## Customization

### Adding New Styles
1. Add new style object to `src/data/imageStyles.json`
2. Include `id`, `promptTitle`, `prompt`, and `thumbnail` fields
3. Add corresponding thumbnail colors and icons in `StyleGallery.tsx`

### Modifying Existing Styles
1. Edit the prompt text in `imageStyles.json`
2. Update the `promptTitle` for better user understanding
3. Adjust thumbnail colors/icons if needed

## Benefits

1. **Consistency**: Users get professional-quality results with predefined styles
2. **Ease of Use**: No need to write complex photography instructions
3. **Professional Results**: Styles are crafted by photography experts
4. **Flexibility**: Users can still add custom instructions on top of selected styles
5. **Visual Selection**: Intuitive gallery interface makes style selection easy

## Future Enhancements

- Style previews with sample images
- User-created custom styles
- Style categories (e.g., "Restaurant", "Social Media", "Product")
- Style popularity metrics
- A/B testing for style effectiveness
