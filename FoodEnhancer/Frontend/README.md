# FoodEnhancer 🍽️✨

A professional food photo enhancement application that transforms ordinary food photos into stunning, restaurant-quality images perfect for menus and online ordering platforms.

## Features

- **Drag & Drop Upload**: Easy image upload with drag-and-drop support
- **AI-Powered Enhancement**: Uses OpenRouter's Qwen LLM model for intelligent photo enhancement
- **Professional Results**: Transforms food photos with better lighting, colors, and composition
- **Custom Instructions**: Add specific enhancement requests for personalized results
- **Download Enhanced Images**: Save your enhanced photos in high quality
- **Enhancement History**: Track all your previous enhancements
- **Modern UI**: Built with React, TypeScript, and shadcn/ui components
- **Responsive Design**: Works perfectly on desktop and mobile devices

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **AI Integration**: Azure Functions + Alibaba Cloud DashScope API
- **Icons**: Lucide React
- **Build Tool**: Create React App
- **Backend**: Azure Functions (Node.js)

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Azure Functions Core Tools (for local development)
- Azure subscription (for deployment)
- Alibaba Cloud DashScope API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FoodEnhancer/food-enhancer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Enhancement
1. **Upload Image**: Drag and drop a food photo or click to browse
2. **Add Instructions** (Optional): Specify enhancement preferences
3. **Enhance**: Click the "Enhance Photo" button
4. **Download**: Save your enhanced image

### Enhancement Instructions Examples
- "Make it look more appetizing with warm lighting"
- "Enhance colors and add professional shadows"
- "Create a restaurant menu quality photo"
- "Improve composition and food presentation"

## Environment Variables

Create a `.env` file in the project root to customize the application configuration:

```bash
# Azure Function Configuration
REACT_APP_FUNCTION_URL=http://localhost:7071/api

# Application Configuration
REACT_APP_NAME=FoodEnhancer
REACT_APP_SITE_URL=https://foodenhancer.app
REACT_APP_VERSION=1.0.0

# Image Processing Settings
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_MAX_DIMENSIONS_WIDTH=1024
REACT_APP_MAX_DIMENSIONS_HEIGHT=1024
REACT_APP_COMPRESSION_QUALITY=0.7
REACT_APP_COMPRESSION_MAX_WIDTH=800
REACT_APP_COMPRESSION_MAX_HEIGHT=800
```

**Note**: All environment variables must be prefixed with `REACT_APP_` to be accessible in the React application.

## API Configuration

The app is pre-configured with OpenRouter API integration using the Qwen 3.2 35B model. The API key is already included in the code.

**Note**: In a production environment, you should:
- Move the API key to environment variables
- Implement proper error handling
- Add rate limiting and user authentication

## Project Structure

```
src/
├── components/
│   └── ui/           # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── lib/
│   └── utils.ts      # Utility functions
├── App.tsx           # Main application component
├── App.css           # Global styles and Tailwind
└── index.tsx         # Application entry point
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Customization

### Styling
- Modify `src/App.css` for global styles
- Update Tailwind classes in components
- Customize color scheme in CSS variables

### Components
- Add new UI components in `src/components/ui/`
- Extend existing components with additional variants
- Implement new enhancement features

### AI Integration
- Modify the prompt in `enhanceImage()` function
- Add different enhancement models
- Implement batch processing

## Future Enhancements

- [ ] Real-time image preview during enhancement
- [ ] Multiple enhancement styles (vintage, modern, artistic)
- [ ] Batch image processing
- [ ] User accounts and cloud storage
- [ ] Integration with popular restaurant platforms
- [ ] Advanced image editing tools
- [ ] Export in multiple formats and resolutions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Built with ❤️ for restaurants and food businesses worldwide**
