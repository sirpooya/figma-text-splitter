// This plugin splits selected text nodes by a delimiter

// Escape special regex characters in delimiter
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Extract split logic into a reusable function
async function performSplit(delimiter: string, wrapInAutoLayout: boolean) {
  if (!delimiter || delimiter.trim() === '') {
    figma.notify('Please enter a delimiter');
    return;
  }
  
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.notify('Please select at least one text layer');
    return;
  }

  const textNodes = selection.filter(node => node.type === 'TEXT') as TextNode[];
  
  if (textNodes.length === 0) {
    figma.notify('Please select at least one text layer');
    return;
  }

  let totalSplit = 0;
  const allNewNodes: (TextNode | FrameNode)[] = [];
  
  // Pre-collect all unique fonts to batch load them
  const fontCache = new Map<string, FontName>();
  const fontsToLoad = new Set<string>();
  
  // First pass: collect all fonts that will be needed
  for (const textNode of textNodes) {
    const originalText = textNode.characters;
    if (!originalText.includes(delimiter)) continue;
    
    const parts = originalText.split(delimiter);
    if (parts.length < 2) continue;
    
    let currentTextIndex = 0;
    for (const part of parts) {
      if (part === '') {
        currentTextIndex += delimiter.length;
        continue;
      }
      
      try {
        const partStartIndex = currentTextIndex;
        if (partStartIndex < originalText.length) {
          const endIndex = Math.min(partStartIndex + 1, originalText.length);
          const fontName = textNode.getRangeFontName(partStartIndex, endIndex) as FontName;
          const fontKey = `${fontName.family}-${fontName.style}`;
          fontCache.set(fontKey, fontName);
          fontsToLoad.add(fontKey);
        }
      } catch (e) {
        // Use fallback
        const fallbackKey = 'Inter-Regular';
        if (!fontCache.has(fallbackKey)) {
          fontCache.set(fallbackKey, { family: 'Inter', style: 'Regular' });
          fontsToLoad.add(fallbackKey);
        }
      }
      
      currentTextIndex += part.length + delimiter.length;
    }
  }
  
  // Batch load all fonts upfront
  const fontLoadPromises: Promise<void>[] = [];
  for (const fontKey of fontsToLoad) {
    const fontName = fontCache.get(fontKey)!;
    fontLoadPromises.push(
      figma.loadFontAsync(fontName).catch(() => {
        // Try fallback if font fails
        const fallback = { family: 'Inter', style: 'Regular' };
        return figma.loadFontAsync(fallback);
      })
    );
  }
  
  await Promise.all(fontLoadPromises);
  
  // Process each text node
  for (const textNode of textNodes) {
    const originalText = textNode.characters;
    
    if (!originalText.includes(delimiter)) {
      continue;
    }
    
    const parts = originalText.split(delimiter);
    
    if (parts.length < 2) {
      continue;
    }

    const parent = textNode.parent;
    const originalX = textNode.x;
    const originalY = textNode.y;
    const fontSize = textNode.fontSize as number;
    const textAlign = textNode.textAlignHorizontal;
    const defaultTextStyle = textNode.textStyleId;
    const fills = textNode.fills;
    const letterSpacing = textNode.letterSpacing;
    const lineHeight = textNode.lineHeight;
    
    // Get default font
    let defaultFontName: FontName;
    try {
      if (originalText.length > 0) {
        defaultFontName = textNode.getRangeFontName(0, 1) as FontName;
      } else {
        defaultFontName = { family: 'Inter', style: 'Regular' };
      }
    } catch (error) {
      defaultFontName = { family: 'Inter', style: 'Regular' };
    }
    
    // Ensure default font is loaded
    const defaultFontKey = `${defaultFontName.family}-${defaultFontName.style}`;
    if (!fontCache.has(defaultFontKey)) {
      await figma.loadFontAsync(defaultFontName);
      fontCache.set(defaultFontKey, defaultFontName);
    }
    
    // Create new text nodes for each part
    const newNodes: TextNode[] = [];
    let currentTextIndex = 0;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part === '') {
        currentTextIndex += delimiter.length;
        continue;
      }
      
      try {
        const partStartIndex = currentTextIndex;
        
        // Get font and style for this part
        let partFontName: FontName = defaultFontName;
        let partTextStyle: string | undefined = defaultTextStyle ? (typeof defaultTextStyle === 'string' ? defaultTextStyle : undefined) : undefined;
        
        try {
          if (partStartIndex < originalText.length) {
            const endIndex = Math.min(partStartIndex + 1, originalText.length);
            partFontName = textNode.getRangeFontName(partStartIndex, endIndex) as FontName;
            const rangeTextStyle = textNode.getRangeTextStyleId(partStartIndex, endIndex);
            if (rangeTextStyle !== figma.mixed && typeof rangeTextStyle === 'string') {
              partTextStyle = rangeTextStyle;
            }
          }
        } catch (error) {
          // Use defaults
        }
        
        // Create new text node
        const newNode = figma.createText();
        
        // Font should already be loaded from batch loading
        const partFontKey = `${partFontName.family}-${partFontName.style}`;
        if (!fontCache.has(partFontKey)) {
          await figma.loadFontAsync(partFontName);
          fontCache.set(partFontKey, partFontName);
        }
        
        newNode.fontName = partFontName;
        newNode.fontSize = fontSize;
        newNode.characters = part;
        
        if (partTextStyle) {
          newNode.textStyleId = partTextStyle;
        }
        
        currentTextIndex += part.length + delimiter.length;
        
        // Apply styling properties
        if (textAlign) {
          newNode.textAlignHorizontal = textAlign;
        }
        if (fills && Array.isArray(fills)) {
          newNode.fills = fills;
        }
        if (letterSpacing && typeof letterSpacing === 'object') {
          newNode.letterSpacing = letterSpacing;
        }
        if (lineHeight && typeof lineHeight === 'object') {
          newNode.lineHeight = lineHeight;
        }
        
        // Position the new node
        newNode.x = originalX;
        newNode.y = originalY;
        
        // Add to parent
        if (parent && (parent.type === 'FRAME' || parent.type === 'GROUP' || parent.type === 'SECTION' || parent.type === 'COMPONENT' || parent.type === 'INSTANCE')) {
          parent.appendChild(newNode);
        } else if (parent && 'appendChild' in parent) {
          parent.appendChild(newNode);
        } else {
          figma.currentPage.appendChild(newNode);
        }
        
        newNodes.push(newNode);
        allNewNodes.push(newNode);
      } catch (error) {
        // Continue with next part on error
      }
    }
    
    // Remove the original node only if we created new ones
    if (newNodes.length > 0) {
      textNode.remove();
      
      // Wrap in Auto-Layout if requested
      if (wrapInAutoLayout && newNodes.length > 0) {
        const autoLayoutFrame = figma.createFrame();
        autoLayoutFrame.name = 'Text Split';
        autoLayoutFrame.layoutMode = 'HORIZONTAL';
        autoLayoutFrame.primaryAxisSizingMode = 'AUTO';
        autoLayoutFrame.counterAxisSizingMode = 'AUTO';
        autoLayoutFrame.paddingLeft = 0;
        autoLayoutFrame.paddingRight = 0;
        autoLayoutFrame.paddingTop = 0;
        autoLayoutFrame.paddingBottom = 0;
        autoLayoutFrame.itemSpacing = 0;
        autoLayoutFrame.fills = [];
        autoLayoutFrame.x = originalX;
        autoLayoutFrame.y = originalY;
        
        // Move all new nodes into the Auto-Layout frame
        for (const newNode of newNodes) {
          const currentParent = newNode.parent;
          if (currentParent && 'removeChild' in currentParent) {
            try {
              (currentParent as any).removeChild(newNode);
            } catch (e) {
              // Continue if removal fails
            }
          }
          autoLayoutFrame.appendChild(newNode);
        }
        
        // Add Auto-Layout frame to parent
        if (parent && (parent.type === 'FRAME' || parent.type === 'GROUP' || parent.type === 'SECTION' || parent.type === 'COMPONENT' || parent.type === 'INSTANCE')) {
          parent.appendChild(autoLayoutFrame);
        } else if (parent && 'appendChild' in parent) {
          parent.appendChild(autoLayoutFrame);
        } else {
          figma.currentPage.appendChild(autoLayoutFrame);
        }
        
        // Replace newNodes with frame in allNewNodes
        const frameIndex = allNewNodes.indexOf(newNodes[0]);
        if (frameIndex !== -1) {
          for (let i = 0; i < newNodes.length; i++) {
            const index = allNewNodes.indexOf(newNodes[i]);
            if (index !== -1) {
              allNewNodes.splice(index, 1);
            }
          }
          allNewNodes.push(autoLayoutFrame);
        }
      }
      
      totalSplit++;
    }
  }
  
  // Select all new nodes at the end
  if (allNewNodes.length > 0) {
    figma.currentPage.selection = allNewNodes;
    figma.notify(`Split ${totalSplit} text layer(s) into ${allNewNodes.length} new layer(s)`);
    if (figma.command === 'split-with') {
      figma.closePlugin();
    }
  } else {
    figma.notify('No text layers were split. Make sure the delimiter exists in the selected text.');
  }
}

// Handle parameter input for command palette
figma.parameters.on('input', ({ parameters, key, query, result }) => {
  if (key === 'delimiter') {
    result.setSuggestions([]);
  }
});

// Handle menu commands
figma.on('run', ({ command, parameters }) => {
  if (command === 'split-with' && parameters) {
    const delimiter = parameters.delimiter as string;
    const wrapInAutoLayout = false;
    
    if (delimiter && delimiter.trim() !== '') {
      performSplit(delimiter, wrapInAutoLayout);
    } else {
      figma.notify('Please enter a delimiter');
      figma.closePlugin();
    }
  } else {
    figma.showUI(__html__, { width: 300, height: 156 });
  }
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'split-text') {
      const delimiter = msg.delimiter;
      const wrapInAutoLayout = (msg as any).wrapInAutoLayout || false;
      await performSplit(delimiter, wrapInAutoLayout);
    }
    
    if (msg.type === 'cancel') {
      figma.closePlugin();
    }
  } catch (error) {
    figma.notify('Error: ' + (error as Error).message);
  }
};
