import type { ColorTheme } from "./types.js";
const defaultBase: ColorTheme["base"] = {
  50: "FFF9FAFB",
  100: "FFF3F4F6",
  200: "FFE5E7EB",
  300: "FFD1D5DB",
  400: "FF9CA3AF",
  500: "FF6B7280",
  600: "FF4B5563",
  700: "FF374151",
  800: "FF1F2937",
  900: "FF111827",
};
const defaultText: ColorTheme["text"] = {
  primary: "FF111827",
  secondary: "FF6B7280",
  disabled: "FF9CA3AF",
  inverse: "FFFFFFFF",
};
const defaultBackground: ColorTheme["background"] = {
  default: "FFFFFFFF",
  paper: "FFF9FAFB",
  neutral: "FFF3F4F6",
};
export const defaultTheme: ColorTheme = {
  primary: "FF3B82F6",
  secondary: "FF8B5CF6",
  success: "FF10B981",
  warning: "FFF59E0B",
  error: "FFEF4444",
  info: "FF06B6D4",
  base: defaultBase,
  text: defaultText,
  background: defaultBackground,
};
const pastelBase: ColorTheme["base"] = {
  50: "FFFEFEFE",
  100: "FFFAFAFA",
  200: "FFF5F5F5",
  300: "FFEEEEEE",
  400: "FFE0E0E0",
  500: "FFD0D0D0",
  600: "FFBEBEBE",
  700: "FFA8A8A8",
  800: "FF909090",
  900: "FF707070",
};
const pastelText: ColorTheme["text"] = {
  primary: "FF374151",
  secondary: "FF6B7280",
  disabled: "FFD1D5DB",
  inverse: "FFFFFFFF",
};
const pastelBackground: ColorTheme["background"] = {
  default: "FFFFFFFF",
  paper: "FFFEFEFE",
  neutral: "FFFAFAFA",
};
export const pastelTheme: ColorTheme = {
  primary: "FFBFDBFE",
  secondary: "FFDDD6FE",
  success: "FFA7F3D0",
  warning: "FFFDE68A",
  error: "FFFECACA",
  info: "FFA5F3FC",
  base: pastelBase,
  text: pastelText,
  background: pastelBackground,
};
const darkBase: ColorTheme["base"] = {
  50: "FF18181B",
  100: "FF27272A",
  200: "FF3F3F46",
  300: "FF52525B",
  400: "FF71717A",
  500: "FFA1A1AA",
  600: "FFD4D4D8",
  700: "FFE4E4E7",
  800: "FFF4F4F5",
  900: "FFFAFAFA",
};
const darkText: ColorTheme["text"] = {
  primary: "FFF4F4F5",
  secondary: "FFA1A1AA",
  disabled: "FF71717A",
  inverse: "FF18181B",
};
const darkBackground: ColorTheme["background"] = {
  default: "FF09090B",
  paper: "FF18181B",
  neutral: "FF27272A",
};
export const darkTheme: ColorTheme = {
  primary: "FF60A5FA",
  secondary: "FFA78BFA",
  success: "FF34D399",
  warning: "FFFBBF24",
  error: "FFF87171",
  info: "FF22D3EE",
  base: darkBase,
  text: darkText,
  background: darkBackground,
};
const highContrastBase: ColorTheme["base"] = {
  50: "FFFFFFFF",
  100: "FFF0F0F0",
  200: "FFE0E0E0",
  300: "FFC0C0C0",
  400: "FFA0A0A0",
  500: "FF808080",
  600: "FF606060",
  700: "FF404040",
  800: "FF202020",
  900: "FF000000",
};
const highContrastText: ColorTheme["text"] = {
  primary: "FF000000",
  secondary: "FF404040",
  disabled: "FF808080",
  inverse: "FFFFFFFF",
};
const highContrastBackground: ColorTheme["background"] = {
  default: "FFFFFFFF",
  paper: "FFF0F0F0",
  neutral: "FFE0E0E0",
};
export const highContrastTheme: ColorTheme = {
  primary: "FF0000FF",
  secondary: "FF800080",
  success: "FF008000",
  warning: "FFFFA500",
  error: "FFFF0000",
  info: "FF00FFFF",
  base: highContrastBase,
  text: highContrastText,
  background: highContrastBackground,
};
export const themes = {
  default: defaultTheme,
  pastel: pastelTheme,
  dark: darkTheme,
  highContrast: highContrastTheme,
};
