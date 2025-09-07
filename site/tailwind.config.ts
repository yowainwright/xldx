import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit Variable', 'sans-serif'],
        xldx: ['Inter', 'sans-serif'],
        brand: ['Inter', 'sans-serif'],
      },
      colors: {
        'brand-blue': '#0EA5E9',
        'primary-blue': '#0EA5E9',
        'primary-gray': '#F3F4F6',
      },
      spacing: {
        'header-height': '4rem',
        'sidebar-width': '20rem',
        'footer-height': '4rem',
      },
      zIndex: {
        'nav': '50',
      },
    },
  },
  plugins: [
    typography,
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        winter: {
          "primary": "#0EA5E9",
          "primary-content": "#FFFFFF", 
          "secondary": "#F472B6",
          "secondary-content": "#4C1D95",
          "accent": "#FBBF24",
          "accent-content": "#78350F",
          "neutral": "#1F2937",
          "neutral-content": "#E5E7EB",
          "base-100": "#FFFFFF",
          "base-200": "#F3F4F6",
          "base-300": "#E5E7EB",
          "base-content": "#111827",
          "info": "#67E8F9",
          "info-content": "#164E63",
          "success": "#A3E635",
          "success-content": "#3F6212",
          "warning": "#FACC15",
          "warning-content": "#713F12",
          "error": "#FCA5A5",
          "error-content": "#7F1D1D",
        },
        winterDark: {
          "primary": "#f15a16",
          "primary-content": "#000000",
          "secondary": "#0b8d49", 
          "secondary-content": "#b3e26a",
          "accent": "#0440db",
          "accent-content": "#87caf0",
          "neutral": "#e0d6c8",
          "neutral-content": "#111827",
          "base-100": "#000000",
          "base-200": "#0c0b09",
          "base-300": "#1a1814",
          "base-content": "#E5E7EB",
          "info": "#981706",
          "info-content": "#e9b19c",
          "success": "#5c19ca",
          "success-content": "#c09ded",
          "warning": "#0533ea",
          "warning-content": "#8ec0ed",
          "error": "#035a5a",
          "error-content": "#80e2e2",
        }
      }
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}

export default config