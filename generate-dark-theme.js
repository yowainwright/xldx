import invert from 'invert-color';

const winterTheme = {
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
  "error-content": "#7F1D1D"
};

console.log('Dark theme (inverted):');
console.log('{');
console.log('  winterDark: {');

for (const [key, value] of Object.entries(winterTheme)) {
  // For content colors (text), just swap light/dark
  if (key.includes('content')) {
    const inverted = key.includes('base') || key.includes('neutral') 
      ? (value === '#FFFFFF' || value === '#E5E7EB' ? '#111827' : '#E5E7EB')
      : invert(value);
    console.log(`    "${key}": "${inverted}",`);
  } else {
    // For background colors, properly invert
    const inverted = invert(value);
    console.log(`    "${key}": "${inverted}",`);
  }
}

console.log('  }');
console.log('}');