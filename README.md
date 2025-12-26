# Text Splitter - Figma Plugin

A powerful and fast Figma plugin that splits selected text layers into multiple text layers based on a custom delimiter. Perfect for breaking down lists, descriptions, or any text content that needs to be separated into individual layers.

## Features

- **Custom Delimiter Support**: Split text by any character or string (comma, semicolon, em dash, space, etc.)
- **Bulk Processing**: Process multiple selected text layers at once with optimized performance
- **Style Preservation**: Automatically preserves all original text styling including:
  - Font family and size (per character range)
  - Text color and fills
  - Text alignment
  - Letter spacing
  - Line height
  - Text styles (bold, regular, etc. - preserved per text segment)
- **Auto-Layout Wrapping** (Optional): Wrap split text layers in a horizontal Auto-Layout frame for easy organization
- **Smart Parent Detection**: New text layers are created in the same parent node as the original text layer
- **Command Palette Support**: Quick access via Cmd+K (Mac) or Ctrl+K (Windows) for fast splitting without UI
- **Optimized Performance**: Batch font loading and efficient algorithms for handling multiple text layers quickly
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

### Method 1: Using the UI

1. **Select Text Layers**: Select one or more text layers in Figma that you want to split
2. **Run the Plugin**: Go to `Plugins` → `Development` → `Text Splitter` → `Run Plugin`
3. **Enter Delimiter**: Type the character(s) you want to use as a delimiter (e.g., `,`, `;`, ` — `, etc.)
4. **Optional - Wrap in Auto-Layout**: Check the "Wrap in Auto-Layout" checkbox if you want the split layers wrapped in a horizontal Auto-Layout frame
5. **Split**: Click "Split Text" button
6. **Result**: Each occurrence of the delimiter will create a new text layer with the split content

### Method 2: Using Command Palette (Faster)

1. **Select Text Layers**: Select one or more text layers in Figma
2. **Open Command Palette**: Press **Cmd+K** (Mac) or **Ctrl+K** (Windows)
3. **Type Command**: Type "Split with" and select it
4. **Enter Delimiter**: Type your delimiter directly in the command palette
5. **Press Enter**: The plugin runs immediately without opening a UI

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

### Example 3: Mixed Font Styles

**Input Text Layer:**
```
**Bold text** — Regular text
```

**Delimiter:** ` — `

**Result:** Two text layers with preserved styles:
- `**Bold text**` (bold)
- ` Regular text` (regular)

### Example 4: With Auto-Layout

When "Wrap in Auto-Layout" is checked, all split text layers are wrapped in a horizontal Auto-Layout frame with:
- No background
- Zero gap between items
- Auto-sizing based on content
- Horizontal layout

## How It Works

1. The plugin reads the text content from each selected text layer
2. Searches for the specified delimiter using efficient string matching
3. Splits the text at each occurrence of the delimiter
4. Pre-loads all required fonts in batch for optimal performance
5. Creates new text layers for each split part
6. Applies original styling properties (including per-character font styles) to maintain visual consistency
7. Positions new layers (or wraps in horizontal Auto-Layout if enabled)
8. Places new layers in the same parent node as the original text layer
9. Removes the original text layer after successful split

## Performance Optimizations

The plugin includes several performance optimizations:

- **Batch Font Loading**: All fonts are collected upfront and loaded in parallel using `Promise.all()`
- **Font Caching**: Loaded fonts are cached to avoid redundant API calls
- **Early Exit**: Skips processing if delimiter is not found
- **Efficient Algorithms**: Optimized string matching and node creation
- **Minimal Logging**: Reduced console output for faster execution

These optimizations make the plugin fast even when processing dozens of text layers simultaneously.

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

## Menu Commands

The plugin provides two menu commands:

1. **Run Plugin** - Opens the full UI with all options
2. **Split with** - Quick command palette access (Cmd+K/Ctrl+K) for direct delimiter input

## Notes

- The plugin only processes text layers (TEXT node type)
- Empty parts after splitting are skipped
- If the delimiter is not found in a text layer, that layer is skipped
- Font loading is handled automatically with batch optimization and fallback to Inter Regular if needed
- The plugin preserves the exact text content, including leading/trailing whitespace
- Font styles (bold, regular, etc.) are preserved per text segment based on the original character ranges

## License

MIT
