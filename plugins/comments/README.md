# @xldx/comments

Add comments and notes to Excel cells.

## Installation

```bash
bun add @xldx/comments
```

## Usage

```typescript
import { Xldx } from "xldx";
import { commentsPlugin, addComment } from "@xldx/comments";

const plugin = commentsPlugin();

const xldx = new Xldx(data)
  .use(plugin)
  .createSheet({ name: "Report" }, ...columns);

addComment(plugin, {
  cell: "A1",
  author: "System",
  text: "This value was auto-calculated",
});

addComment(plugin, {
  cell: "B2",
  author: "Reviewer",
  text: "Please verify this data",
});

const xlsx = await xldx.toUint8Array();
```

## API

### `commentsPlugin()`

Creates a new comments plugin instance.

### `addComment(plugin, comment)`

Adds a comment to the plugin.

```typescript
interface Comment {
  cell: string; // Cell reference (e.g., "A1", "B2")
  author: string; // Comment author name
  text: string; // Comment text content
  sheet?: string; // Optional sheet name
}
```

### Plugin Methods

- `plugin.addComment(comment)` - Add a comment directly
- `plugin.getComments()` - Get all comments

## License

[O'Sassy](https://osaasy.dev)
