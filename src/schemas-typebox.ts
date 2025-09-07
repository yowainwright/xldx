/**
 * Schema definitions using TypeBox
 * These schemas can generate both static types and runtime validators
 * But we only use them for static types (no runtime dependency)
 */

import { Type, Static } from '@sinclair/typebox';

// Font Style Schema
export const FontStyleSchema = Type.Object({
  name: Type.Optional(Type.String()),
  size: Type.Optional(Type.Number()),
  bold: Type.Optional(Type.Boolean()),
  italic: Type.Optional(Type.Boolean()),
  underline: Type.Optional(Type.Boolean()),
  strike: Type.Optional(Type.Boolean()),
  color: Type.Optional(Type.String()),
});

// Fill Style Schema
export const FillStyleSchema = Type.Object({
  type: Type.Optional(Type.Union([
    Type.Literal('pattern'),
    Type.Literal('gradient')
  ])),
  pattern: Type.Optional(Type.Union([
    Type.Literal('solid'),
    Type.Literal('none'),
    Type.Literal('gray125'),
    Type.Literal('darkHorizontal'),
    Type.Literal('darkVertical')
  ])),
  fgColor: Type.Optional(Type.String()),
  bgColor: Type.Optional(Type.String()),
});

// Border Style Schema
export const BorderStyleSchema = Type.Object({
  style: Type.Optional(Type.Union([
    Type.Literal('thin'),
    Type.Literal('medium'),
    Type.Literal('thick'),
    Type.Literal('double'),
    Type.Literal('dotted'),
    Type.Literal('dashed'),
    Type.Literal('none')
  ])),
  color: Type.Optional(Type.String()),
});

// Borders Style Schema
export const BordersStyleSchema = Type.Object({
  top: Type.Optional(BorderStyleSchema),
  left: Type.Optional(BorderStyleSchema),
  bottom: Type.Optional(BorderStyleSchema),
  right: Type.Optional(BorderStyleSchema),
  diagonal: Type.Optional(BorderStyleSchema),
  diagonalUp: Type.Optional(Type.Boolean()),
  diagonalDown: Type.Optional(Type.Boolean()),
});

// Alignment Style Schema
export const AlignmentStyleSchema = Type.Object({
  horizontal: Type.Optional(Type.Union([
    Type.Literal('left'),
    Type.Literal('center'),
    Type.Literal('right'),
    Type.Literal('fill'),
    Type.Literal('justify'),
    Type.Literal('centerContinuous'),
    Type.Literal('distributed')
  ])),
  vertical: Type.Optional(Type.Union([
    Type.Literal('top'),
    Type.Literal('middle'),
    Type.Literal('bottom'),
    Type.Literal('distributed'),
    Type.Literal('justify')
  ])),
  wrapText: Type.Optional(Type.Boolean()),
  shrinkToFit: Type.Optional(Type.Boolean()),
  indent: Type.Optional(Type.Number()),
  readingOrder: Type.Optional(Type.Number()),
  textRotation: Type.Optional(Type.Number()),
});

// Cell Style Schema
export const CellStyleSchema = Type.Object({
  font: Type.Optional(FontStyleSchema),
  fill: Type.Optional(FillStyleSchema),
  border: Type.Optional(BordersStyleSchema),
  alignment: Type.Optional(AlignmentStyleSchema),
  numFmt: Type.Optional(Type.String()),
});

// Pattern Context Schema
export const PatternContextSchema = Type.Object({
  rowIndex: Type.Number(),
  columnIndex: Type.Number(),
  value: Type.Any(),
  previousValue: Type.Optional(Type.Any()),
  rowData: Type.Record(Type.String(), Type.Any()),
  allData: Type.Array(Type.Record(Type.String(), Type.Any())),
  columnKey: Type.String(),
});

// Pattern Function type (can't be fully represented in TypeBox, so we define it separately)
export type PatternFunction = (context: Static<typeof PatternContextSchema>) => Partial<Static<typeof CellStyleSchema>> | null;

// Column Pattern Schema
export const ColumnPatternSchema = Type.Object({
  bgColorPattern: Type.Optional(Type.Union([Type.String(), Type.Any()])),
  textPattern: Type.Optional(Type.Union([Type.String(), Type.Any()])),
  custom: Type.Optional(Type.Array(Type.Union([Type.String(), Type.Any()]))),
});

// Row Style Override Schema
export const RowStyleOverrideSchema = Type.Record(Type.Number(), CellStyleSchema);

// Column Definition Schema
export const ColumnDefinitionSchema = Type.Object({
  key: Type.String(),
  header: Type.Optional(Type.String()),
  width: Type.Optional(Type.Union([Type.Number(), Type.Literal('auto')])),
  style: Type.Optional(CellStyleSchema),
  patterns: Type.Optional(ColumnPatternSchema),
  rows: Type.Optional(RowStyleOverrideSchema),
});

// Sheet Options Schema
export const SheetOptionsSchema = Type.Object({
  name: Type.String(),
  freezePane: Type.Optional(Type.Object({
    row: Type.Number(),
    column: Type.Number(),
  })),
  showGridLines: Type.Optional(Type.Boolean()),
  showRowColHeaders: Type.Optional(Type.Boolean()),
  defaultRowHeight: Type.Optional(Type.Number()),
  defaultStyle: Type.Optional(CellStyleSchema),
});

// Xldx Options Schema
export const XldxOptionsSchema = Type.Object({
  customPatterns: Type.Optional(Type.Record(Type.String(), Type.Any())),
  debug: Type.Optional(Type.Boolean()),
});

// Extract static types from schemas
export type FontStyle = Static<typeof FontStyleSchema>;
export type FillStyle = Static<typeof FillStyleSchema>;
export type BorderStyle = Static<typeof BorderStyleSchema>;
export type BordersStyle = Static<typeof BordersStyleSchema>;
export type AlignmentStyle = Static<typeof AlignmentStyleSchema>;
export type CellStyle = Static<typeof CellStyleSchema>;
export type PatternContext = Static<typeof PatternContextSchema>;
export type ColumnPattern = Static<typeof ColumnPatternSchema>;
export type RowStyleOverride = Static<typeof RowStyleOverrideSchema>;
export type ColumnDefinition = Static<typeof ColumnDefinitionSchema>;
export type SheetOptions = Static<typeof SheetOptionsSchema>;
export type XldxOptions = Static<typeof XldxOptionsSchema>;