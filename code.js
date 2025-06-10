// Main plugin file for Font Category Manager
// Handles communication with UI and Figma API operations

// Default font categories and fonts
const DEFAULT_FONT_DATA = {
  categories: {
    'serif': {
      name: 'Serif',
      fonts: ['Times New Roman', 'Georgia', 'Merriweather']
    },
    'sans-serif': {
      name: 'Sans Serif', 
      fonts: ['Arial', 'Helvetica', 'Open Sans', 'Roboto']
    },
    'display': {
      name: 'Display',
      fonts: ['Impact', 'Bebas Neue', 'Oswald']
    },
    'monospace': {
      name: 'Monospace',
      fonts: ['Courier New', 'Monaco', 'Consolas']
    }
  }
};

// Show the plugin UI
figma.showUI(__html__, { 
  width: 400, 
  height: 600,
  themeColors: true 
});

// Load font data from client storage on startup
async function loadFontData() {
  try {
    const stored = await figma.clientStorage.getAsync('fontData');
    if (stored) {
      return stored;
    }
  } catch (error) {
    console.warn('Error loading font data:', error);
  }
  return DEFAULT_FONT_DATA;
}

// Save font data to client storage
async function saveFontData(fontData) {
  try {
    await figma.clientStorage.setAsync('fontData', fontData);
  } catch (error) {
    console.error('Error saving font data:', error);
  }
}

// Apply font to selected text layers
async function applyFontToSelection(fontName) {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No layers selected. Please select text layers to apply the font.'
    });
    return;
  }

  // Filter for text nodes
  const textNodes = selection.filter(node => node.type === 'TEXT');
  
  if (textNodes.length === 0) {
    figma.ui.postMessage({
      type: 'error', 
      message: 'No text layers selected. Please select text layers to apply the font.'
    });
    return;
  }

  try {
    // Load the font before applying
    await figma.loadFontAsync({ family: fontName, style: 'Regular' });
    
    let appliedCount = 0;
    
    for (const textNode of textNodes) {
      try {
        // Apply font to the entire text node
        textNode.fontName = { family: fontName, style: 'Regular' };
        appliedCount++;
      } catch (error) {
        console.warn(`Failed to apply font ${fontName} to text node:`, error);
      }
    }
    
    if (appliedCount > 0) {
      figma.ui.postMessage({
        type: 'success',
        message: `Applied ${fontName} to ${appliedCount} text layer${appliedCount > 1 ? 's' : ''}.`
      });
    } else {
      figma.ui.postMessage({
        type: 'error',
        message: `Failed to apply ${fontName}. The font might not be available.`
      });
    }
    
  } catch (error) {
    console.error('Error applying font:', error);
    figma.ui.postMessage({
      type: 'error',
      message: `Failed to load font ${fontName}. Make sure the font is installed and available.`
    });
  }
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'load-fonts':
      // Load and send font data to UI
      const fontData = await loadFontData();
      figma.ui.postMessage({
        type: 'font-data',
        data: fontData
      });
      break;
      
    case 'save-fonts':
      // Save font data from UI
      await saveFontData(msg.data);
      figma.ui.postMessage({
        type: 'success',
        message: 'Font data saved successfully!'
      });
      break;
      
    case 'apply-font':
      // Apply selected font to text layers
      await applyFontToSelection(msg.fontName);
      break;
      
    case 'close-plugin':
      // Close the plugin
      figma.closePlugin();
      break;
      
    default:
      console.warn('Unknown message type:', msg.type);
  }
};

// Initialize plugin
(async () => {
  const fontData = await loadFontData();
  figma.ui.postMessage({
    type: 'font-data', 
    data: fontData
  });
})();