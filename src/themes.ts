export interface ColorTheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;

  // Base palette for alternating colors
  base: {
    50: string; // Lightest
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // Mid
    600: string;
    700: string;
    800: string;
    900: string; // Darkest
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };

  // Background colors
  background: {
    default: string;
    paper: string;
    neutral: string;
  };
}

// Default theme inspired by Tailwind's color system
export const defaultTheme: ColorTheme = {
  primary: "FF3B82F6", // Blue-500
  secondary: "FF8B5CF6", // Violet-500
  success: "FF10B981", // Emerald-500
  warning: "FFF59E0B", // Amber-500
  error: "FFEF4444", // Red-500
  info: "FF06B6D4", // Cyan-500

  base: {
    50: "FFF9FAFB", // Gray-50
    100: "FFF3F4F6", // Gray-100
    200: "FFE5E7EB", // Gray-200
    300: "FFD1D5DB", // Gray-300
    400: "FF9CA3AF", // Gray-400
    500: "FF6B7280", // Gray-500
    600: "FF4B5563", // Gray-600
    700: "FF374151", // Gray-700
    800: "FF1F2937", // Gray-800
    900: "FF111827", // Gray-900
  },

  text: {
    primary: "FF111827", // Gray-900
    secondary: "FF6B7280", // Gray-500
    disabled: "FF9CA3AF", // Gray-400
    inverse: "FFFFFFFF", // White
  },

  background: {
    default: "FFFFFFFF", // White
    paper: "FFF9FAFB", // Gray-50
    neutral: "FFF3F4F6", // Gray-100
  },
};

// Pastel theme for softer colors
export const pastelTheme: ColorTheme = {
  primary: "FFBFDBFE", // Blue-200
  secondary: "FFDDD6FE", // Violet-200
  success: "FFA7F3D0", // Emerald-200
  warning: "FFFDE68A", // Amber-200
  error: "FFFECACA", // Red-200
  info: "FFA5F3FC", // Cyan-200

  base: {
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
  },

  text: {
    primary: "FF374151",
    secondary: "FF6B7280",
    disabled: "FFD1D5DB",
    inverse: "FFFFFFFF",
  },

  background: {
    default: "FFFFFFFF",
    paper: "FFFEFEFE",
    neutral: "FFFAFAFA",
  },
};

// Dark theme
export const darkTheme: ColorTheme = {
  primary: "FF60A5FA", // Blue-400
  secondary: "FFA78BFA", // Violet-400
  success: "FF34D399", // Emerald-400
  warning: "FFFBBF24", // Amber-400
  error: "FFF87171", // Red-400
  info: "FF22D3EE", // Cyan-400

  base: {
    50: "FF18181B", // Zinc-900
    100: "FF27272A", // Zinc-800
    200: "FF3F3F46", // Zinc-700
    300: "FF52525B", // Zinc-600
    400: "FF71717A", // Zinc-500
    500: "FFA1A1AA", // Zinc-400
    600: "FFD4D4D8", // Zinc-300
    700: "FFE4E4E7", // Zinc-200
    800: "FFF4F4F5", // Zinc-100
    900: "FFFAFAFA", // Zinc-50
  },

  text: {
    primary: "FFF4F4F5",
    secondary: "FFA1A1AA",
    disabled: "FF71717A",
    inverse: "FF18181B",
  },

  background: {
    default: "FF09090B",
    paper: "FF18181B",
    neutral: "FF27272A",
  },
};

// High contrast theme for accessibility
export const highContrastTheme: ColorTheme = {
  primary: "FF0000FF", // Pure Blue
  secondary: "FF800080", // Purple
  success: "FF008000", // Green
  warning: "FFFFA500", // Orange
  error: "FFFF0000", // Red
  info: "FF00FFFF", // Cyan

  base: {
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
  },

  text: {
    primary: "FF000000",
    secondary: "FF404040",
    disabled: "FF808080",
    inverse: "FFFFFFFF",
  },

  background: {
    default: "FFFFFFFF",
    paper: "FFF0F0F0",
    neutral: "FFE0E0E0",
  },
};

export const themes = {
  default: defaultTheme,
  pastel: pastelTheme,
  dark: darkTheme,
  highContrast: highContrastTheme,
};

export type ThemeName = keyof typeof themes;
