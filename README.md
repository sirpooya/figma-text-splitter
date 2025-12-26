# Text Splitter - Figma Plugin

A Figma plugin that splits selected text layers into multiple text layers based on a delimiter.

## Features

- Split text layers by any delimiter (comma, semicolon, space, etc.)
- Preserves original text styling (font, size, color, alignment, etc.)
- Works with multiple selected text layers
- Clean, simple UI

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

1. Select one or more text layers in Figma
2. Run the plugin from `Plugins` → `Development` → `Text Splitter`
3. Enter a delimiter (default is comma)
4. Click "Split Text"
5. The selected text layers will be split into multiple text layers, each containing one part of the original text

## Development

- `code.ts` - Main plugin code (runs in Figma context)
- `ui.html` - Plugin UI (runs in iframe)
- `manifest.json` - Plugin configuration

To watch for changes during development:
```bash
npm run watch
```

## Example

If you have a text layer with content: "Apple, Banana, Cherry"
And you use "," as the delimiter, it will create three text layers:
- "Apple"
- "Banana"
- "Cherry"

