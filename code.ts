// This plugin splits selected text nodes by a delimiter

figma.showUI(__html__, { width: 300, height: 200 });

// Escape special regex characters in delimiter
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'split-text') {
    const delimiter = msg.delimiter;
    
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
    const allNewNodes: TextNode[] = [];
    
    // Process each text node individually
    for (const textNode of textNodes) {
      const originalText = textNode.characters;
      
      // Escape delimiter for regex matching (treat as literal string, not regex pattern)
      const escapedDelimiter = escapeRegex(delimiter);
      
      // Check if delimiter exists in text using regex
      const regex = new RegExp(escapedDelimiter, 'g');
      const matches = originalText.match(regex);
      
      if (!matches || matches.length === 0) {
        // Delimiter not found in this text node, skip it
        continue;
      }
      
      // Split the text by delimiter
      const parts = originalText.split(delimiter);
      
      // Only proceed if we have parts to create (at least 2 parts)
      if (parts.length < 2) {
        continue;
      }

      // Get the original node's properties
      const parent = textNode.parent;
      const originalX = textNode.x;
      const originalY = textNode.y;
      const fontSize = textNode.fontSize as number;
      const fontName = textNode.fontName as FontName;
      const textAlign = textNode.textAlignHorizontal;
      const textStyle = textNode.textStyleId;
      const fills = textNode.fills;
      const letterSpacing = textNode.letterSpacing;
      const lineHeight = textNode.lineHeight;
      
      // Load font before creating text nodes
      await figma.loadFontAsync(fontName);
      
      // Create new text nodes for each part
      const newNodes: TextNode[] = [];
      let currentY = originalY;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        // Skip empty parts
        if (part === '') continue;
        
        // Create new text node
        const newNode = figma.createText();
        
        // Load font and set properties BEFORE setting characters
        await figma.loadFontAsync(fontName);
        newNode.fontName = fontName;
        newNode.fontSize = fontSize;
        
        // Set the text content
        newNode.characters = part;
        
        // Apply other styling properties
        if (textAlign) {
          newNode.textAlignHorizontal = textAlign;
        }
        if (textStyle) {
          newNode.textStyleId = textStyle;
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
        newNode.y = currentY;
        
        // Add to parent node (the parent of the original text node)
        // Check if parent is a valid container node
        if (parent && (parent.type === 'FRAME' || parent.type === 'GROUP' || parent.type === 'SECTION' || parent.type === 'COMPONENT' || parent.type === 'INSTANCE')) {
          parent.appendChild(newNode);
        } else if (parent && 'appendChild' in parent) {
          parent.appendChild(newNode);
        } else {
          // Fallback to current page if parent doesn't support appendChild
          figma.currentPage.appendChild(newNode);
        }
        
        newNodes.push(newNode);
        allNewNodes.push(newNode);
        
        // Calculate next Y position (add some spacing)
        const spacing = fontSize * 0.2;
        currentY += newNode.height + spacing;
      }
      
      // Remove the original node only if we created new ones
      if (newNodes.length > 0) {
        textNode.remove();
        totalSplit++;
      }
    }
    
    // Select all new nodes at the end
    if (allNewNodes.length > 0) {
      figma.currentPage.selection = allNewNodes;
      figma.notify(`Split ${totalSplit} text layer(s) into ${allNewNodes.length} new layer(s)`);
    } else {
      figma.notify('No text layers were split. Make sure the delimiter exists in the selected text.');
    }
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
