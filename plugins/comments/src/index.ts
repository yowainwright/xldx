import type { XldxPlugin } from "xldx";
import type { Comment, CommentData, CommentsPluginState, CellPosition } from "./types";
import {
  PLUGIN_NAME,
  PLUGIN_VERSION,
  VML_SHAPE_BASE_ID,
  VML_SHAPE_WIDTH,
  VML_SHAPE_HEIGHT,
  CELL_WIDTH_PT,
  CELL_HEIGHT_PT,
  XML_DECLARATION,
  COMMENTS_NAMESPACE,
  VML_NAMESPACES,
  CONTENT_TYPE_COMMENTS,
} from "./constants";

export type { Comment, CommentData, CommentsPluginState, CellPosition } from "./types";

function cellToRowCol(cell: string): CellPosition {
  const match = cell.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error(`Invalid cell reference: ${cell}`);
  const colStr = match[1];
  const row = parseInt(match[2], 10);
  const col = colStr.split("").reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0);
  return { row, col };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function groupBySheet<T extends { sheetIndex: number }>(items: T[]): Map<number, T[]> {
  return items.reduce((acc, item) => {
    const existing = acc.get(item.sheetIndex) || [];
    acc.set(item.sheetIndex, [...existing, item]);
    return acc;
  }, new Map<number, T[]>());
}

function generateCommentsXml(comments: CommentData[], authors: string[]): string {
  const authorXml = authors.map((a) => `<author>${escapeXml(a)}</author>`).join("");
  const commentXml = comments
    .map((c) => {
      const authorId = authors.indexOf(c.author);
      return `<comment ref="${c.cell}" authorId="${authorId}"><text><r><t>${escapeXml(c.text)}</t></r></text></comment>`;
    })
    .join("");

  return `${XML_DECLARATION}
<comments xmlns="${COMMENTS_NAMESPACE}">
<authors>${authorXml}</authors>
<commentList>${commentXml}</commentList>
</comments>`;
}

function generateVmlDrawing(comments: CommentData[]): string {
  const shapes = comments
    .map((c, i) => {
      const { row, col } = cellToRowCol(c.cell);
      return `<v:shape id="_x0000_s${VML_SHAPE_BASE_ID + i}" type="#_x0000_t202" style="position:absolute;margin-left:${col * CELL_WIDTH_PT}pt;margin-top:${(row - 1) * CELL_HEIGHT_PT}pt;width:${VML_SHAPE_WIDTH}pt;height:${VML_SHAPE_HEIGHT}pt;z-index:${i + 1};visibility:hidden" fillcolor="#ffffe1" o:insetmode="auto">
<v:fill color2="#ffffe1"/>
<v:shadow color="black" obscured="t"/>
<v:path o:connecttype="none"/>
<v:textbox style="mso-direction-alt:auto"><div style="text-align:left"></div></v:textbox>
<x:ClientData ObjectType="Note">
<x:MoveWithCells/>
<x:SizeWithCells/>
<x:Anchor>${col},15,${row - 1},10,${col + 2},31,${row + 3},9</x:Anchor>
<x:AutoFill>False</x:AutoFill>
<x:Row>${row - 1}</x:Row>
<x:Column>${col - 1}</x:Column>
</x:ClientData>
</v:shape>`;
    })
    .join("\n");

  return `${XML_DECLARATION}
<xml xmlns:v="${VML_NAMESPACES.v}" xmlns:o="${VML_NAMESPACES.o}" xmlns:x="${VML_NAMESPACES.x}">
<o:shapelayout v:ext="edit"><o:idmap v:ext="edit" data="1"/></o:shapelayout>
<v:shapetype id="_x0000_t202" coordsize="21600,21600" o:spt="202" path="m,l,21600r21600,l21600,xe">
<v:stroke joinstyle="miter"/><v:path gradientshapeok="t" o:connecttype="rect"/>
</v:shapetype>
${shapes}
</xml>`;
}

export function commentsPlugin(): XldxPlugin & {
  addComment(comment: Comment): void;
  getComments(): readonly Comment[];
} {
  const state: CommentsPluginState = {
    comments: [],
    authors: [],
  };

  return {
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,

    addComment(comment: Comment): void {
      const sheetIndex = 0;
      if (!state.authors.includes(comment.author)) {
        state.authors.push(comment.author);
      }
      state.comments.push({
        sheetIndex,
        cell: comment.cell,
        author: comment.author,
        text: comment.text,
      });
    },

    getComments(): readonly Comment[] {
      return state.comments.map((c) => ({
        cell: c.cell,
        author: c.author,
        text: c.text,
      }));
    },

    afterGenerate(files: Map<string, string | Uint8Array>): void {
      if (state.comments.length === 0) return;

      const commentsBySheet = groupBySheet(state.comments);

      Array.from(commentsBySheet.entries()).forEach(([sheetIndex, sheetComments]) => {
        const commentsXml = generateCommentsXml(sheetComments, state.authors);
        const vmlXml = generateVmlDrawing(sheetComments);

        files.set(`xl/comments${sheetIndex + 1}.xml`, commentsXml);
        files.set(`xl/drawings/vmlDrawing${sheetIndex + 1}.vml`, vmlXml);
      });
    },

    getContentTypes(): readonly string[] {
      if (state.comments.length === 0) return [];

      const sheets = [...new Set(state.comments.map((c) => c.sheetIndex))];
      return sheets.map(
        (sheetIndex) =>
          `<Override PartName="/xl/comments${sheetIndex + 1}.xml" ContentType="${CONTENT_TYPE_COMMENTS}"/>`,
      );
    },

    getRelationships(): readonly { id: string; type: string; target: string }[] {
      return [];
    },
  };
}

export function addComment(
  plugin: ReturnType<typeof commentsPlugin>,
  comment: Comment,
): void {
  plugin.addComment(comment);
}
