// This plugin splits selected text nodes by a delimiter

console.log('Text Splitter plugin loaded');

// Escape special regex characters in delimiter
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Extract split logic into a reusable function
async function performSplit(delimiter: string, wrapInAutoLayout: boolean) {
  console.log('=== Text Splitter Debug ===');
  console.log('Delimiter received:', delimiter);
  console.log('Delimiter length:', delimiter ? delimiter.length : 0);
  console.log('Delimiter char codes:', delimiter ? delimiter.split('').map((c: string) => c.charCodeAt(0)) : []);
  console.log('Wrap in Auto-Layout:', wrapInAutoLayout);
  
  if (!delimiter || delimiter.trim() === '') {
    console.log('ERROR: Delimiter is empty');
    figma.notify('Please enter a delimiter');
    return;
  }
  
  const selection = figma.currentPage.selection;
  console.log('Selection count:', selection.length);
  console.log('Selection types:', selection.map(n => n.type));
  
  if (selection.length === 0) {
    console.log('ERROR: No selection');
    figma.notify('Please select at least one text layer');
    return;
  }

  const textNodes = selection.filter(node => node.type === 'TEXT') as TextNode[];
  console.log('Text nodes count:', textNodes.length);
  
  if (textNodes.length === 0) {
    console.log('ERROR: No text nodes in selection');
    figma.notify('Please select at least one text layer');
    return;
  }
  
  // Debug notification
  figma.notify(`Processing ${textNodes.length} text layer(s) with delimiter: "${delimiter}"`);

  let totalSplit = 0;
  const allNewNodes: (TextNode | FrameNode)[] = [];
  
  // Process each text node individually
  for (let nodeIndex = 0; nodeIndex < textNodes.length; nodeIndex++) {
    const textNode = textNodes[nodeIndex];
    console.log(`\n--- Processing text node ${nodeIndex + 1}/${textNodes.length} ---`);
    console.log('Node ID:', textNode.id);
    console.log('Node name:', textNode.name);
    
    const originalText = textNode.characters;
    console.log('Original text:', originalText);
    console.log('Original text length:', originalText.length);
    console.log('Original text char codes:', originalText.split('').map((c: string) => c.charCodeAt(0)));
    
    // Check if delimiter exists in text (simple string check first)
    const delimiterIndex = originalText.indexOf(delimiter);
    console.log('Delimiter index:', delimiterIndex);
    
    if (delimiterIndex === -1) {
      console.log('SKIP: Delimiter not found in this text node');
      continue;
    }
    
    // Escape delimiter for regex matching (treat as literal string, not regex pattern)
    const escapedDelimiter = escapeRegex(delimiter);
    console.log('Escaped delimiter:', escapedDelimiter);
    
    // Check if delimiter exists in text using regex
    const regex = new RegExp(escapedDelimiter, 'g');
    const matches = originalText.match(regex);
    console.log('Regex matches:', matches);
    console.log('Match count:', matches ? matches.length : 0);
    
    // Split the text by delimiter
    const parts = originalText.split(delimiter);
    console.log('Split parts:', parts);
    console.log('Parts count:', parts.length);
    console.log('Parts details:', parts.map((p, i) => `[${i}]: "${p}" (length: ${p.length})`));
    
    // Only proceed if we have parts to create (at least 2 parts)
    if (parts.length < 2) {
      console.log('SKIP: Less than 2 parts after split');
      continue;
    }

    // Get the original node's properties
    const parent = textNode.parent;
    console.log('Parent type:', parent ? parent.type : 'null');
    console.log('Parent ID:', parent ? parent.id : 'null');
    console.log('Parent name:', parent ? parent.name : 'null');
    
    const originalX = textNode.x;
    const originalY = textNode.y;
    const fontSize = textNode.fontSize as number;
    
    // Get font from the first character (handles mixed fonts and Symbol cases)
    let fontName: FontName;
    try {
      if (originalText.length > 0) {
        fontName = textNode.getRangeFontName(0, 1) as FontName;
        console.log('Font name from getRangeFontName:', fontName);
      } else {
        // Fallback if text is empty
        fontName = { family: 'Inter', style: 'Regular' };
        console.log('Using fallback font:', fontName);
      }
    } catch (error) {
      console.error('ERROR getting font name:', error);
      // Fallback font
      fontName = { family: 'Inter', style: 'Regular' };
      console.log('Using fallback font after error:', fontName);
    }
    
    console.log('Font name:', fontName);
    console.log('Font size:', fontSize);
    console.log('Position:', { x: originalX, y: originalY });
    
    const textAlign = textNode.textAlignHorizontal;
    const textStyle = textNode.textStyleId;
    const fills = textNode.fills;
    const letterSpacing = textNode.letterSpacing;
    const lineHeight = textNode.lineHeight;
    
    try {
      // Load font before creating text nodes
      console.log('Loading font...');
      await figma.loadFontAsync(fontName);
      console.log('Font loaded successfully');
    } catch (error) {
      console.error('ERROR loading font:', error);
      // Try fallback font
      try {
        console.log('Trying fallback font...');
        fontName = { family: 'Inter', style: 'Regular' };
        await figma.loadFontAsync(fontName);
        console.log('Fallback font loaded successfully');
      } catch (fallbackError) {
        console.error('ERROR loading fallback font:', fallbackError);
        continue;
      }
    }
    
    // Create new text nodes for each part
    const newNodes: TextNode[] = [];
    let currentTextIndex = 0; // Track position in original text
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      console.log(`\n  Processing part ${i + 1}/${parts.length}: "${part}"`);
      
      // Skip empty parts
      if (part === '') {
        console.log('  SKIP: Empty part');
        // Still advance the text index past the delimiter
        currentTextIndex += delimiter.length;
        continue;
      }
      
      try {
        // Calculate the start position of this part in the original text
        const partStartIndex = currentTextIndex;
        
        // Get font and style from the first character of this specific part
        let partFontName: FontName = fontName;
        let partTextStyle: string | undefined = textStyle ? (typeof textStyle === 'string' ? textStyle : undefined) : undefined;
        try {
          if (part.length > 0 && partStartIndex < originalText.length) {
            const endIndex = Math.min(partStartIndex + 1, originalText.length);
            partFontName = textNode.getRangeFontName(partStartIndex, endIndex) as FontName;
            const rangeTextStyle = textNode.getRangeTextStyleId(partStartIndex, endIndex);
            if (rangeTextStyle !== figma.mixed && typeof rangeTextStyle === 'string') {
              partTextStyle = rangeTextStyle;
            }
            console.log('  Font name from part range:', partFontName);
            console.log('  Text style from part range:', partTextStyle);
          }
        } catch (error) {
          console.error('  ERROR getting part font/style:', error);
          // Use defaults
        }
        
        // Create new text node
        console.log('  Creating new text node...');
        const newNode = figma.createText();
        console.log('  Text node created, ID:', newNode.id);
        
        // Load font and set properties BEFORE setting characters
        await figma.loadFontAsync(partFontName);
        newNode.fontName = partFontName;
        newNode.fontSize = fontSize;
        console.log('  Font properties set');
        
        // Set the text content
        console.log('  Setting characters to:', part);
        newNode.characters = part;
        console.log('  Characters set successfully');
        
        // Apply text style if available
        if (partTextStyle) {
          newNode.textStyleId = partTextStyle;
          console.log('  Text style applied');
        }
        
        // Advance text index past this part and the delimiter
        currentTextIndex += part.length + delimiter.length;
        
        // Apply other styling properties
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
        
        // Position the new node (same position for all, Auto-Layout will handle spacing)
        newNode.x = originalX;
        newNode.y = originalY;
        console.log('  Position set to:', { x: newNode.x, y: newNode.y });
        
        // Add to parent node (the parent of the original text node)
        // Check if parent is a valid container node
        console.log('  Attempting to append to parent...');
        if (parent && (parent.type === 'FRAME' || parent.type === 'GROUP' || parent.type === 'SECTION' || parent.type === 'COMPONENT' || parent.type === 'INSTANCE')) {
          parent.appendChild(newNode);
          console.log('  Appended to parent (type check)');
        } else if (parent && 'appendChild' in parent) {
          parent.appendChild(newNode);
          console.log('  Appended to parent (method check)');
        } else {
          // Fallback to current page if parent doesn't support appendChild
          figma.currentPage.appendChild(newNode);
          console.log('  Appended to current page (fallback)');
        }
        
        newNodes.push(newNode);
        allNewNodes.push(newNode);
        console.log('  Node added to arrays');
      } catch (error) {
        console.error(`  ERROR creating part ${i + 1}:`, error);
      }
    }
    
    console.log(`\nCreated ${newNodes.length} new nodes for this text layer`);
    
    // Remove the original node only if we created new ones
    if (newNodes.length > 0) {
      console.log('Removing original node...');
      textNode.remove();
      console.log('Original node removed');
      
      // Wrap in Auto-Layout if requested
      if (wrapInAutoLayout && newNodes.length > 0) {
        console.log('Wrapping nodes in Auto-Layout frame...');
        
        // Create Auto-Layout frame
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
        // Remove background
        autoLayoutFrame.fills = [];
        
        // Position frame at original node position
        autoLayoutFrame.x = originalX;
        autoLayoutFrame.y = originalY;
        
        // Move all new nodes into the Auto-Layout frame
        for (const newNode of newNodes) {
          // Remove from current parent
          const currentParent = newNode.parent;
          if (currentParent && 'removeChild' in currentParent) {
            try {
              (currentParent as any).removeChild(newNode);
            } catch (e) {
              console.log('Could not remove from parent, continuing...');
            }
          }
          // Add to Auto-Layout frame
          autoLayoutFrame.appendChild(newNode);
        }
        
        // Resize frame to fit content
        autoLayoutFrame.resize(autoLayoutFrame.width, autoLayoutFrame.height);
        
        // Add Auto-Layout frame to parent
        if (parent && (parent.type === 'FRAME' || parent.type === 'GROUP' || parent.type === 'SECTION' || parent.type === 'COMPONENT' || parent.type === 'INSTANCE')) {
          parent.appendChild(autoLayoutFrame);
          console.log('Auto-Layout frame appended to parent');
        } else if (parent && 'appendChild' in parent) {
          parent.appendChild(autoLayoutFrame);
          console.log('Auto-Layout frame appended to parent (method check)');
        } else {
          figma.currentPage.appendChild(autoLayoutFrame);
          console.log('Auto-Layout frame appended to current page (fallback)');
        }
        
        // Replace newNodes array with the Auto-Layout frame for selection
        const frameIndex = allNewNodes.indexOf(newNodes[0]);
        if (frameIndex !== -1) {
          // Remove all new nodes from allNewNodes and add the frame
          for (let i = 0; i < newNodes.length; i++) {
            const index = allNewNodes.indexOf(newNodes[i]);
            if (index !== -1) {
              allNewNodes.splice(index, 1);
            }
          }
          allNewNodes.push(autoLayoutFrame);
        }
        
        console.log('Auto-Layout frame created and nodes wrapped');
      }
      
      totalSplit++;
    } else {
      console.log('No new nodes created, keeping original');
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log('Total splits:', totalSplit);
  console.log('Total new nodes:', allNewNodes.length);
  
  // Select all new nodes at the end
  if (allNewNodes.length > 0) {
    console.log('Selecting all new nodes...');
    figma.currentPage.selection = allNewNodes;
    console.log('Selection set');
    figma.notify(`Split ${totalSplit} text layer(s) into ${allNewNodes.length} new layer(s)`);
    // Close plugin if run from command menu
    if (figma.command === 'split-with') {
      figma.closePlugin();
    }
  } else {
    console.log('No new nodes to select');
    figma.notify('No text layers were split. Make sure the delimiter exists in the selected text.');
  }
  
  console.log('=== End Debug ===\n');
}

// Handle parameter input for command palette
figma.parameters.on('input', ({ parameters, key, query, result }) => {
  if (key === 'delimiter') {
    // Allow freeform input, no suggestions needed
    result.setSuggestions([]);
  }
});

// Handle menu commands
figma.on('run', ({ command, parameters }) => {
  if (command === 'split-with' && parameters) {
    // Get delimiter from parameters
    const delimiter = parameters.delimiter as string;
    const wrapInAutoLayout = false; // Default to false for command palette
    
    // Run split directly without UI
    if (delimiter && delimiter.trim() !== '') {
      performSplit(delimiter, wrapInAutoLayout);
    } else {
      figma.notify('Please enter a delimiter');
      figma.closePlugin();
    }
  } else {
    // Show UI for all other cases (show-ui command, direct plugin run, etc.)
    figma.showUI(__html__, { width: 300, height: 156 });
  }
});

console.log('UI shown');

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log('=== MESSAGE HANDLER CALLED ===');
  console.log('Message type:', msg.type);
  console.log('Full message:', JSON.stringify(msg));
  
  try {
    if (msg.type === 'split-text') {
      const delimiter = msg.delimiter;
      const wrapInAutoLayout = (msg as any).wrapInAutoLayout || false;
      await performSplit(delimiter, wrapInAutoLayout);
    }
    
    if (msg.type === 'cancel') {
      console.log('Cancel requested');
      figma.closePlugin();
    }
  } catch (error) {
    console.error('ERROR in plugin:', error);
    figma.notify('Error: ' + (error as Error).message);
  }
};
