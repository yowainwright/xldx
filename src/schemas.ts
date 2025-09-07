/**
 * Type definitions for XLDX
 * These are static types extracted from TypeBox schemas at build time
 * No runtime dependencies - TypeBox is only a devDependency
 */

// Import only the type definitions from TypeBox schemas
// The Static<T> utility extracts pure TypeScript types at compile time
import type { 
  FontStyle,
  FillStyle,
  BorderStyle,
  BordersStyle,
  AlignmentStyle,
  CellStyle,
  PatternContext,
  PatternFunction,
  ColumnPattern,
  RowStyleOverride,
  ColumnDefinition,
  SheetOptions,
  XldxOptions
} from './schemas-typebox';

// Re-export all types
export type {
  FontStyle,
  FillStyle,
  BorderStyle,
  BordersStyle,
  AlignmentStyle,
  CellStyle,
  PatternContext,
  PatternFunction,
  ColumnPattern,
  RowStyleOverride,
  ColumnDefinition,
  SheetOptions,
  XldxOptions
};

// Export aliases for backward compatibility
export type FontStyleSchema = FontStyle;
export type FillStyleSchema = FillStyle;
export type BorderStyleSchema = BorderStyle;
export type BordersStyleSchema = BordersStyle;
export type AlignmentStyleSchema = AlignmentStyle;
export type CellStyleSchema = CellStyle;
export type PatternContextSchema = PatternContext;
export type PatternFunctionSchema = PatternFunction;
export type ColumnPatternSchema = ColumnPattern;
export type RowStyleOverrideSchema = RowStyleOverride;
export type ColumnDefinitionSchema = ColumnDefinition;
export type SheetOptionsSchema = SheetOptions;
export type XldxOptionsSchema = XldxOptions;