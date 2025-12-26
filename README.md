# Text Splitter - Figma Plugin

A powerful Figma plugin that splits selected text layers into multiple text layers based on a custom delimiter. Perfect for breaking down lists, descriptions, or any text content that needs to be separated into individual layers.

## Features

- **Custom Delimiter Support**: Split text by any character or string (comma, semicolon, em dash, space, etc.)
- **Bulk Processing**: Process multiple selected text layers at once
- **Style Preservation**: Automatically preserves all original text styling including:
  - Font family and size
  - Text color and fills
  - Text alignment
  - Letter spacing
  - Line height
  - Text styles
- **Auto-Layout Wrapping** (Optional): Wrap split text layers in an Auto-Layout frame for easy organization
- **Smart Parent Detection**: New text layers are created in the same parent node as the original text layer
- **Clean UI**: Simple, intuitive interface with delimiter input and Auto-Layout option

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. In Figma Desktop:
   - Go to `Plugins` → `Development` → `Import plugin from manifest...`
   - Select the `manifest.json` file from this directory

## Usage

1. **Select Text Layers**: Select one or more text layers in Figma that you want to split
2. **Run the Plugin**: Go to `Plugins` → `Development` → `Text Splitter`
3. **Enter Delimiter**: Type the character(s) you want to use as a delimiter (e.g., `,`, `;`, ` — `, etc.)
4. **Optional - Wrap in Auto-Layout**: Check the "Wrap in Auto-Layout" checkbox if you want the split layers wrapped in an Auto-Layout frame
5. **Split**: Click "Split Text" button
6. **Result**: Each occurrence of the delimiter will create a new text layer with the split content

## Examples

### Example 1: Comma-separated List

**Input Text Layer:**
```
Apple, Banana, Cherry
```

**Delimiter:** `,`

**Result:** Three text layers:
- `Apple`
- ` Banana`
- ` Cherry`

### Example 2: Em Dash Separated Text

**Input Text Layer:**
```
Onboarded — completes design system onboarding/training
```

**Delimiter:** ` — ` (em dash with spaces)

**Result:** Two text layers:
- `Onboarded `
- ` completes design system onboarding/training`

### Example 3: With Auto-Layout

When "Wrap in Auto-Layout" is checked, all split text layers are wrapped in a vertical Auto-Layout frame with:
- No background
- Zero gap between items
- Auto-sizing based on content

## How It Works

1. The plugin reads the text content from each selected text layer
2. Searches for the specified delimiter using regex matching
3. Splits the text at each occurrence of the delimiter
4. Creates new text layers for each split part
5. Applies all original styling properties to maintain visual consistency
6. Positions new layers vertically with spacing (or wraps in Auto-Layout if enabled)
7. Places new layers in the same parent node as the original text layer
8. Removes the original text layer after successful split

## Development

### Project Structure

- `code.ts` - Main plugin code (runs in Figma context)
- `ui.html` - Plugin UI (runs in iframe)
- `manifest.json` - Plugin configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and rebuild automatically

### Building

After making changes to the code:

1. Run `npm run build` to compile TypeScript
2. Reload the plugin in Figma (right-click plugin → "Reload plugin")

## Requirements

- Figma Desktop App (plugins don't run in the browser)
- Node.js and npm
- TypeScript

## Notes

- The plugin only processes text layers (TEXT node type)
- Empty parts after splitting are skipped
- If the delimiter is not found in a text layer, that layer is skipped
- Font loading is handled automatically, with fallback to Inter Regular if needed
- The plugin preserves the exact text content, including leading/trailing whitespace

## License

MIT
