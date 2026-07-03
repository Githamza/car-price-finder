// popup.js
document.getElementById('applyTheme').addEventListener('click', async () => {
    const fileInput = document.getElementById('themeFile');
    const statusDiv = document.getElementById('status');
    
    if (!fileInput.files.length) {
      statusDiv.textContent = 'Please select a theme file';
      return;
    }
  
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const themeData = JSON.parse(e.target.result);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateBubbleColors',
          theme: themeData
        }, (response) => {
          console.log({response})
          if (response && response.success) {
            statusDiv.textContent = 'Colors updated successfully!';
          } else {
            statusDiv.textContent = 'Error: ' + (response?.error || 'Unknown error');
          }
        });
      } catch (error) {
        statusDiv.textContent = 'Error parsing theme file';
      }
    };
    
    reader.readAsText(file);
  });
  
  // content.js
  function findColorTokenWrapper(caption) {
    const tokenCaptions = Array.from(document.querySelectorAll('.token-caption'));
    return tokenCaptions.find(el => el.textContent.toLowerCase() === caption.toLowerCase())?.closest('.token-wrapper');
  }
  
  function updateColorInput(wrapper, color) {
    if (!wrapper) return false;
    
    const input = wrapper.querySelector('.color-input');
    const swatch = wrapper.querySelector('.color-swatch');
    
    if (input && swatch) {
      // Update the input value
      input.value = color;
      
      // Update the swatch background
      swatch.style.background = color;
      
      // Trigger input event to ensure Bubble's internal state updates
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      return true;
    }
    return false;
  }
  
  function createNewColorToken() {
    const createButton = document.querySelector('.buttermilk-button.wide.grey');
    if (createButton) {
      createButton.click();
    }
  }
  
  function updateBubbleColors(theme) {
    // Get the light scheme colors
    const colors = theme.schemes.light;
    
    // Define color mappings (Material Theme to Bubble.io token names)
    const colorMappings = {
      'primary': colors.primary,
      'on primary': colors.onPrimary,
      'primary container': colors.primaryContainer,
      'on primary container': colors.onPrimaryContainer,
      'secondary': colors.secondary,
      'on secondary': colors.onSecondary,
      'secondary container': colors.secondaryContainer,
      'on secondary container': colors.onSecondaryContainer,
      'tertiary': colors.tertiary,
      'on tertiary': colors.onTertiary,
      'tertiary container': colors.tertiaryContainer,
      'on tertiary container': colors.onTertiaryContainer,
      'error': colors.error,
      'on error': colors.onError,
      'error container': colors.errorContainer,
      'on error container': colors.onErrorContainer,
      'background': colors.background,
      'on background': colors.onBackground,
      'surface': colors.surface,
      'on surface': colors.onSurface,
      'surface variant': colors.surfaceVariant,
      'on surface variant': colors.onSurfaceVariant,
      'outline': colors.outline,
      'outline variant': colors.outlineVariant
    };
  
    // Update each color token
    let updatedCount = 0;
    for (const [tokenName, color] of Object.entries(colorMappings)) {
      const wrapper = findColorTokenWrapper(tokenName);
      if (updateColorInput(wrapper, color)) {
        updatedCount++;
      }
    }
  
    return {
      success: true,
      message: `Updated ${updatedCount} color tokens`
    };
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBubbleColors') {
      try {
        const result = updateBubbleColors(request.theme);
        sendResponse({ success: true, ...result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    }
    return true; // Keep message channel open for async response
  });