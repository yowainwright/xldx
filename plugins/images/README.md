# @xldx/images

Embed images in Excel worksheets.

## Installation

```bash
bun add @xldx/images
```

## Usage

```typescript
import { Xldx } from 'xldx';
import { imagesPlugin, addImage } from '@xldx/images';

const plugin = imagesPlugin();

const xldx = new Xldx(data)
  .use(plugin)
  .createSheet({ name: 'Report' }, ...columns);

addImage(plugin, {
  cell: 'A1',
  image: imageBuffer,  // Uint8Array
  width: 200,
  height: 100
});

const xlsx = await xldx.toUint8Array();
```

## API

### `imagesPlugin()`

Creates a new images plugin instance.

### `addImage(plugin, options)`

Adds an image to the plugin.

```typescript
interface ImageOptions {
  cell: string;           // Cell reference (e.g., "A1")
  image: Uint8Array;      // Image data as bytes
  width: number;          // Display width in pixels
  height: number;         // Display height in pixels
  type?: ImageType;       // Optional: 'png' | 'jpeg' | 'gif'
  offsetX?: number;       // Optional: horizontal offset in pixels
  offsetY?: number;       // Optional: vertical offset in pixels
  sheet?: string;         // Optional: sheet name
}
```

## Supported Formats

- **PNG** - Auto-detected by `0x89 0x50 0x4E 0x47` header
- **JPEG** - Auto-detected by `0xFF 0xD8 0xFF` header
- **GIF** - Auto-detected by `0x47 0x49 0x46 0x38` header

## Examples

### From File (Bun/Node)

```typescript
const imageBuffer = await Bun.file('./logo.png').arrayBuffer();
const imageData = new Uint8Array(imageBuffer);

addImage(plugin, {
  cell: 'A1',
  image: imageData,
  width: 200,
  height: 100
});
```

### From URL (Browser)

```typescript
const response = await fetch('/images/logo.png');
const imageData = new Uint8Array(await response.arrayBuffer());

addImage(plugin, {
  cell: 'A1',
  image: imageData,
  width: 200,
  height: 100
});
```

## License

Elastic-2.0
