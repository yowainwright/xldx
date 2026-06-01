export interface Comment {
  readonly cell: string;
  readonly author: string;
  readonly text: string;
  readonly sheet?: string;
}

export interface CommentData {
  sheetIndex: number;
  cell: string;
  author: string;
  text: string;
}

export interface CommentsPluginState {
  comments: CommentData[];
  authors: string[];
}

export interface CellPosition {
  row: number;
  col: number;
}
