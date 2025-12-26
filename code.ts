// This plugin splits selected text nodes by a delimiter

figma.showUI(__html__, { width: 300, height: 200 });

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'split-text') {
    const delimiter = msg.delimiter || ',';
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

    // Start a transaction to group all operations
    figma.skipInvisibleInstanceChildren = true;
    
    for (const textNode of textNodes) {
      const originalText = textNode.characters;
      const parts = originalText.split(delimiter);
      
      // Only split if delimiter is found
      if (parts.length <= 1) {
        continue;
      }

      // Get the original node's properties
      const parent = textNode.parent;
      const originalX = textNode.x;
      const originalY = textNode.y;
      const fontSize = textNode.fontSize;
      const fontName = textNode.fontName;
      const textAlign = textNode.textAlignHorizontal;
      const textStyle = textNode.textStyleId;
      const fills = textNode.fills;
      const letterSpacing = textNode.letterSpacing;
      const lineHeight = textNode.lineHeight;
      
      // Create new text nodes for each part
      const newNodes: TextNode[] = [];
      let currentY = originalY;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part === '') continue;
        
        const newNode = figma.createText();
        
        // Load font before setting text
        await figma.loadFontAsync(fontName as FontName);
        newNode.characters = part;
        
        // Apply original styling
        newNode.fontName = fontName;
        newNode.fontSize = fontSize;
        newNode.textAlignHorizontal = textAlign;
        if (textStyle) {
          newNode.textStyleId = textStyle;
        }
        if (fills) {
          newNode.fills = fills;
        }
        if (letterSpacing) {
          newNode.letterSpacing = letterSpacing;
        }
        if (lineHeight) {
          newNode.lineHeight = lineHeight;
        }
        
        // Position the new node
        newNode.x = originalX;
        newNode.y = currentY;
        
        // Add to parent
        if (parent && 'appendChild' in parent) {
          parent.appendChild(newNode);
        } else {
          figma.currentPage.appendChild(newNode);
        }
        
        newNodes.push(newNode);
        
        // Calculate next Y position (add some spacing)
        const spacing = typeof fontSize === 'number' ? fontSize * 0.2 : 0;
        currentY += newNode.height + spacing;
      }
      
      // Select the new nodes
      if (newNodes.length > 0) {
        figma.currentPage.selection = newNodes;
        // Remove the original node
        textNode.remove();
      }
    }
    
    figma.notify(`Split ${textNodes.length} text layer(s) successfully`);
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

