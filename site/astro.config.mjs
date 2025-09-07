import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://jeffry.in",
  base: "/xldx",
  integrations: [mdx(), react()],
  trailingSlash: "never",

  vite: {
    plugins: [tailwindcss()],
  },
});
